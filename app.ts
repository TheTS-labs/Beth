import dotenv from "dotenv";
import express, { Express, Response } from "express";
import asyncHandler from "express-async-handler";
import knex, { Knex } from "knex";
import asyncMiddleware from "middleware-async";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "./common/base_endpoint";
import { RequestWithUser } from "./common/types";
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
  db: Knex = knex(knexfile[process.env.NODE_ENV || "development"]);
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
    this.redisClient = new Redis(this.logger).get();

    // >>> Middlewares >>>
    this.authenticationMiddleware = new AuthenticationMiddleware(this.logger, this.db);
    this.permissionMiddleware = new PermissionMiddleware(this.logger, this.db);
    this.errorMiddleware = new ErrorMiddleware(this.logger);
    // <<< Middlewares <<<

    this.setupApp(endpoints, disableAuthFor);
  }

  registerRouters(): App {
    Object.keys(this.endpoints).map((routerName: string) => {
      this.app.post(`${routerName}/:endPoint`, asyncHandler(async (req: RequestWithUser, res: Response) => {
        const classObject = this.endpoints[routerName];
        const result = await classObject.callEndpoint(req.params.endPoint, req.body, req.user);

        this.logger.debug(`[App] Request result: ${JSON.stringify(result)}`);

        res.json(result);
      }),
    );

      this.logger.info(`[endpoints]: ${routerName} router was registered`);
    });

    this.app.use(this.errorMiddleware.middleware.bind(this.errorMiddleware));

    return this;
  }

  private setupApp(endpoints: TEndpointTypes, disableAuthFor: string[]): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(asyncMiddleware(this.authenticationMiddleware.middleware(disableAuthFor)));
    this.app.use(asyncMiddleware(this.permissionMiddleware.middleware()));

    Object.keys(endpoints).map((routerName: string) => {
      this.logger.debug(`[app] Creating ${routerName} object...`);
      const endpointClass = endpoints[routerName];
      const endpointClassObject = new endpointClass(this.db, this.redisClient, this.logger);

      this.endpoints[routerName] = endpointClassObject;
    });
  }

  listen(): void {
    this.app.listen(process.env.APP_PORT, () => {
      this.logger.info(`[server]: Server is running at http://localhost:${process.env.APP_PORT}`);
    });
  }
}
