import { getVoidLogger } from "@backstage/backend-common";
import { ConfigReader } from "@backstage/config";
import express from "express";
import request from "supertest";
import { createRouter } from "./router";

describe("createRouter", () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      config: new ConfigReader({
        gkeUsage: {
          billingTable: "projectid.datasetid.tableid",
          google_application_credentials: "./path/to/creds.json",
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
