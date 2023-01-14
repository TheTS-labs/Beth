import { Request, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import BaseValidator from "./base_validator";

declare class IBaseEndpoint {
  validator: BaseValidator;
  req: Request;
  res: Response;
  db: Knex;
  redisClient: RedisClientType;
  logger: winston.Logger;

  constructor(req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger);

  call(): Promise<void>;
  validate(): Promise<boolean>;
}