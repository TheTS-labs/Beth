import dotenv from "dotenv";
import express, { Express, Response } from "express";
import asyncHandler from "express-async-handler";
import knex, { Knex } from "knex";
import asyncMiddleware from "middleware-async";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "./common/base_endpoint";
import { RequestWithUser } from "./common/types";
import ENV, { Config } from "./Config";
import knexfile from "./knexfile";
import Logger from "./Logger";
import AuthenticationMiddleware from "./middlewares/AuthenticationMiddleware";
import ErrorMiddleware from "./middlewares/ErrorMiddleware";
import PermissionMiddleware from "./middlewares/PermissionMiddleware";
import Redis from "./Redis";

dotenv.config();

export interface TEndpointTypes {
  [key: string]: typeof IBaseEndpoint
}
export interface TEndpointObjects {
  [key: string]: IBaseEndpoint
}

export default class App {
  app: Express = express();
  config: ENV = new Config(process.env).getConfig();
  db: Knex;
  redisClient: RedisClientType;
  endpoints: TEndpointObjects = {};
  logger: winston.Logger = new Logger().get();

  // >>> Middlewares >>>
  authenticationMiddleware: AuthenticationMiddleware;
  permissionMiddleware: PermissionMiddleware;
  errorMiddleware: ErrorMiddleware;
  // <<< Middlewares <<<

  //! Disabling auth you also disabling permission check
  constructor(endpoints: TEndpointTypes, disableAuthFor:string[]=[]) {
    this.db = knex(knexfile[this.config.NODE_ENV]);
    this.redisClient = new Redis(this.logger, this.config).get();

    // >>> Middlewares >>>
    this.authenticationMiddleware = new AuthenticationMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.permissionMiddleware = new PermissionMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.errorMiddleware = new ErrorMiddleware(this.logger);
    // <<< Middlewares <<<

    this.setupApp(endpoints, disableAuthFor);
  }

  registerRouters(): App {
    this.logger.info("[App] Registering endpoint objects");
    Object.keys(this.endpoints).map((routerName: string) => {
      this.app.post(`${routerName}/:endPoint`, asyncHandler(async (req: RequestWithUser, res: Response) => {
        this.logger.debug(
          `[App] Incoming request to ${routerName}/${req.params.endPoint}: ${JSON.stringify(req.body)}`
        );

        const classObject = this.endpoints[routerName];
        const result = await classObject.callEndpoint(req.params.endPoint, req.body, req.user);

        this.logger.debug(`[App] Request result: ${JSON.stringify(result)}`);

        res.json(result);
      })
    );

    this.logger.debug(`[App] The ${routerName} endpoint object is registered`);
    });

    this.logger.debug("[App] Enabling the error-catching middleware");
    this.app.use(this.errorMiddleware.middleware.bind(this.errorMiddleware));

    return this;
  }

  private setupApp(endpoints: TEndpointTypes, disableAuthFor: string[]): void {
    this.logger.info("[App] Configure the application settings and enable the middlewares");
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(asyncMiddleware(this.authenticationMiddleware.middleware(disableAuthFor)));
    this.app.use(asyncMiddleware(this.permissionMiddleware.middleware()));

    this.logger.info("[App] Create endpoint objects");
    Object.keys(endpoints).map((routerName: string) => {
      const endpointClass = endpoints[routerName];
      const endpointClassObject = new endpointClass(
        this.db,
        this.redisClient,
        this.logger,
        this.config
      );

      this.endpoints[routerName] = endpointClassObject;

      this.logger.debug(`[App] The ${routerName} endpoint object is created`);
    });
  }

  listen(): void {
    this.app.listen(process.env.APP_PORT, () => {
      this.logger.info(`[App] Server is running at http://localhost:${this.config.APP_PORT}`);
    });
  }
}
