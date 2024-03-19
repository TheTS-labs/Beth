import dotenv from "dotenv";
import { ExtenderTypeOptional, from, IEnv, IOptionalVariable } from "env-var";
import express, { Express } from "express";
import knex, { Knex } from "knex";
import { attachPaginate } from "knex-paginate";
import { RedisClientType } from "redis";
import winston from "winston";

import IBaseEndpoint from "./common/types/base_endpoint";
import DomainManager from "./endpoints/domain_manager";
import knexfile from "./knexfile";
import Logger from "./logger";
import ErrorMiddleware from "./middlewares/error_middleware";
import Middlewares from "./middlewares/middlewares";
import Redis from "./redis";
import ScheduledTasks from "./scheduledJobs/scheduled_tasks";

dotenv.config({ path: "../env/.backend.env" });
attachPaginate();

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
  logger: winston.Logger;
  config: ENV;
  scheduledTasks: ScheduledTasks;
  private middlewares: Middlewares;
  private domainManager: DomainManager;

  constructor(endpoints: Domains, disableAuthFor: string[] = []) {
    this.config = from(process.env, {}, (varname: string, str: string): void => this.envLoggerFn(varname, str));
    const env = this.config.get("NODE_ENV").required().asEnum(["development", "production", "test"]);
    this.logger = new Logger().get(this.config.get("LOG_LEVEL").required().asString());
    this.db = knex(knexfile[env]);
    this.redisClient = new Redis(this.logger, this.config).get();
    this.scheduledTasks = new ScheduledTasks(this.db, this.logger);
    this.middlewares = new Middlewares(this.logger, this.db, this.redisClient, this.config);
    this.domainManager = new DomainManager(this.logger, this.db, this.redisClient, this.config);

    this.scheduledTasks.start();
    this.middlewares.applyMiddlewares(this.app, disableAuthFor);
    this.domainManager.createInstancesOfDomains(endpoints);
    this.domainManager.registerDomains(this.app);
    this.errorHandling();
  }

  private errorHandling(): void {
    this.logger.log({
      level: "system",
      message: "Enabling error-catching middleware...",
      path: module.filename,
    });

    const errorMiddleware = new ErrorMiddleware(this.logger, this.config);
    this.app.use(errorMiddleware.middleware);
  }

  public listen(): void {
    const port = this.config.get("APP_PORT").required().asPortNumber();

    this.app.listen(port, "0.0.0.0", () => {
      this.logger.log({
        level: "system",
        message: `Server is running at http://0.0.0.0:${port}`,
        path: module.filename,
      });
    });
  }

  private envLoggerFn(varname: string, str: string): void {
    if (this.logger) {
      this.logger.log({
        level: "env",
        message: `${varname}: ${str}`,
        path: module.filename,
      });
    }
  }
}
