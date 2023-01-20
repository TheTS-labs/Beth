import { Request, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import BaseValidator from "./base_validator";

declare class IBaseEndpoint {
  validator: BaseValidator;
  req!: Request;
  res!: Response;
  db: Knex;
  redisClient: RedisClientType;
  logger: winston.Logger;
  allowNames: Array<string>;

  constructor(db: Knex, redisClient: RedisClientType, logger: winston.Logger);

  async callEndpoint(name: string, req: Request, res: Response): Promise<void>;
  async validate(schema: unknown, value: unknown): Promise<boolean>;
  async onError(errorType: string, errorMessage: string, status: number): Promise<void>;
}