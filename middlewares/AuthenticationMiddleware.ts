import bcrypt from "bcrypt";
import { NextFunction, Response } from "express";
import { Knex } from "knex";
import winston from "winston";

import RequestError from "../common/RequestError";
import { RequestWithUser } from "../common/types";
import UserModel, { TUser } from "../db/models/user";

type MiddlewareFunction = (req: RequestWithUser, res: Response, next: NextFunction) => Promise<void>;

export default class AuthenticationMiddleware {
  userModel: UserModel;

  constructor(private logger: winston.Logger, private db: Knex) {
    this.userModel = new UserModel(this.db, this.logger);
  }

  public middleware(exculdePaths: string[]): MiddlewareFunction {
    return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
      const excludedPath = exculdePaths.includes(req.originalUrl);
      if (excludedPath) {
        next();
      }

      const [email, password] = this.getCreds(req.headers.authorization);
      const user = await this.authenticate(email, password);
      req.user = user;
  
      next();
    };
  }

  private getCreds(authorization: string|undefined): string[] {
    if (!authorization) {
      throw new RequestError("AuthError", "Basic Auth header is required", 400);
    }
    const b64auth = authorization.split(" ")[1];
    
    return Buffer.from(b64auth, "base64").toString().split(":");
  }

  private async authenticate(email: string, password: string): Promise<TUser> {
    const user = await this.userModel.getUser(email, false);

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
