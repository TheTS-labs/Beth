import { Knex } from "knex";
import winston from "winston";

export interface TPermissions {
  id: number
  email: string
  canFreeze: 0|1
}

export default class PermissionsModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger
  ) {}

  public async insertPermissions(email: string): Promise<void|never> {
    this.logger.info(`Instering permissions for ${email}...`);
    await this.db<TPermissions>("permissions").insert({email});
  }

  public async getPermissions(email: string): Promise<TPermissions|undefined> {
    this.logger.info(`Getting permissions for ${email}...`);
    const permissions = await this.db<TPermissions>("permissions").where({email}).first();

    return permissions;
  }
}