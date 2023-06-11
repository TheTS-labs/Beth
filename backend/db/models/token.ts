import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import { DBBool } from "../../common/types";

export interface TToken {
  id: number
  owner: string
  revoked: DBBool
  iat: Date
  exp: Date
  scope: string
}

export default class TokenModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async issue(owner: string, iat: Date, exp: Date, scope: string): Promise<void> {
    this.logger.debug({ message: "Issued", path: module.filename, context: { owner, iat, exp, scope } });
    await this.db<TToken>("token").insert({ owner, iat, exp, scope });
  }

  public async revoke(id: number): Promise<void> {
    this.logger.debug({ message: "Revoked", path: module.filename, context: { id } });
    await this.db<TToken>("token").where({ id }).update({ revoked: DBBool.Yes });
  }

  public async getToken(id: number): Promise<TToken | undefined> {
    this.logger.debug({ message: "Get token", path: module.filename, context: { id } });
    const token = await this.db<TToken>("token").where({ id }).first();

    return token;
  }
}