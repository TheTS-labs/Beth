import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import PermissionsModel, { TPermissions } from "../permission";

export default class CachingPermissionModel implements PermissionsModel {
  constructor(public db: Knex, public logger: winston.Logger, public redisClient: RedisClientType) {}

  public async insertPermissions(email: string): Promise<void> {
    this.logger.debug(`[CachingPermissionModel] Instering permission for ${email}`);
    await this.db<TPermissions>("permission").insert({ email });
  }

  private async _getPermissions(email: string): Promise<TPermissions | undefined> {
    this.logger.debug(`[CachingPermissionModel] Getting permission for ${email}`);
    const permissions = await this.db<TPermissions>("permission").where({ email }).first();

    return permissions;
  }

  public async getPermissions(email: string): Promise<TPermissions | undefined> {
    this.logger.debug("[CachingPermissionModel] Getting user permissions from cache");
    const cachedPermissionsString = await this.redisClient.get(`${email}_permissions`);
    const cachedPermissions: TPermissions = JSON.parse(cachedPermissionsString||"null");

    if (cachedPermissions) {
      this.logger.debug("[CachingPermissionModel] Using cached user permissions");
      return cachedPermissions;
    }

    this.logger.debug("[CachingPermissionModel] Getting user permissions");
    const permissions = await this._getPermissions(email);
    if (!permissions) {
      return undefined;
    }

    this.logger.debug("[CachingPermissionModel] Caching user permissions");
    await this.redisClient.set(`${email}_permissions`, JSON.stringify(permissions), {
      EX: 60 * 5, // Expires in 5 minutes
      NX: true
    });

    return permissions;
  }

  public async grantPermission(email: string, permission: string): Promise<void> {
    this.logger.debug(`[CachingPermissionModel] Granting ${permission} to ${email}`);
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 1 });
  }

  public async rescindPermission(email: string, permission: string): Promise<void> {
    this.logger.debug(`[CachingPermissionModel] Rescinding ${permission} from ${email}`);
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 0 });
  }
}
