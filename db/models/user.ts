import { Knex } from "knex";
import winston from "winston";

import RequestError from "../../common/RequestError";
import { SafeUserObject } from "../../common/types";

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

  public async insertUser(email: string, hash: string): Promise<SafeUserObject|never> {
    try {
      this.logger.debug(`[UserModel] Trying to insert user ${email}`);
      await this.db<TUser>("user").insert({ email: email, password: hash });
    } catch(err: unknown) {
      const e = err as { message: string };

      throw new RequestError("DatabaseError", e.message, 500);
    }

    const user = await this.getUser(email);
    return user;
  }

  public async getUser(email: string): Promise<SafeUserObject|never> {
    this.logger.debug(`[UserModel] Getting safe user ${email}`);

    const user = await this.db<TUser>("user").where({ email: email }).select("id", "email", "is_banned").first();

    if (!user) { throw new RequestError("DatabaseError", `User with email ${email} not found`, 404); }
    
    return user;
  }

  public async getUnsafeUser(email: string): Promise<TUser|never> {
    this.logger.debug(`[UserModel] Getting unsafe user ${email}`);
    
    const user = await this.db<TUser>("user").where({email}).select().first();

    if (!user) { throw new RequestError("DatabaseError", `User with email ${email} not found`, 404); }

    return user;
  }

  public async changePassword(email: string, newHash: string): Promise<SafeUserObject|never> {
    this.logger.debug(`[UserModel] Changing user(${email}) password...`);

    await this.db<TUser>("user").where({email: email}).update({password: newHash});

    return this.getUser(email);
  }
}