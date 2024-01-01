import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import RequestError, { ERequestError } from "../common/request_error";
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
        this.logger.log({
          level: "middleware",
          message: "Excluded path in IdentityMiddleware, skipping it",
          path: module.filename
        });
        next();
      }

      if (req.auth?.user?.isFrozen) {
        throw new RequestError(ERequestError.UserIsFrozen, [req.auth.user.email]);
      }
  
      next();
    };
  }
}