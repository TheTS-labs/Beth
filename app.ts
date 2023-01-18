import dotenv from "dotenv";
import express, { Express, Request, Response, Router } from "express";
import knex, { Knex } from "knex";
import { createClient as createRedisClient, RedisClientType } from "redis";
import winston, { format } from "winston";

import knexfile from "./db/knexfile";
import { IBaseEndpoint } from "./endpoints/base_endpoint";
import UserEndpoint from "./endpoints/user_endpoint";

dotenv.config();

interface TEndpointTypes { [key: string]: typeof IBaseEndpoint }
interface TEndpointObjects { [key: string]: IBaseEndpoint }

class App {
  db: Knex;
  redisClient: RedisClientType;
  app: Express;
  endpoints: TEndpointObjects = {};
  port: string;
  logger: winston.Logger;

  constructor(db: Knex, redisClient: RedisClientType, app: Express, endpoints: TEndpointTypes, logger: winston.Logger, port="8080") {
    this.db = db;
    this.redisClient = redisClient;
    this.app = app;
    this.logger = logger;
    this.port = port;

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    Object.keys(endpoints).map((routerName: string) => {
      this.endpoints[routerName] = new endpoints[routerName](
        this.db,
        this.redisClient,
        this.logger
      );
    });
  }

  registerRouters(): App {
    Object.keys(this.endpoints).map((routerName: string) => {
      const endpointRouter = Router();

      endpointRouter.post("/:endPoint", async (req: Request, res: Response) => {
        const endpoint = this.endpoints[routerName];

        await endpoint.callEndpoint(req.params.endPoint, req, res);
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
  redisClient.on("ready", () => { logger.info("[redis]: The client successfully initiated the connection to the server"); });
  redisClient.on("reconnecting", () => { logger.warn("[redis]: The client is trying to reconnect to the server..."); });
  redisClient.on("end", () => { logger.warn("[redis]: The client disconnected the connection to the server via .quit() or .disconnect()"); });
  await redisClient.connect();

  const app: Express = express();
  const db = knex(knexfile[process.env.NODE_ENV || "development"]);
  const endpoints: TEndpointTypes = {
    "/user": UserEndpoint
  };

  new App(db, redisClient, app, endpoints, logger, process.env.APP_PORT).registerRouters().listen();
})();