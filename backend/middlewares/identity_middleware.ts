import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import RequestError from "../common/request_error";
import { JWTRequest } from "../common/types";
import CachingUserModel from "../db/models/caching/caching_user";
import TokenModel from "../db/models/token";
import UserModel from "../db/models/user";

type MiddlewareFunction = (req: JWTRequest, res: Response, next: NextFunction) => Promise<void>;

export default class IdentityMiddleware {
  userModel: UserModel | CachingUserModel;
  tokenModel: TokenModel;

  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) {
    const UserModelType = this.config.get("REDIS_REQUIRED").required().asBool() ? CachingUserModel : UserModel;
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.tokenModel = new TokenModel(this.db, this.logger, this.redisClient, this.config);
  }

  public middleware(): MiddlewareFunction {
    return async (req: JWTRequest, _res: Response, next: NextFunction): Promise<void> => {
      if (req.auth === undefined) {
        this.logger.log({
          level: "middleware",
          message: "Missing Bearer Authorization header, skipping it",
          path: module.filename
        });

        next();
      }

      this.logger.log({
        level: "middleware",
        message: "Checking the authority of the Bearer Authorization token...",
        path: module.filename
      });
      const token = await this.tokenModel.read(req?.auth?.tokenId||-1);
      if (!token) {
        throw new RequestError("AuthError", [""], 2);
      }
      if (token.revoked) {
        throw new RequestError("AuthError", [""], 1);
      }

      this.logger.log({
        level: "middleware",
        message: "Resolving user from the database...",
        path: module.filename
      });
      const user = await this.userModel.read(token.owner, "*");
      if (!user) {
        throw new RequestError("DatabaseError", [""], 3);
      }

      req.auth.token = token;
      req.auth.user = user;

      this.logger.log({
        level: "middleware",
        message: "User is authorized",
        path: module.filename,
        context: { user, token }
      });
  
      next();
    };
  }
}
