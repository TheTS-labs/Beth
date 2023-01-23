import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import BaseValidator from "./base_validator";

declare class IBaseEndpoint {
  validator: BaseValidator;
  db: Knex;
  redisClient: RedisClientType;
  logger: winston.Logger;
  allowNames: Array<string>;
  model?: unknown;

  constructor(db: Knex, redisClient: RedisClientType, logger: winston.Logger);

  async callEndpoint(name: string, args: RequestArgs): PromiseResponse;
  async validate(schema: unknown, args: unknown): Promise<FunctionResponse<undefined>>;
}