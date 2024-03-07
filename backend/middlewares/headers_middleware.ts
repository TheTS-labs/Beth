import { NextFunction, Request, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export default class HeadersMiddleware {
  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) { }

  public middleware(): MiddlewareFunction {
    return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
      res.setHeader(
        "Access-Control-Allow-Origin",
        this.config.get("ACCESS_CONTROL_ALLOW_ORIGIN_HEADER").required().asString()
      );

      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization,Content-Type"
      );

      next();
    };
  }
}