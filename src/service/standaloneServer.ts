import { createServiceBuilder } from "@backstage/backend-common";
import { ConfigReader } from "@backstage/config";
import { Server } from "http";
import { Logger } from "winston";
import { createRouter } from "./router";

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: Logger;
}
export async function startStandaloneServer(
  options: ServerOptions
): Promise<Server> {
  const logger = options.logger.child({
    service: "gkeuage-backend",
  });
  logger.debug("Starting application server...");
  const router = await createRouter({
    logger,
    config: new ConfigReader({
      gkeUsage: {
        billingTable: process.env.APP_CONFIG_gkeUsage_billingTable,
        google_application_credentials:
          process.env.GOOGLE_APPLICATION_CREDENTIALS,
      },
    }),
  });

  const service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter("/", router);

  return await service.start().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();
