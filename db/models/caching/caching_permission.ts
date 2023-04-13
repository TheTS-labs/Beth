import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../../app";
import PermissionsModel, { TPermissions } from "../permission";

export default class CachingPermissionModel implements PermissionsModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async insertPermissions(email: string): Promise<void> {
    this.logger.debug({ message: "Instering permission", path: module.filename, context: { email } });
    await this.db<TPermissions>("permission").insert({ email });
  }

  private async _getPermissions(email: string): Promise<TPermissions | undefined> {
    this.logger.debug({ message: "Getting permission", path: module.filename, context: { email } });
    const permissions = await this.db<TPermissions>("permission").where({ email }).first();

    return permissions;
  }

  public async getPermissions(email: string): Promise<TPermissions | undefined> {
    this.logger.debug({ message: "Getting user permissions from cache", path: module.filename, context: { email } });
    const cachedPermissionsString = await this.redisClient.get(`${email}_permissions`);
    const cachedPermissions: TPermissions = JSON.parse(cachedPermissionsString||"null");

    if (cachedPermissions) {
      this.logger.debug({ message: "Using cached user permissions", path: module.filename, context: { email } });
      return cachedPermissions;
    }

    this.logger.debug({ message: "Getting user permissions", path: module.filename, context: { email } });
    const permissions = await this._getPermissions(email);
    if (!permissions) {
      return undefined;
    }

    this.logger.debug({ message: "Caching user permissions", path: module.filename, context: { email } });
    await this.redisClient.set(`${email}_permissions`, JSON.stringify(permissions), {
      EX: this.config.get("USER_PERMISSIONS_EX").required().asIntPositive(),
      NX: true
    });

    return permissions;
  }

  public async grantPermission(email: string, permission: string): Promise<void> {
    this.logger.debug({ message: "Granting permission", path: module.filename, context: { email, permission } });
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 1 });
  }

  public async rescindPermission(email: string, permission: string): Promise<void> {
    this.logger.debug({ message: "Rescinding permission", path: module.filename, context: { email, permission } });
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 0 });
  }
}
