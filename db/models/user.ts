import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { SafeUserObject } from "../../common/types";

export interface TUser {
  id: number
  email: string
  password: string
  isFreezen: 0 | 1
}

export default class UserModel {
  constructor(public db: Knex, public logger: winston.Logger, public redisClient: RedisClientType) {}

  public async insertUser(email: string, hash: string): Promise<void> {
    this.logger.debug(`[UserModel] Trying to insert user ${email}`);
    await this.db<TUser>("user").insert({ email: email, password: hash });
  }

  public async getSafeUser(email: string): Promise<SafeUserObject | undefined> {
    this.logger.debug(`[UserModel] Getting safe user ${email}`);

    const user = (await this.db<TUser>("user")
                            .where({ email })
                            .select("id", "email", "isFreezen")
                            .first()) as SafeUserObject | undefined;

    return user;
  }

  public async getUnsafeUser(email: string): Promise<TUser | undefined> {
    this.logger.debug(`[UserModel] Getting safe user ${email}`);

    const user = await this.db<TUser>("user").where({ email }).select().first();

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

  public async unfreezeUser(email: string): Promise<void> {
    this.logger.debug(`[UserModel] Unfreezing ${email}...`);

    await this.db<TUser>("user").where({ email: email }).update({ isFreezen: 0 });
  }

  public async freezeUser(email: string): Promise<void> {
    this.logger.debug(`[UserModel] Freezing ${email}...`);

    await this.db<TUser>("user").where({ email: email }).update({ isFreezen: 1 });
  }
}