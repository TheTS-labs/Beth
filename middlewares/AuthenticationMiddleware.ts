import bcrypt from "bcrypt";
import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import RequestError from "../common/RequestError";
import { RequestWithUser } from "../common/types";
import UserModel, { TUser } from "../db/models/user";

type MiddlewareFunction = (req: RequestWithUser, res: Response, next: NextFunction) => Promise<void>;

export default class AuthenticationMiddleware {
  userModel: UserModel;

  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private useRedis: boolean
  ) {
    this.userModel = new UserModel(this.db, this.logger);
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
  
      next();
    };
  }

  private getCreds(authorization: string|undefined): string[] {
    this.logger.debug("[AuthenticationMiddleware] Getting credentitals from the Basic Auth header...");
    if (!authorization) {
      throw new RequestError("AuthError", "Basic Auth header is required", 400);
    }
    const b64auth = authorization.split(" ")[1];
    
    return Buffer.from(b64auth, "base64").toString().split(":");
  }

  private async authenticate(email: string, password: string): Promise<TUser> {
    this.logger.debug("[AuthenticationMiddleware] Authenticating...");
    const user = await this.getUser(email);

    if (!user) {
      throw new RequestError("DatabaseError", `User with email ${email} not found`, 404);
    }

    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
      throw new RequestError("AuthError", "Wrong password", 400);
    }

    return user;
  }

  private async getUser(email: string): Promise<TUser> {
    if (this.useRedis) {
      this.logger.debug("[AuthenticationMiddleware] Getting user from cache...");
      const cachedUserString = await this.redisClient.get(email);
      const cachedUser: TUser = JSON.parse(cachedUserString||"null");

      this.logger.debug(`[AuthenticationMiddleware] Cached?: ${cachedUserString}`);

      if (cachedUser) {
        return cachedUser;
      }
    }
  
    this.logger.debug("[AuthenticationMiddleware] Getting user...");
    const user = await this.userModel.getUser(email, false);
    if (!user) {
      throw new RequestError("DatabaseError", `User with email ${email} not found`, 404);
    }

    if (this.useRedis) {
      this.logger.debug("[AuthenticationMiddleware] Caching user...");
      await this.redisClient.set(email, JSON.stringify(user), {
        EX: 60 * 10, // Expires in 10 minutes
        NX: true
      });
    }

    return user;
  }
}
