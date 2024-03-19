import { Express, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { DomainInstances, Domains, ENV } from "../app";

export default class DomainManager {
  private domainInstances: DomainInstances = {};

  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) {}

  public createInstancesOfDomains(domains: Domains): void {
    Object.keys(domains).forEach((domainName: string) => {
      this.domainInstances[domainName] = new domains[domainName](this.db, this.redisClient, this.logger, this.config);

      this.logger.log({
        level: "system",
        message: `${domainName} domain instance is created`,
        path: module.filename,
      });
    });
  }

  public registerDomains(app: Express): void {
    app.all("/ping", (req, res) => {
      this.logger.log({
        level: "request",
        message: "Ping",
        path: module.filename,
      });

      res.sendStatus(200);

      this.logger.log({
        level: "response",
        message: "Pong",
        path: module.filename,
      });
    });

    Object.keys(this.domainInstances).forEach((domainName: string) => {
      app.post(`${domainName}/:endPoint`, asyncHandler(async (req: Request, res: Response) => {
        this.logger.log({
          level: "request",
          message: `To ${domainName}/${req.params.endPoint}`,
          context: { body: req.body },
          path: module.filename,
        });

        const response = await this.domainInstances[domainName].callEndpoint(req.params.endPoint, req.body, req.auth);

        this.logger.log({
          level: "response",
          message: "Done",
          context: { response },
          path: module.filename,
        });

        res.json(response);
      }));

      this.logger.log({
        level: "system",
        message: `${domainName} domain has been registered`,
        path: module.filename,
      });
    });
  }
}