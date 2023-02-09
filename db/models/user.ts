import { Knex } from "knex";
import winston from "winston";

import { SafeUserObject } from "../../common/types";

export interface TUser {
  id: number
  email: string
  password: string
  isFreezen: 0 | 1
}

export type Value<Type extends boolean> = Type extends true ? SafeUserObject : TUser;

export default class UserModel {
  constructor(public db: Knex, public logger: winston.Logger) {}

  public async insertUser(email: string, hash: string): Promise<void | never> {
    this.logger.debug(`[UserModel] Trying to insert user ${email}`);
    await this.db<TUser>("user").insert({ email: email, password: hash });
  }

  public async getUser<Type extends boolean>(email: string, safe: Type): Promise<Value<Type> | undefined> {
    this.logger.debug(`[UserModel] Getting unsafe user ${email}`);

    const selectRows = safe ? ["id", "email", "isFreezen"] : [];

    const user = (await this.db<TUser>("user").where({ email }).select(selectRows).first()) as Value<Type> | undefined;

    return user;
  }

  public async changePassword(email: string, newHash: string): Promise<void> {
    this.logger.debug(`[UserModel] Changing user(${email}) password...`);

    await this.db<TUser>("user").where({ email: email }).update({ password: newHash });
  }

  public async isFreezen(email: string): Promise<0 | 1> {
    this.logger.debug(`[UserModel] Is ${email} freezen...`);

    const record = await this.db<TUser>("user").where({ email }).select("isFreezen").first();

    const result = record || { isFreezen: 0 };

    return result.isFreezen;
  }

  public async changeIsFreezeUser(email: string, value:0|1 = 1): Promise<void> {
    this.logger.debug(`[UserModel] Freezing ${email}...`);

    await this.db<TUser>("user").where({ email: email }).update({ isFreezen: value });
  }
}
