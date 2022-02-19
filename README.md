# GKE Usage backend

Welcome to the gkeusage backend plugin!


## Setup & Configuration
This plugin must be explicitly added to a Backstage app, along with it's peer frontend plugin.

The plugin requires configuration in the Backstage app-config.yaml to connect googles bigquery API.

```yaml
gkeUsage:
  billingTable: billingProjectId.billingDataSetId.billingTableId
  google_application_credentials: 
    $env: GOOGLE_APPLICATION_CREDENTIALS

```

In addition, configuration of an entity's catalog-info.yaml helps identify which specific cost of  a service/app within GPC this should be presented on a specific entity catalog page.


## Installation

```
# From your Backstage root directory
cd packages/backend
yarn add @bestseller/backstage-plugin-gkeusage-backend
```

Create a new file named `packages/backend/src/plugins/gkeusage.ts`, and add the following to it

```
import { createRouter } from '@bestsellerit/backstage-plugin-gkeusage-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  config,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({ logger, config });
}
```

And finally, wire this into the overall backend router. Edit `packages/backend/src/index.ts`

```
import gkeusage from './plugins/gkeusage';
// ...
async function main() {
  // ...
  const gkeusageEnv = useHotMemoize(module, () => createEnv('gkeusage'));
  apiRouter.use('/gkeusage', await carmen(gkeusageEnv));

```

After you start the backend (e.g. using `yarn start-backend` from the repo root), you should be able to fetch data from it.

# Note the extra /api here
curl localhost:7000/api/gkeusage/health
This should return {"status":"ok"} like before. Success!

