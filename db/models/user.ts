import { Knex } from "knex";
import winston from "winston";

import { SafeUserObject } from "../../common/types";

export interface TUser {
  id: number
  email: string
  password: string
  isFreezen: boolean
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

    const user = await this.db<TUser>("user").where({email}).select(safe ? ["id", "email", "isFreezen"] : []).first() as Value<Type>|undefined;

    return user;
  }

  public async changePassword(email: string, newHash: string): Promise<void> {
    this.logger.debug(`[UserModel] Changing user(${email}) password...`);

    await this.db<TUser>("user").where({email: email}).update({password: newHash});
  }

  public async isFreezen(email: string): Promise<boolean> {
    this.logger.debug(`[UserModel] Is ${email} freezen...`);

    const result: Pick<TUser, "isFreezen">|undefined = await this.db<TUser>("user").where({email}).select("isFreezen").first()||{ isFreezen: false };

    return result.isFreezen;
  }

  public async changeIsFreezeUser(email: string, value=true): Promise<void> {
    this.logger.debug(`[UserModel] Freezing ${email}...`);

    await this.db<TUser>("user").where({email: email}).update({isFreezen: value});
  }
}