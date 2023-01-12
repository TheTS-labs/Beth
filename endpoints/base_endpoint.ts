import { Request, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import BaseValidator from "./base_validator";

export default abstract class BaseEndpoint {
  abstract validator: BaseValidator;

  abstract call(req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<void>;
  abstract validate(req: Request, res: Response): Promise<boolean>;
}