import dotenv from "dotenv";
import { ExtenderTypeOptional, from, IEnv, IOptionalVariable } from "env-var";
import express, { Express, NextFunction, Response } from "express";
import asyncHandler from "express-async-handler";
import { expressjwt } from "express-jwt";
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
import IdentityMiddleware from "./middlewares/identity_middleware";
import PermissionMiddleware from "./middlewares/permission_middleware";
import Redis from "./redis";
import ScheduledTasks from "./scheduledJobs/scheduled_tasks";

// TODO: Simplify it

dotenv.config();

export interface Domains {
  [key: string]: typeof IBaseEndpoint
}

// TODO: Rename interface to match Domain-Endpoints naming convention
export interface TEndpointObjects {
  [key: string]: IBaseEndpoint
}

export type ENV = IEnv<IOptionalVariable<{}> & ExtenderTypeOptional<{}>, NodeJS.ProcessEnv>;

export default class App {
  app: Express = express();
  db: Knex;
  redisClient: RedisClientType;
  domains: TEndpointObjects = {};
  logger: winston.Logger;
  config: ENV;
  scheduledTasks: ScheduledTasks;

  identityMiddleware: IdentityMiddleware;
  permissionMiddleware: PermissionMiddleware;
  frozenMiddleware: FrozenMiddleware;
  errorMiddleware: ErrorMiddleware;

  server!: Server<typeof IncomingMessage, typeof ServerResponse>;

  //! Disabling auth you also disabling permission check
  constructor(endpoints: Domains, disableAuthFor:string[]=[]) {
    this.config = from(process.env, {}, (varname: string, str: string): void => this.envLoggerFn(varname, str));
    const env = this.config.get("NODE_ENV").required().asEnum([
      // TODO: Remove developmentSQLite
      "development", "production", "developmentSQLite", "test"
    ]);
    this.logger = new Logger().get(env === "test" ? "quiet" : this.config.get("LOG_LEVEL").required().asString());
    this.db = knex(knexfile[env]);
    this.redisClient = new Redis(this.logger, this.config).get();
    this.scheduledTasks = new ScheduledTasks(this.db, this.logger);

    this.identityMiddleware = new IdentityMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.permissionMiddleware = new PermissionMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.frozenMiddleware = new FrozenMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.errorMiddleware = new ErrorMiddleware(this.logger);
  
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
    this.app.use(expressjwt({
      // TODO: Move to another file
      secret: this.config.get("JWT_TOKEN_SECRET").required().asString(),
      algorithms: ["HS256"],
      getToken: (req) => {
        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
          return req.headers.authorization.split(" ")[1];
        }

        return undefined;
      },
    }).unless({ path: disableAuthFor }));
    this.app.use(asyncMiddleware(this.identityMiddleware.middleware()));
    this.app.use(asyncMiddleware(this.permissionMiddleware.middleware()));
    this.app.use(asyncMiddleware(this.frozenMiddleware.middleware()));
    this.app.use((_req: JWTRequest, res: Response, next: NextFunction) => {
      // TODO: Move to another file
      res.setHeader(
        "Access-Control-Allow-Origin",
        this.config.get("ACCESS_CONTROL_ALLOW_ORIGIN_HEADER").required().asString()
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization"
      );
      next();
    });
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

    this.server = this.app.listen(port, () => {
      this.logger.log({
        level: "system",
        message: `Server is running at http://localhost:${port}`,
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
