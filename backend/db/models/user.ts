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
  isFrozen: DBBool
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

  public async getSafeUser(id: number): Promise<SafeUserObject | undefined> {
    this.logger.debug({ message: "Getting safe user", path: module.filename, context: { id } });

    const user = (await this.db<TUser>("user")
                            .where({ id })
                            .select("id", "email", "isFrozen", "username", "displayName")
                            .first()) as SafeUserObject | undefined;

    return user;
  }

  public async getUnsafeUser(id: number): Promise<TUser | undefined> {
    this.logger.debug({ message: "Getting unsafe user", path: module.filename, context: { id } });

    const user = await this.db<TUser>("user").where({ id }).select().first();

    return user;
  }

  public async changePassword(email: string, newHash: string): Promise<void> {
    this.logger.debug({ message: "Changing user's password", path: module.filename, context: { email } });

    await this.db<TUser>("user").where({ email }).update({ password: newHash });
  }

  public async isFrozen(email: string): Promise<DBBool> {
    this.logger.debug({ message: "Is the user frozen", path: module.filename, context: { email } });

    const record = await this.db<TUser>("user").where({ email }).select("isFrozen").first();

    const result = record || { isFrozen: DBBool.No };

    return result.isFrozen;
  }

  public async frozeUser(id: number, froze: DBBool): Promise<void> {
    this.logger.debug({ message: `Freezing ${id}`, path: module.filename, context: { froze } });

    await this.db<TUser>("user").where({ id }).update({ isFrozen: froze });
  }

  public async editTags(id: number, newTags: string): Promise<void> {
    this.logger.debug({ message: "Editing tags", path: module.filename, context: { id, newTags } });
    await this.db<TUser>("user").where({ id }).update({ tags: newTags });
  }

  public async verifyUser(id: number, verify: DBBool): Promise<void> {
    this.logger.debug({ message: `Verification ${id}`, path: module.filename, context: { verify } });

    await this.db<TUser>("user").where({ id }).update({ verified: verify });
  }
}