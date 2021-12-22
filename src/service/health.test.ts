import request from "supertest";
import { createRouter } from "./router";
import express from "express";
import { ConfigReader } from "@backstage/config";
import { getVoidLogger } from "@backstage/backend-common";

describe("createRouter", () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      config: new ConfigReader({
        gkeUsage: {
          billingTable: process.env.APP_CONFIG_gkeUsage_billingTable,
          google_application_credentials:
            process.env.GOOGLE_APPLICATION_CREDENTIALS,
        },
      }),
    });
    app = express().use(router);
  });

  describe("GET /health", () => {
    it("returns ok", async () => {
      const response = await request(app).get("/health");

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ status: "ok" });
    });
  });

});
