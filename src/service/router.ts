/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { costQuery } from './cost';
import { usageQuery } from './usage';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const logger = options.logger;

  logger.info('Initializing GKE usage metering backend');
  const billingTable = options.config.getString(
    'gkeUsageMetering.billingTable',
  );

  const router = Router();
  router.use(express.json());

  router.get('/cost', async (request, response) => {
    const projectID: any = request.query.projectid;
    const dataSet: any = request.query.dataset;
    const namespace: any = request.query.namespace;
    const labelKey: any = request.query.labelKey;
    const labelValue: any = request.query.labelValue;

    const cost = await costQuery(
      projectID,
      dataSet,
      namespace,
      labelKey,
      labelValue,
      billingTable,
    );

    response.send(cost);
  });

  router.get('/usage', async (request, response) => {
    const projectID: any = request.query.projectid;
    const dataSet: any = request.query.dataset;
    const namespace: any = request.query.namespace;
    const labelKey: any = request.query.labelKey;
    const labelValue: any = request.query.labelValue;

    const usage = await usageQuery(
      projectID,
      dataSet,
      namespace,
      labelKey,
      labelValue,
    );

    response.send(usage);
  });

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
