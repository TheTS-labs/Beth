import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import { IBaseEndpoint } from "../base_endpoint";
import JoiValidator from "../joi_validator";
import { ErrorResponse, SuccessDBResponse } from "../response_interfaces";

export default class EditPassword implements IBaseEndpoint {
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
    
      new_password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    }));
  }

  async call(): Promise<void> {
    if (!await this.validate()) { return; }

    const user = await this.getUser(this.req.body.email);
    if (!user) { return; }

    bcrypt.compare(this.req.body.password, user.password, async (err, result) => {
      if (err) { this.on_error("HashError", err.message, 500); return; }

      if (!result) { this.on_error("AuthError", "Wrong password", 400); return; }

      bcrypt.hash(this.req.body.new_password, 3, async (err, hash) => {
        if (err) { this.on_error("HashError", "err.message", 500); return; }
  
        await this.db<TUser>("user").where({email: this.req.body.email}).update({password: hash});
        this.redisClient.del(this.req.body.email);
  
        this.res.json({success: true, result: user.id} as SuccessDBResponse<TUser["id"]>);
      });
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

  private async getUser(email: string): Promise<TUser|undefined> {
    const user = await this.db<TUser>("user").where({email}).select().first();

    if (user) { return user; }

    this.on_error("DatabaseError", `User with email ${email} not found`, 404);
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
