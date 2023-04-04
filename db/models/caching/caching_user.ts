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
      this.logger.debug(`[CachingUserModel] Trying to insert user ${email}`);
      await this.db<TUser>("user").insert({ email: email, password: hash });
    }
  
    public async getSafeUser(email: string): Promise<SafeUserObject | undefined> {
      this.logger.debug("[CachingUserModel] Getting safe user from cache");
      const cachedUserString = await this.redisClient.get(email);
      const cachedUser: SafeUserObject = JSON.parse(cachedUserString||"null");
  
      if (cachedUser) {
        this.logger.debug("[CachingUserModel] Returning user from cache");
        return cachedUser;
      }
    
      this.logger.debug("[CachingUserModel] Getting user from DB");
      const user = await this._getSafeUser(email);
      if (user) {
        this.logger.debug("[CachingUserModel] Caching user");
        await this.redisClient.set(email, JSON.stringify(user), {
          EX: this.config.get("USER_EX").required().asIntPositive(),
          NX: true
        });
      }
  
      return user;
    }
  
    public async getUnsafeUser(email: string): Promise<TUser | undefined> {
      this.logger.debug("[CachingUserModel] Getting unsafe user from DB");
      
      const user = await this.db<TUser>("user").where({ email }).select().first();
  
      return user;
    }
  
    public async changePassword(email: string, newHash: string): Promise<void> {
      this.logger.debug(`[CachingUserModel] Changing user's(${email}) password`);
  
      await this.db<TUser>("user").where({ email: email }).update({ password: newHash });
    }
  
    public async isFreezen(email: string): Promise<0 | 1> {
      this.logger.debug(`[CachingUserModel] Is ${email} freezen`);
      this.logger.debug("[CachingUserModel] Getting safe user from cache");
      const cachedUserString = await this.redisClient.get(email);
      const cachedUser: SafeUserObject = JSON.parse(cachedUserString||"null");
  
      if (cachedUser) {
        this.logger.debug("[CachingUserModel] Using user from cache");
        return cachedUser.isFreezen;
      }
  
      this.logger.debug("[CachingUserModel] Using user from DB");
      const record = await this.db<TUser>("user").where({ email }).select("isFreezen").first();
      const result = record || { isFreezen: 0 };
      return result.isFreezen;
    }
  
    public async unfreezeUser(email: string): Promise<void> {
      this.logger.debug(`[CachingUserModel] Unfreezing ${email}`);
  
      await this.db<TUser>("user").where({ email: email }).update({ isFreezen: 0 });
    }
  
    public async freezeUser(email: string): Promise<void> {
      this.logger.debug(`[CachingUserModel] Freezing ${email}`);
  
      await this.db<TUser>("user").where({ email: email }).update({ isFreezen: 1 });
    }
  
    private async _getSafeUser(email: string): Promise<SafeUserObject | undefined> {
      this.logger.debug(`[CachingUserModel] Getting safe user ${email}`);
  
      const user = (await this.db<TUser>("user")
                              .where({ email })
                              .select("id", "email", "isFreezen")
                              .first()) as SafeUserObject | undefined;
  
      return user;
    }
  }