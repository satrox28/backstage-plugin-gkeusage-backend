import { BigQuery } from "@google-cloud/bigquery";

export async function costQuery(
  projectID: string,
  dataSet: string,
  namespace: string,
  labelKey: string,
  labelValue: string,
  billingTable: string,
  credential: string,
  maxAge: string
) {
  const authOptions = {
    keyFilename: credential,
    projectId: projectID,
  };
  const bigquery = new BigQuery(authOptions);

  const clusterResource = `${projectID}.${dataSet}.gke_cluster_resource_usage`;

  const query = `
  DECLARE drilldown_label STRING DEFAULT '${labelKey}';
  DECLARE project_id STRING default "${projectID}";
  
  SELECT
    DATE(start_time) as date,
    resource_usage.cluster_name,
    resource_usage.cluster_location,
    resource_usage.namespace,
    label.value AS value,
    resource_usage.resource_name,
    resource_usage.sku_id,
    gcp_billing_export.sku_description,
    SUM(resource_usage.usage.amount) AS usage,
    resource_usage.usage.unit AS usage_unit,
    SUM(resource_usage.usage.amount * gcp_billing_export.rate) AS cost,
    gcp_billing_export.currency
  FROM
    \`${clusterResource}\` AS resource_usage
  
  -- select only workloads matching the defined "drilldown_label"
    CROSS JOIN UNNEST(labels) AS label ON label.key=drilldown_label
  
  -- join with billing table to get pricing information and sku description
    LEFT JOIN (
    SELECT
      DATE(usage_start_time) as date,
      sku.id AS sku_id,
      sku.description AS sku_description,
      SAFE_DIVIDE(SUM(cost), SUM(usage.amount)) AS rate,
      currency
    FROM
    \`${billingTable}\`
   
    WHERE
     project.id = project_id
    GROUP BY
      date,
      sku_id,
      sku_description,
      currency) AS gcp_billing_export
    ON DATE(resource_usage.start_time) = gcp_billing_export.date AND resource_usage.sku_id = gcp_billing_export.sku_id
  WHERE namespace = '${namespace}' AND value ='${labelValue}' AND date  > DATE(TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${maxAge} DAY))
  
  GROUP BY
    date,
    cluster_name,
    cluster_location,
    namespace,
    value,
    resource_name,
    sku_id,
    sku_description,
    usage_unit,
    currency
  
  ORDER BY
    date,
    cluster_name,
    cluster_location,
    namespace,
    value,
    resource_name
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

  rows.forEach(function addrows(row: any) {
    cost.push(row);
  });

  return cost;
}
