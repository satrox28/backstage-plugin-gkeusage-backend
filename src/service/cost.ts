export async function costQuery(
  projectID: string,
  dataSet: string,
  namespace: string,
  labelKey: string,
  labelValue: string,
  billingTable: string,
) {
  const { BigQuery } = require('@google-cloud/bigquery');

  const authOptions = {
    keyFilename: './es-standalone-cb21-39a548d04291.json',
    projectId: projectID,
  };
  const bigquery = new BigQuery(authOptions);

  const clusterResource =
    projectID + '.' + dataSet + '.gke_cluster_resource_usage';

  const query = `
    SELECT
    resource_usage.cluster_name,
    resource_usage.cluster_location,
    resource_usage.namespace,
    resource_usage.resource_name,
    resource_usage.sku_id,
    label.value AS value,
    MIN(resource_usage.start_time) AS usage_start_time,
    MAX(resource_usage.end_time) AS usage_end_time,
    SUM(resource_usage.usage.amount * gcp_billing_export.rate) AS cost,
    gcp_billing_export.currency
  FROM
    \`${clusterResource}\` AS resource_usage
    CROSS JOIN
    UNNEST(labels) AS label
  ON
    label.key='${labelKey}'
  LEFT JOIN (
    SELECT
      sku.id AS sku_id,
      SUM(cost) / SUM(usage.amount) AS rate,
      MIN(usage_start_time) AS min_usage_start_time,
      MAX(usage_end_time) AS max_usage_end_time,
      currency
    FROM
      \`${billingTable}\`
    WHERE
      project.id = "${projectID}"
    GROUP BY
      sku_id,
      currency) AS gcp_billing_export
  ON
    resource_usage.sku_id = gcp_billing_export.sku_id
  WHERE
    namespace = '${namespace}'
    AND value = '${labelValue}'
  GROUP BY
    resource_usage.cluster_name,
    resource_usage.cluster_location,
    resource_usage.namespace,
    resource_usage.resource_name,
    resource_usage.sku_id,
    gcp_billing_export.currency,
    value
      `;

  // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
  };

  // Run the query as a job
  const [job] = await bigquery.createQueryJob(options);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  const cost: any = [];

  rows.forEach(function (row: any) {
    cost.push(row);
  });

  return cost;
}
