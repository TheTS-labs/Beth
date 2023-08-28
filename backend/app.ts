import dotenv from "dotenv";
import { ExtenderTypeOptional, from, IEnv, IOptionalVariable } from "env-var";
import express, { Express, Response } from "express";
import asyncHandler from "express-async-handler";
import { IncomingMessage, Server, ServerResponse } from "http";
import knex, { Knex } from "knex";
import asyncMiddleware from "middleware-async";
import { RedisClientType } from "redis";
import winston from "winston";

import { JWTRequest } from "./common/types";
import IBaseEndpoint from "./common/types/base_endpoint";
import knexfile from "./knexfile";
import Logger from "./logger";
import ErrorMiddleware from "./middlewares/error_middleware";
import FrozenMiddleware from "./middlewares/frozen_middleware";
import HeadersMiddleware from "./middlewares/headers_middleware";
import IdentityMiddleware from "./middlewares/identity_middleware";
import JWTMiddleware from "./middlewares/jwt_middleware";
import PermissionMiddleware from "./middlewares/permission_middleware";
import Redis from "./redis";
import ScheduledTasks from "./scheduledJobs/scheduled_tasks";

dotenv.config({ path: "../.backend.env" });

export interface Domains {
  [key: string]: typeof IBaseEndpoint
}

export interface DomainInstances {
  [key: string]: IBaseEndpoint
}

export type ENV = IEnv<IOptionalVariable<{}> & ExtenderTypeOptional<{}>, NodeJS.ProcessEnv>;

export default class App {
  app: Express = express();
  db: Knex;
  redisClient: RedisClientType;
  domains: DomainInstances = {};
  logger: winston.Logger;
  config: ENV;
  scheduledTasks: ScheduledTasks;

  headersMiddleware: HeadersMiddleware;
  JWTMiddleware: JWTMiddleware;
  identityMiddleware: IdentityMiddleware;
  permissionMiddleware: PermissionMiddleware;
  frozenMiddleware: FrozenMiddleware;
  errorMiddleware: ErrorMiddleware;

  server!: Server<typeof IncomingMessage, typeof ServerResponse>;

  //! Disabling auth you also disabling permission check
  constructor(endpoints: Domains, disableAuthFor:string[]=[]) {
    this.config = from(process.env, {}, (varname: string, str: string): void => this.envLoggerFn(varname, str));
    const env = this.config.get("NODE_ENV").required().asEnum(["development", "production", "test"]);
    this.logger = new Logger().get(this.config.get("LOG_LEVEL").required().asString());
    this.db = knex(knexfile[env]);
    this.redisClient = new Redis(this.logger, this.config).get();
    this.scheduledTasks = new ScheduledTasks(this.db, this.logger);

    this.headersMiddleware = new HeadersMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.JWTMiddleware = new JWTMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.identityMiddleware = new IdentityMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.permissionMiddleware = new PermissionMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.frozenMiddleware = new FrozenMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.errorMiddleware = new ErrorMiddleware(this.logger, this.config);
  
    this.scheduledTasks.start();
    this.setMiddlewares(disableAuthFor);
    this.createInstancesOfDomains(endpoints);
    this.registerDomains();
  }

  private setMiddlewares(disableAuthFor: string[]): void {
    this.logger.log({
      level: "system",
      message: "Configure the application settings and enable the middlewares",
      path: module.filename
    });
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(asyncMiddleware(this.headersMiddleware.middleware()));
    this.app.use(this.JWTMiddleware.middleware(disableAuthFor));
    this.app.use(asyncMiddleware(this.identityMiddleware.middleware()));
    this.app.use(asyncMiddleware(this.permissionMiddleware.middleware()));
    this.app.use(asyncMiddleware(this.frozenMiddleware.middleware()));
  }

  private createInstancesOfDomains(domains: Domains): void {
    this.logger.log({
      level: "system",
      message: "Create instances of the domains",
      path: module.filename
    });
    Object.keys(domains).map((domainName: string) => {
      this.domains[domainName] = new domains[domainName](
        this.db,
        this.redisClient,
        this.logger,
        this.config
      );

      this.logger.log({
        level: "system",
        message: `${domainName} domain instance is created`,
        path: module.filename
      });
    });
  }

  private registerDomains(): void {
    this.logger.log({
      level: "system",
      message: "Registration of domains...",
      path: module.filename
    });

    Object.keys(this.domains).map((domainName: string) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      this.app.post(`${domainName}/:endPoint`, asyncHandler(async (req: JWTRequest, res: Response) => {
        this.logger.log({
          level: "request",
          message: `To ${domainName}/${req.params.endPoint}`,
          context: { body: req.body },
          path: module.filename 
        });

        const response = await this.domains[domainName].callEndpoint(req.params.endPoint, req.body, req.auth);

        this.logger.log({
          level: "response",
          message: "Done",
          context: { response },
          path: module.filename
        });

        res.json(response);
      })
    );

    this.logger.log({
      level: "system",
      message: `${domainName} domain has been registered`,
      path: module.filename
    });
    });

    this.logger.log({
      level: "system",
      message: "Enabling error-catching middleware...",
      path: module.filename
    });
    this.app.use(this.errorMiddleware.middleware.bind(this.errorMiddleware));
  }

  public listen(): void {
    const port = this.config.get("APP_PORT").required().asPortNumber();

    this.server = this.app.listen(port, "0.0.0.0", () => {
      this.logger.log({
        level: "system",
        message: `Server is running at http://0.0.0.0:${port}`,
        path: module.filename
      });
    });
  }

  private envLoggerFn(varname: string, str: string): void {
    if (this.logger) {
      this.logger.log({
        level: "env",
        message: `${varname}: ${str}`,
        path: module.filename
      });
    }
  }
}
