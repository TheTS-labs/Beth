import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import { IBaseEndpoint } from "../base_endpoint";
import JoiValidator from "../joi_validator";
import { ErrorResponse, JoiErrorResponse, SuccessDBResponse } from "../response_interfaces";

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
      if (err) {
        this.logger.error(`[edit_password][hash]: ${err.message}`);
        this.res.json({
          success: false,
          errorType: "HashError",
          errorMessage: err.message
        } as ErrorResponse); return;
      }

      if (!result) { this.res.json({ success: false, errorType: "AuthError", errorMessage: "Wrong password" } as ErrorResponse); return; }

      bcrypt.hash(this.req.body.new_password, 3, async (err, hash) => {
        if (err) {
          this.logger.error(`[edit][hash]: ${err.message}`);
          this.res.json({ success: false, errorType: "HashError", errorMessage: err.message } as ErrorResponse); return;
        }
  
        await this.db<TUser>("user").where({email: this.req.body.email}).update({password: hash});
        this.redisClient.del(this.req.body.email);
  
        this.res.json({success: true, result: user.id} as SuccessDBResponse<TUser["id"]>);
      });
    });
  }

  async validate(): Promise<boolean> {
    const validationError = await this.validator.validate(this.req.body);

    if (validationError) {
      this.res.json({
        success: false,
        errorType: "ValidationError",
        errorMessage: validationError
      } as JoiErrorResponse);
      return false;
    }

    return true;
  }

  private async getUser(email: string): Promise<TUser|undefined> {
    const user = await this.db<TUser>("user").where({email}).select().first();

    if (user) { return user; }

    this.logger.error(`[edit] DatabaseError: User with email ${email} not found`);
    this.res.status(404).json({
      success: false,
      errorType: "DatabaseError",
      errorMessage: `User with email ${email} not found`
    } as ErrorResponse); return undefined;
  }
}
