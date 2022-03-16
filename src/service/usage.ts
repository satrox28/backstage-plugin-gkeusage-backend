import { BigQuery } from "@google-cloud/bigquery";

export async function usageQuery(
  projectID: string,
  jobprojectID: string,
  dataSet: string,
  namespace: string,
  labelKey: string,
  labelValue: string,
  credential: string,
  maxAge: string
) {
  const authOptions = {
    keyFilename: credential,
    projectId: jobprojectID,
  };

  const bigquery = new BigQuery(authOptions);

  const usageTable = `${projectID}.${dataSet}.gke_cluster_resource_usage`;

  const consumptionTable = `${projectID}.${dataSet}.gke_cluster_resource_consumption`;

  const query = `
    WITH
  constraints AS (
  SELECT
    TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${maxAge} DAY) AS min_time,
    CURRENT_TIMESTAMP() AS max_time),
  request_based_amount_by_namespace AS (
  SELECT
    namespace,
    resource_name,
    label.key AS key,
    label.value AS value,
    SUM(usage.amount) AS requested_amount,
    usage.unit AS unit
  FROM
    \`${usageTable}\` AS requested_resource_usage,
    UNNEST (labels) AS label
  INNER JOIN
    constraints
  ON
    requested_resource_usage.start_time >= constraints.min_time
    AND requested_resource_usage.end_time <= constraints.max_time
  -- AND requested_resource_usage.project.id = constraints.project_id
  GROUP BY
    namespace,
    key,
    value,
    resource_name,
    usage.unit ),
  consumption_based_amount_by_namespace AS (
  SELECT
    namespace,
    resource_name,
    SUM(usage.amount) AS consumed_amount,
    usage.unit AS unit,
    label.key AS key,
    label.value AS value,
  FROM
    \`${consumptionTable}\` AS consumed_resource_usage,
    UNNEST (labels) AS label
  INNER JOIN
    constraints
  ON
    consumed_resource_usage.start_time >= constraints.min_time
    AND consumed_resource_usage.end_time <= constraints.max_time
  --  AND consumed_resource_usage.project.id = constraints.project_id
  GROUP BY
    key,
    value,
    namespace,
    resource_name,
    usage.unit )
SELECT
  request_based_amount_by_namespace.key,
  request_based_amount_by_namespace.value,
  request_based_amount_by_namespace.namespace,
  request_based_amount_by_namespace.resource_name,
  requested_amount,
  consumed_amount,
  request_based_amount_by_namespace.unit,
  CASE
    WHEN consumed_amount IS NULL THEN 0
    WHEN requested_amount = 0 THEN 0
  ELSE
  consumed_amount / requested_amount * 100
END
  AS consumption_percentage
FROM
  request_based_amount_by_namespace
FULL JOIN
  consumption_based_amount_by_namespace
ON
  request_based_amount_by_namespace.namespace = consumption_based_amount_by_namespace.namespace
  AND request_based_amount_by_namespace.resource_name = consumption_based_amount_by_namespace.resource_name
  AND request_based_amount_by_namespace.key = consumption_based_amount_by_namespace.key
  AND request_based_amount_by_namespace.value = consumption_based_amount_by_namespace.value
WHERE
  request_based_amount_by_namespace.namespace = '${namespace}'
  AND request_based_amount_by_namespace.key = '${labelKey}'
  AND request_based_amount_by_namespace.value = '${labelValue}'
GROUP BY
  request_based_amount_by_namespace.resource_name,
  request_based_amount_by_namespace.key,
  request_based_amount_by_namespace.value,
  request_based_amount_by_namespace.namespace,
  requested_amount,
  consumed_amount,
  key,
  value,
  request_based_amount_by_namespace.unit
    `;

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
