import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import ENV from "../../config";

export interface TPermissions {
  id: number
  email: string
  user_view: 0 | 1
  user_editPassword: 0 | 1
  user_freeze: 0 | 1
  permissions_view: 0 | 1
  permissions_grand: 0 | 1
  permissions_rescind: 0 | 1
}

export default class PermissionsModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async insertPermissions(email: string): Promise<void> {
    this.logger.debug(`[PermissionsModel] Instering permission for ${email}`);
    await this.db<TPermissions>("permission").insert({ email });
  }

  public async getPermissions(email: string): Promise<TPermissions | undefined> {
    this.logger.debug(`[PermissionsModel] Getting permission for ${email}`);
    const permissions = await this.db<TPermissions>("permission").where({ email }).first();

    return permissions;
  }

  public async grantPermission(email: string, permission: string): Promise<void> {
    this.logger.debug(`[PermissionsModel] Granting ${permission} to ${email}`);
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 1 });
  }

  public async rescindPermission(email: string, permission: string): Promise<void> {
    this.logger.debug(`[PermissionsModel] Rescinding ${permission} from ${email}`);
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 0 });
  }
}
