import dotenv from "dotenv";
import { ExtenderTypeOptional, from, IEnv, IOptionalVariable } from "env-var";
import express, { Express, Response } from "express";
import asyncHandler from "express-async-handler";
import knex, { Knex } from "knex";
import asyncMiddleware from "middleware-async";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "./common/base_endpoint";
import { RequestWithUser } from "./common/types";
import knexfile from "./knexfile";
import Logger from "./logger";
import AuthenticationMiddleware from "./middlewares/authentication_middleware";
import ErrorMiddleware from "./middlewares/error_middleware";
import FreezenMiddleware from "./middlewares/freezen_middleware";
import PermissionMiddleware from "./middlewares/permission_middleware";
import Redis from "./redis";
import initScheduledJobs from "./scheduledJobs/init_scheduled_jobs";

dotenv.config();

export interface TEndpointTypes {
  [key: string]: typeof IBaseEndpoint
}
export interface TEndpointObjects {
  [key: string]: IBaseEndpoint
}

export type ENV = IEnv<IOptionalVariable<{}> & ExtenderTypeOptional<{}>, NodeJS.ProcessEnv>;

export default class App {
  app: Express = express();
  db: Knex;
  redisClient: RedisClientType;
  endpoints: TEndpointObjects = {};
  logger: winston.Logger = new Logger().get();
  config: ENV;

  authenticationMiddleware: AuthenticationMiddleware;
  permissionMiddleware: PermissionMiddleware;
  freezenMiddleware: FreezenMiddleware;
  errorMiddleware: ErrorMiddleware;

  //! Disabling auth you also disabling permission check
  constructor(endpoints: TEndpointTypes, disableAuthFor:string[]=[]) {
    this.config = from(process.env, {}, (varname: string, str: string): void => this.envLoggerFn(varname, str));
    this.db = knex(knexfile[this.config.get("NODE_ENV").required().asEnum([
      "development", "production", "developmentSQLite"
    ])]);
    this.redisClient = new Redis(this.logger, this.config).get();

      this.authenticationMiddleware = new AuthenticationMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.permissionMiddleware = new PermissionMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.freezenMiddleware = new FreezenMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.errorMiddleware = new ErrorMiddleware(this.logger);
  
    initScheduledJobs(this.db, this.logger);
    this.setupApp(endpoints, disableAuthFor);
  }

  registerRouters(): App {
    this.logger.info({ message: "Registering endpoint objects", path: module.filename });
    Object.keys(this.endpoints).map((routerName: string) => {
      this.app.post(`${routerName}/:endPoint`, asyncHandler(async (req: RequestWithUser, res: Response) => {
        this.logger.debug({
          message: `Incoming request to ${routerName}/${req.params.endPoint}: ${JSON.stringify(req.body)}`,
          path: module.filename 
        });

        const classObject = this.endpoints[routerName];
        const result = await classObject.callEndpoint(req.params.endPoint, req.body, req.user);

        this.logger.debug({ message: `Request result: ${JSON.stringify(result)}`, path: module.filename });

        res.json(result);
      })
    );

    this.logger.debug({ message: `The ${routerName} endpoint object is registered`, path: module.filename });
    });

    this.logger.debug({ message: "Enabling the error-catching middleware", path: module.filename });
    this.app.use(this.errorMiddleware.middleware.bind(this.errorMiddleware));

    return this;
  }

  private setupApp(endpoints: TEndpointTypes, disableAuthFor: string[]): void {
    this.logger.info({
      message: "Configure the application settings and enable the middlewares",
      path: module.filename
    });
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(asyncMiddleware(this.authenticationMiddleware.middleware(disableAuthFor)));
    this.app.use(asyncMiddleware(this.permissionMiddleware.middleware()));
    this.app.use(asyncMiddleware(this.freezenMiddleware.middleware()));

    this.logger.info({ message: "Create endpoint objects", path: module.filename });
    Object.keys(endpoints).map((routerName: string) => {
      const endpointClass = endpoints[routerName];
      const endpointClassObject = new endpointClass(
        this.db,
        this.redisClient,
        this.logger,
        this.config
      );

      this.endpoints[routerName] = endpointClassObject;

      this.logger.debug({message: `The ${routerName} endpoint object is created`, path: module.filename });
    });
  }

  listen(): void {
    const port = this.config.get("APP_PORT").required().asPortNumber();

    this.app.listen(port, () => {
      this.logger.info({ message: `Server is running at https://localhost:${port}`, path: module.filename });
    });
  }

  envLoggerFn(varname: string, str: string): void {
    this.logger.debug({ message: `${varname}: ${str}`, path: module.filename });
  }
}
