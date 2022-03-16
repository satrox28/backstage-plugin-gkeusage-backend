import { getVoidLogger } from "@backstage/backend-common";
import { ConfigReader } from "@backstage/config";
import express from "express";
import request from "supertest";
import { QueryString } from "../test/query";
import { createRouter } from "./router";
import * as UsageService from "./usage";

const mockUsageData: any = [
  {
    key: "app",
    value: "service1",
    namespace: "default",
    resource_name: "networkEgress",
    requested_amount: 0,
    consumed_amount: null,
    unit: "bytes",
    consumption_percentage: 0,
  },
  {
    key: "app",
    value: "service1",
    namespace: "default",
    resource_name: "memory",
    requested_amount: 93616865386239.61,
    consumed_amount: 5012891320320,
    unit: "byte-seconds",
    consumption_percentage: 5.35468828147372,
  },
  {
    key: "app",
    value: "service1",
    namespace: "default",
    resource_name: "cpu",
    requested_amount: 44640.000050659,
    consumed_amount: 468.32999999999765,
    unit: "seconds",
    consumption_percentage: 1.0491263428954318,
  },
];

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

  describe("GET /usage", () => {
    jest.spyOn(UsageService, "usageQuery").mockReturnValueOnce(mockUsageData);

    it("returns usage for the last 30 days", async () => {
      const response = await request(app).get("/usage").query(QueryString);

      expect(response.statusCode).toEqual(200);
      expect(response.body).toStrictEqual(mockUsageData);
    });
  });
});
