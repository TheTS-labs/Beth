import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import knex, { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "./common/base_endpoint";
import knexfile from "./db/knexfile";
import UserEndpoint from "./endpoints/user/user_endpoint";
import Logger from "./Logger";
import Redis from "./Redis";

dotenv.config();

interface TEndpointTypes { [key: string]: typeof IBaseEndpoint }
interface TEndpointObjects { [key: string]: IBaseEndpoint }

class App {
  db: Knex;
  redisClient: RedisClientType;
  app: Express;
  endpoints: TEndpointObjects = {};
  logger: winston.Logger;

  constructor(endpoints: TEndpointTypes) {
    this.app = express();
    this.logger = new Logger().get();
    this.db = knex(knexfile[process.env.NODE_ENV || "development"]);
    this.redisClient = new Redis(this.logger).get();

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    Object.keys(endpoints).map((routerName: string) => {
      this.logger.debug(`[app] Creating ${routerName} object...`);
      this.endpoints[routerName] = new endpoints[routerName](
        this.db,
        this.redisClient,
        this.logger
      );
    });
  }

  registerRouters(): App {
    Object.keys(this.endpoints).map((routerName: string) => {
      this.app.post(`${routerName}/:endPoint`, async (req: Request, res: Response) => {
        const endpoint = this.endpoints[routerName];
        const result = await endpoint.callEndpoint(req.params.endPoint, req.body);

        this.logger.debug(`[App] Request result: ${JSON.stringify(result)}`);

        res.json(result);
      });

      this.logger.info(`[endpoints]: ${routerName} router was registered`);
    });

    return this;
  }

  listen(): void {
    this.app.listen(process.env.APP_PORT, () => {
      this.logger.info(`[server]: Server is running at http://localhost:${process.env.APP_PORT}`);
    });
  }
}

const endpoints: TEndpointTypes = {
  "/user": UserEndpoint
};

new App(endpoints).registerRouters().listen();