import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import BaseEndpoint from "../base_endpoint";
import JoiValidator from "../joi_validator";
import { ErrorResponse, JoiErrorResponse, SuccessDBResponse } from "../response_interfaces";

type RedisObject = Omit<TUser, "password_hash">;
type DBObject = Pick<TUser, "email" | "id" | "is_banned">;

export default class View implements BaseEndpoint {
  validator: JoiValidator;

  constructor() {
    this.validator = new JoiValidator(Joi.object({
      email: Joi.string().email().required()
    }));
  }

  async call(req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<void> {
    const user: DBObject|RedisObject|undefined = await this.getUser(req.body.email, res, db, redisClient, logger);
    if (!user) { return; }

    res.json({
      success: true,
      result: user
    } as SuccessDBResponse<DBObject>);
  }

  async validate(req: Request, res: Response): Promise<boolean> {
    const validationError = await this.validator.validate(req.body);

    if (validationError) {
      res.json({
        success: false,
        errorType: "ValidationError",
        errorMessage: validationError
      } as JoiErrorResponse);
      return false;
    }

    return true;
  }

  private async getUser(email: string, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<DBObject|RedisObject|undefined> {
    const cached_user = await redisClient.get(email);

    if (cached_user) { return JSON.parse(cached_user) as RedisObject; }

    const user = await db<TUser>("user").where({ email: email }).select("id", "email", "is_banned").first();
    if (!user) {
      logger.error(`[view] DatabaseError: User with email ${email} not found`);
      res.status(404).json({
        success: false,
        errorType: "DatabaseError",
        errorMessage: `User with email ${email} not found`
      } as ErrorResponse); return undefined;
    }

    await redisClient.set(email, JSON.stringify(user));
    return user;
  }
}
