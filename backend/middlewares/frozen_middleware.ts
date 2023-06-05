import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import RequestError from "../common/request_error";
import { RequestWithUser } from "../common/types";
import { TUser } from "../db/models/user";

type MiddlewareFunction = (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction) => Promise<void>;

export default class FrozenMiddleware {
  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) { }

  public middleware(): MiddlewareFunction {
    return async (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        this.logger.debug({ message: "Excluded path. Skip", path: module.filename });
        next();
      }

      if (req.user.isFrozen) {
        throw new RequestError("UserIsFrozen", `User(${req.user.email}) is frozen`, 403);
      }
  
      next();
    };
  }
}