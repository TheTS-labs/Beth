// import bcrypt from "bcrypt";
// import Joi from "joi";
import { Knex } from "knex";
import winston from "winston";

import { FunctionResponse, SafeUserObject } from "../../common/common_types";
import RequestError from "../../common/RequestError";

export interface TUser {
  id: number
  email: string
  password: string
  is_banned: boolean
}

export default class UserModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger
  ) {}

  public async insertUser(email: string, hash: string): Promise<FunctionResponse<SafeUserObject>> {
    try {
      this.logger.debug(`[UserModel] Trying to insert user ${email}`);
      await this.db<TUser>("user").insert({ email: email, password: hash });
    } catch(err: unknown) {
      const e = err as { message: string };

      return {
        success: false,
        result: new RequestError("DatabaseError", e.message, 500)
      };
    }

    const user = await this.getUser(email);
    return user;
  }

  public async getUser(email: string): Promise<FunctionResponse<SafeUserObject>> {
    this.logger.debug(`[UserModel] Getting safe user ${email}`);

    const user = await this.db<TUser>("user").where({ email: email }).select("id", "email", "is_banned").first();
    if (user) { return { success: true, result: user }; }

    return {
      success: false,
      result: new RequestError("DatabaseError", `User with email ${email} not found`, 404)
    };
  }

  public async getUnsafeUser(email: string): Promise<FunctionResponse<TUser>> {
    this.logger.debug(`[UserModel] Getting unsafe user ${email}`);
    
    const user = await this.db<TUser>("user").where({email}).select().first();
    if (user) { return { success: true, result: user }; }

    return {
      success: false,
      result: new RequestError("DatabaseError", `User with email ${email} not found`, 404)
    };
  }

  public async changePassword(email: string, newHash: string): Promise<FunctionResponse<SafeUserObject>> {
    this.logger.debug(`[UserModel] Changing user(${email}) password...`);

    await this.db<TUser>("user").where({email: email}).update({password: newHash});

    return this.getUser(email);
  }
}