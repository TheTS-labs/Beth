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
        this.logger.log({
          level: "middleware",
          message: "Excluded path in IdentityMiddleware, skipping it",
          path: module.filename
        });
        next();
      }

      let [ domain, endpoint ] = req.originalUrl.replace("/", "").split("/");
      domain = domain.charAt(0).toUpperCase() + domain.slice(1);
      endpoint = endpoint.charAt(0).toUpperCase() + endpoint.slice(1);

      const requiredScope = domain + endpoint;

      this.logger.log({
        level: "middleware",
        message: `Looking for ${requiredScope} scope in token...`,
        path: module.filename
      });
  
      if (!req.auth?.scope.includes(requiredScope)) {
        throw new RequestError("PermissionDenied", [requiredScope]);
      }
  
      next();
    };
  }
}