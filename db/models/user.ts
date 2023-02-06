import { Knex } from "knex";
import winston from "winston";

import { SafeUserObject } from "../../common/types";

export interface TUser {
  id: number
  email: string
  password: string
  isBanned: boolean
}

export type Value<Type extends boolean> = Type extends true ? SafeUserObject : TUser;

export default class UserModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger
  ) {}

  public async insertUser(email: string, hash: string): Promise<void|never> {
    this.logger.debug(`[UserModel] Trying to insert user ${email}`);
    await this.db<TUser>("user").insert({ email: email, password: hash });
  }

  public async getUser<Type extends boolean>(email: string, safe: Type): Promise<Value<Type>|undefined> {
    this.logger.debug(`[UserModel] Getting unsafe user ${email}`);

    const user = await this.db<TUser>("user").where({email}).select(safe ? ["id", "email", "isBanned"] : []).first() as Value<Type>|undefined;

    return user;
  }

  public async changePassword(email: string, newHash: string): Promise<void> {
    this.logger.debug(`[UserModel] Changing user(${email}) password...`);

    await this.db<TUser>("user").where({email: email}).update({password: newHash});
  }
}