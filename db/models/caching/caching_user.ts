import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../../app";
import { SafeUserObject } from "../../../common/types";
import UserModel, { TUser } from "../user";

export default class CachingUserModel implements UserModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}
  
  public async insertUser(email: string, hash: string): Promise<void> {
    this.logger.debug({ message: "Trying to insert user", path: module.filename, context: { email } });
    await this.db<TUser>("user").insert({ email: email, password: hash });
  }

  public async getSafeUser(email: string): Promise<SafeUserObject | undefined> {
    this.logger.debug({ message: "Getting safe user from cache", path: module.filename, context: { email } });
    const cachedUserString = await this.redisClient.get(email);
    const cachedUser: SafeUserObject = JSON.parse(cachedUserString||"null");

    if (cachedUser) {
      this.logger.debug({ message: "Returning user from cache", path: module.filename, context: { email } });
      return cachedUser;
    }
  
    this.logger.debug({ message: "Getting user from DB", path: module.filename, context: { email } });
    const user = await this._getSafeUser(email);
    if (user) {
      this.logger.debug({ message: "Caching user", path: module.filename, context: { email } });
      await this.redisClient.set(email, JSON.stringify(user), {
        EX: this.config.get("USER_EX").required().asIntPositive(),
        NX: true
      });
    }

    return user;
  }

  public async getUnsafeUser(email: string): Promise<TUser | undefined> {
    this.logger.debug({ message: "Getting unsafe user from DB", path: module.filename, context: { email } });
    
    const user = await this.db<TUser>("user").where({ email }).select().first();

    return user;
  }

  public async changePassword(email: string, newHash: string): Promise<void> {
    this.logger.debug({ message: "Changing user's password", path: module.filename, context: { email } });

    await this.db<TUser>("user").where({ email: email }).update({ password: newHash });
  }

  public async isFreezen(email: string): Promise<0 | 1> {
    this.logger.debug({ message: "Is the user freezen", path: module.filename, context: { email } });
    this.logger.debug({ message: "Getting safe user from cache", path: module.filename, context: { email } });
    const cachedUserString = await this.redisClient.get(email);
    const cachedUser: SafeUserObject = JSON.parse(cachedUserString||"null");

    if (cachedUser) {
      this.logger.debug({ message: "Using user from cache", path: module.filename, context: { email } });
      return cachedUser.isFreezen;
    }

    this.logger.debug({ message: "Using user from DB", path: module.filename, context: { email } });
    const record = await this.db<TUser>("user").where({ email }).select("isFreezen").first();
    const result = record || { isFreezen: 0 };
    return result.isFreezen;
  }

  public async unfreezeUser(email: string): Promise<void> {
    this.logger.debug({ message: `Unfreezing ${email}`, path: module.filename });

    await this.db<TUser>("user").where({ email: email }).update({ isFreezen: 0 });
  }

  public async freezeUser(email: string, freeze: 1 | 0): Promise<void> {
    this.logger.debug({ message: `Freezing ${email}`, path: module.filename, context: { freeze } });

    await this.db<TUser>("user").where({ email }).update({ isFreezen: freeze });
  }

  private async _getSafeUser(email: string): Promise<SafeUserObject | undefined> {
    this.logger.debug({ message: "Getting safe user", path: module.filename, context: { email } });

    const user = (await this.db<TUser>("user")
                            .where({ email })
                            .select("id", "email", "isFreezen")
                            .first()) as SafeUserObject | undefined;

    return user;
  }

  public async editTags(email: string, newTags: string): Promise<void> {
    this.logger.debug({ message: "Editing tags", path: module.filename, context: { email, newTags } });
    await this.db<TUser>("user").where({ email }).update({ tags: newTags });
    await this.redisClient.del(email);
  }

  public async verifyUser(email: string, verify: 1 | 0): Promise<void> {
    this.logger.debug({ message: `Verificating ${email}`, path: module.filename, context: { verify } });

    await this.db<TUser>("user").where({ email }).update({ verified: verify });
  }
}