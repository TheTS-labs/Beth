import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";

declare class IBaseEndpoint {
  public allowNames: Array<string>;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  );

  async callEndpoint(name: string, args: object, user: TUser | undefined): Promise<object>;
  async validate(schema: unknown, args: object): Promise<void>;
}
