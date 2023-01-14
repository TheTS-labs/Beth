import dotenv from "dotenv";
import express, { Express, Request, Response, Router } from "express";
import knex, { Knex } from "knex";
import { createClient as createRedisClient, RedisClientType } from "redis";
import winston, { format } from "winston";

import knexfile from "./db/knexfile";
import { IBaseEndpoint } from "./endpoints/base_endpoint";
import Create from "./endpoints/user/create";
import EditPassword from "./endpoints/user/edit_password";
import View from "./endpoints/user/view";

dotenv.config();

interface TEndpoints {
  [key: string]: { // routerName
    [key: string]: typeof IBaseEndpoint // endpointName
  }
}

class App {
  db: Knex;
  redisClient: RedisClientType;
  app: Express;
  endpoints: TEndpoints;
  port: string;
  logger: winston.Logger;

  constructor(db: Knex, redisClient: RedisClientType, app: Express, endpoints: TEndpoints, logger: winston.Logger, port="8080") {
    this.db = db;
    this.redisClient = redisClient;
    this.app = app;
    this.endpoints = endpoints;
    this.logger = logger;
    this.port = port;

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  registerRouters(): App {
    Object.keys(this.endpoints).map((routerName: string) => {
      const endpointRouter = Router();

      endpointRouter.post("/:endPoint", async (req: Request, res: Response) => {
        if (!(req.params.endPoint in this.endpoints[routerName])) {
          res.status(404).json({
            message: "EndpointNotFound",
            error: `Endpoint ${routerName}/${req.params.endPoint} does not exist`
          }); return;
        }

        const endpoint = new this.endpoints[routerName][req.params.endPoint](
          req, res, this.db,
          this.redisClient,
          this.logger
        );

        await endpoint.call();
      });

      this.app.use(routerName, endpointRouter);
      this.logger.info(`[endpoints]: ${routerName} router was registered`);
    });

    return this;
  }

  listen(): void {
    this.app.listen(this.port, () => {
      this.logger.info(`[server]: Server is running at http://localhost:${this.port}`);
    });
  }
}

(async (): Promise<void> => {
  const logger = winston.createLogger({
    level: "info",
    format: format.combine(
      format.colorize(),
      format.printf(({ level, message }) => { return `${level} ${message}`; })
    ),
    transports: [
      new winston.transports.Console()
    ],
  });

  const redisClient: RedisClientType = createRedisClient();
  redisClient.on("error", (error) => { logger.error(`[redis]: ${error}`); process.exit(1); });
  await redisClient.connect();

  const app: Express = express();
  const db = knex(knexfile[process.env.NODE_ENV || "development"]);
  const endpoints: TEndpoints = {
    "/user": {
      "create": Create,
      "view": View,
      "edit_password": EditPassword,
      // "delete": Delete,
    }
  };

  new App(db, redisClient, app, endpoints, logger, process.env.APP_PORT).registerRouters().listen();
})();