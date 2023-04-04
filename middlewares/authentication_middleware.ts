import bcrypt from "bcrypt";
import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import RequestError from "../common/request_error";
import { RequestWithUser } from "../common/types";
import CachingUserModel from "../db/models/caching/caching_user";
import UserModel, { TUser } from "../db/models/user";

type MiddlewareFunction = (req: RequestWithUser, res: Response, next: NextFunction) => Promise<void>;

export default class AuthenticationMiddleware {
  userModel: UserModel | CachingUserModel;

  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) {
    const UserModelType = this.config.get("REDIS_REQUIRED").required().asBool() ? CachingUserModel : UserModel;
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
  }

  public middleware(exculdePaths: string[]): MiddlewareFunction {
    return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
      const excludedPath = exculdePaths.includes(req.originalUrl);
      if (excludedPath) {
        this.logger.debug("[AuthenticationMiddleware] Excluded path. Skip");
        next();
      }

      const [email, password] = this.getCreds(req.headers.authorization);
      const user = await this.authenticate(email, password);
      req.user = user;

      this.logger.debug("[AuthenticationMiddleware] User is authorized");
  
      next();
    };
  }

  private getCreds(authorization: string|undefined): string[] {
    this.logger.debug("[AuthenticationMiddleware] Getting credentials from the Basic Auth header");
    if (!authorization) {
      throw new RequestError("AuthError", "Basic Auth header is required", 400);
    }
    const b64auth = authorization.split(" ")[1];
    
    return Buffer.from(b64auth, "base64").toString().split(":");
  }

  private async authenticate(email: string, password: string): Promise<TUser> {
    this.logger.debug("[AuthenticationMiddleware] User authentication");
    const user = await this.userModel.getUnsafeUser(email);

    if (!user) {
      throw new RequestError("DatabaseError", `User with email ${email} not found`, 404);
    }

    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
      throw new RequestError("AuthError", "Wrong password", 400);
    }

    return user;
  }
}
