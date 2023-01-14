import bcrypt from "bcrypt";
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

export default class Create implements IBaseEndpoint {
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
      email: Joi.string().email().required(),
      password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
      repeat_password: Joi.ref("password"),
    }).with("password", "repeat_password"));
  }

  async call(): Promise<void> {
    if (!await this.validate()) { return; }

    bcrypt.hash(this.req.body.password, 3, async (err, hash) => {
      if (err) { this.on_error("HashError", err.message, 500); return; }

      if (!await this.insertUser(this.req.body.email, hash)) { return; }

      const user = await this.getUser(this.req.body.email);
      if (!user) { return; }

      await this.redisClient.set(this.req.body.email, JSON.stringify(user));

      this.res.json({ success: true, result: user } as SuccessDBResponse<SafeUserObject>);
    });
  }

  async validate(): Promise<boolean> {
    const validationError = await this.validator.validate(this.req.body);

    if (validationError) {
      this.on_error("ValidationError", validationError.message, 400);
      return false;
    }

    return true;
  }

  private async insertUser(email: string, hash: string): Promise<boolean> {
    try {
      await this.db<TUser>("user").insert({ email: email, password: hash });
    } catch(err: unknown) {
      const e = err as { message: string, code: string, errno: number };

      this.on_error("DatabaseError", e.message, 500);
      return false;
    }

    return true;
  }

  private async getUser(email: string): Promise<SafeUserObject|undefined> {
    const user = await this.db<TUser>("user").where({ email: email }).select("id", "email", "is_banned").first();
    if (user) { return user; }

    this.on_error("DatabaseError", "Unknown error", 500);
    return undefined;
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
