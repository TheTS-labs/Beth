import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

declare class IBaseEndpoint {
  public allowNames: Array<string>;

  constructor(public db: Knex, public redisClient: RedisClientType, public logger: winston.Logger);

  async callEndpoint(name: string, args: object, user: TUser | undefined): Promise<object | never>;
  async validate(schema: unknown, args: object): Promise<void | never>;
}
