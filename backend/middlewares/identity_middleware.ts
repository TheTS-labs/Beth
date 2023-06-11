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
        this.logger.debug({ message: "Excluded path. Skip", path: module.filename });
        next();
        return;
      }

      const user = await this.userModel.getUnsafeUser(req.auth.userId);
      const token = await this.tokenModel.getToken(req.auth.tokenId);
      if (!token) {
        throw new RequestError("AuthError", "This token doesn't exist, even if it signed", 403);
      }
      if (token.revoked) {
        throw new RequestError("AuthError", "This token revoked", 403);
      }

      req.auth.token = token;
      req.auth.user = user;

      this.logger.debug({ message: "User is authorized", path: module.filename });
  
      next();
    };
  }
}
