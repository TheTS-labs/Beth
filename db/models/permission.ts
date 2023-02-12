import { Knex } from "knex";
import winston from "winston";

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
  constructor(public db: Knex, public logger: winston.Logger) {}

  public async insertPermissions(email: string): Promise<void | never> {
    this.logger.debug(`Instering permission for ${email}...`);
    await this.db<TPermissions>("permission").insert({ email });
  }

  public async getPermissions(email: string): Promise<TPermissions | undefined> {
    this.logger.debug(`Getting permission for ${email}...`);
    const permissions = await this.db<TPermissions>("permission").where({ email }).first();

    return permissions;
  }

  public async grantPermission(email: string, permission: string): Promise<void> {
    this.logger.debug(`Granting permission(${permission}) to ${email}...`);
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 1 });
  }

  public async rescindPermission(email: string, permission: string): Promise<void> {
    this.logger.debug(`Rescinding permission(${permission}) from ${email}...`);
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: 0 });
  }
}
