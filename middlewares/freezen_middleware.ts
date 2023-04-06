import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import RequestError from "../common/request_error";
import { RequestWithUser } from "../common/types";
import { TUser } from "../db/models/user";

type MiddlewareFunction = (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction) => Promise<void>;

export default class FreezenMiddleware {
  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) { }

  public middleware(): MiddlewareFunction {
    return async (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        this.logger.debug("[FreezenMiddleware] Excluded path. Skip");
        next();
      }

      if (req.user.isFreezen) {
        throw new RequestError("UserIsFreezen", `User(${req.user.email}) is freezen`, 403);
      }
  
      next();
    };
  }
}