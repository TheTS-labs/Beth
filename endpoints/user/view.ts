import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import { IBaseEndpoint } from "../base_endpoint";
import { SafeUserObject } from "../common_types";
import JoiValidator from "../joi_validator";
import { ErrorResponse, SuccessDBResponse } from "../response_interfaces";

export default class View implements IBaseEndpoint {
  validator: JoiValidator;
  req: Request;
  res: Response;
  db: Knex;
  redisClient: RedisClientType;
  logger: winston.Logger;

  constructor(req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger) {
    this.req = req;
    this.res = res;
    this.db = db;
    this.redisClient = redisClient;
    this.logger = logger;

    this.validator = new JoiValidator(Joi.object({
      email: Joi.string().email().required()
    }));
  }

  async call(): Promise<void> {
    const user: SafeUserObject|SafeUserObject|undefined = await this.getUser(this.req.body.email);
    if (!user) { return; }

    this.res.json({
      success: true,
      result: user
    } as SuccessDBResponse<SafeUserObject>);
  }

  async validate(): Promise<boolean> {
    const validationError = await this.validator.validate(this.req.body);

    if (validationError) {
      this.on_error("ValidationError", validationError.message, 400);
      return false;
    }

    return true;
  }

  private async getUser(email: string): Promise<SafeUserObject|undefined> {
    const cached_user = await this.redisClient.get(email);

    if (cached_user) { return JSON.parse(cached_user) as SafeUserObject; }

    const user = await this.db<TUser>("user").where({ email: email }).select("id", "email", "is_banned").first();
    if (!user) { this.on_error("DatabaseError", `User with email ${email} not found`, 404); return undefined; }

    await this.redisClient.set(email, JSON.stringify(user));
    return user;
  }

  async on_error(errorType: string, errorMessage: string, status: number): Promise<void> {
    this.logger.error(`[/user/create] ${errorType}, ${errorMessage}`);
    this.res.status(status).json({
      success: false,
      errorType: errorType,
      errorMessage: errorMessage
    } as ErrorResponse);
  }
}
