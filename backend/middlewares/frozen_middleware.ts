import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import RequestError from "../common/request_error";
import { JWTRequest } from "../common/types";

type MiddlewareFunction = (req: JWTRequest, res: Response, next: NextFunction) => Promise<void>;

export default class FrozenMiddleware {
  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) { }

  public middleware(): MiddlewareFunction {
    return async (req: JWTRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.auth) {
        this.logger.debug({ message: "Excluded path. Skip", path: module.filename });
        next();
      }

      if (req.auth?.user?.isFrozen) {
        throw new RequestError("UserIsFrozen", req.auth.user.email);
      }
  
      next();
    };
  }
}