import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import RequestError from "../common/request_error";
import { JWTRequest } from "../common/types";

type MiddlewareFunction = (
  req: JWTRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

export default class PermissionMiddleware {
  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) { }

  public middleware(): MiddlewareFunction {
    return async (
      req: JWTRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      if (!req.auth?.token) {
        this.logger.debug({ message: "Excluded path. Skip", path: module.filename });
        next();
      }

      const splitted = req.originalUrl.replace("/", "").split("/");
      const requiredScope = splitted[0] + ":" + splitted[1];

      this.logger.debug({ message: `Checking for ${requiredScope} scope`, path: module.filename });
  
      if (!req.auth?.scope.includes(requiredScope)) {
        throw new RequestError("PermissionDenied", `You don't have scope: ${requiredScope}`, 403);
      }
  
      next();
    };
  }
}