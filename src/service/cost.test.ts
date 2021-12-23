import request from "supertest";
import { createRouter } from "./router";
import express from "express";
import { ConfigReader } from "@backstage/config";
import { getVoidLogger } from "@backstage/backend-common";
import * as CostService from "./cost";
import { QueryString } from "../test/query";

const mockCostData: any = [
  {
    date: {
      value: "2021-12-22",
    },
    cluster_name: "cluster1",
    cluster_location: "europe-west4",
    namespace: "default",
    value: "service1",
    resource_name: "cpu",
    sku_id: "F052-0029-BECD",
    sku_description: "Custom Instance Core running in Netherlands",
    usage: 28080.000032493204,
    usage_unit: "seconds",
    cost: 0.18750172627419137,
    currency: "EUR",
  },
  {
    date: {
      value: "2021-12-22",
    },
    cluster_name: "cluster1",
    cluster_location: "europe-west4",
    namespace: "default",
    value: "service1",
    resource_name: "memory",
    sku_id: "874F-A8D5-0916",
    sku_description: "Custom Instance Ram running in Netherlands",
    usage: 58888028228143.19,
    usage_unit: "byte-seconds",
    cost: 0.04907773679268278,
    currency: "EUR",
  },
];

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

  describe("GET /cost", () => {
    jest.spyOn(CostService, "costQuery").mockReturnValueOnce(mockCostData);

    it("return cost for the last", async () => {
      const response = await request(app).get("/cost").query(QueryString);

      if (response.statusCode === 500) {
        console.log(response.body);
      }
      expect(response.statusCode).toEqual(200);

      expect(response.body).toStrictEqual(mockCostData);
    });
  });
});
