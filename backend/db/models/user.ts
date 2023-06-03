import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import { DBBool, SafeUserObject } from "../../common/types";

export interface TUser {
  id: number
  username: string
  displayName: string
  email: string
  password: string
  isFreezen: DBBool
  tags: string
  verified: DBBool
}

export default class UserModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async insertUser(username: string, displayName: string, email: string, hash: string): Promise<void> {
    this.logger.debug({
      message: "Trying to insert user",
      path: module.filename,
      context: { email, username, displayName }
    });
    await this.db<TUser>("user").insert({ username, displayName, email, password: hash });
  }

  public async getSafeUser(email: string): Promise<SafeUserObject | undefined> {
    this.logger.debug({ message: "Getting safe user", path: module.filename, context: { email } });

    const user = (await this.db<TUser>("user")
                            .where({ email })
                            .select("id", "email", "isFreezen", "username", "displayName")
                            .first()) as SafeUserObject | undefined;

    return user;
  }

  public async getUnsafeUser(email: string): Promise<TUser | undefined> {
    this.logger.debug({ message: "Getting unsafe user", path: module.filename, context: { email } });

    const user = await this.db<TUser>("user").where({ email }).select().first();

    return user;
  }

  public async changePassword(email: string, newHash: string): Promise<void> {
    this.logger.debug({ message: "Changing user's password", path: module.filename, context: { email } });

    await this.db<TUser>("user").where({ email }).update({ password: newHash });
  }

  public async isFreezen(email: string): Promise<DBBool> {
    this.logger.debug({ message: "Is the user freezen", path: module.filename, context: { email } });

    const record = await this.db<TUser>("user").where({ email }).select("isFreezen").first();

    const result = record || { isFreezen: DBBool.No };

    return result.isFreezen;
  }

  public async unfreezeUser(email: string): Promise<void> {
    this.logger.debug({ message: `Unfreezing ${email}`, path: module.filename });

    await this.db<TUser>("user").where({ email }).update({ isFreezen: 0 });
  }

  public async freezeUser(email: string, freeze: DBBool): Promise<void> {
    this.logger.debug({ message: `Freezing ${email}`, path: module.filename, context: { freeze } });

    await this.db<TUser>("user").where({ email }).update({ isFreezen: freeze });
  }

  public async editTags(email: string, newTags: string): Promise<void> {
    this.logger.debug({ message: "Editing tags", path: module.filename, context: { email, newTags } });
    await this.db<TUser>("user").where({ email }).update({ tags: newTags });
  }

  public async verifyUser(email: string, verify: DBBool): Promise<void> {
    this.logger.debug({ message: `Verificating ${email}`, path: module.filename, context: { verify } });

    await this.db<TUser>("user").where({ email }).update({ verified: verify });
  }
}