import { Knex } from "knex";
import winston from "winston";

export interface TPermissions {
  id: number
  email: string
  canFreeze: 0 | 1
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
}
