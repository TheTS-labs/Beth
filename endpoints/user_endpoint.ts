import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { TUser } from "../db/migrations/20230106181658_create_user_table";
import { IBaseEndpoint } from "./base_endpoint";
import { SafeUserObject } from "./common_types";
import JoiValidator from "./joi_validator";
import { ErrorResponse, SuccessDBResponse } from "./response_interfaces";

export default class UserEndpoint implements IBaseEndpoint {
  validator: JoiValidator = new JoiValidator();
  db: Knex;
  redisClient: RedisClientType;
  logger: winston.Logger;
  req!: Request;
  res!: Response;
  allowNames: Array<string> = [
    "create", "view",
    "edit_password",
  ];

  constructor(db: Knex, redisClient: RedisClientType, logger: winston.Logger) {
    this.db = db;
    this.redisClient = redisClient;
    this.logger = logger;
  }

  // >>> Create >>>
  async create(): Promise<void> {
    if (!await this.validate(Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
      repeatPassword: Joi.ref("password"),
    }).with("password", "repeatPassword"))) { return; }

    bcrypt.hash(this.req.body.password, 3, async (err, hash) => {
      if (err) { this.onError("HashError", err.message, 500); return; }
      if (!await this.insertUser(this.req.body.email, hash)) { return; }

      const user = await this.getUser(this.req.body.email);
      if (!user) { return; }

      await this.redisClient.set(this.req.body.email, JSON.stringify(user));

      this.res.json({ success: true, result: user } as SuccessDBResponse<SafeUserObject>);
    });
  }
  // <<< Create <<<

  // <<< View <<<
  async view(): Promise<void> {
    const user: SafeUserObject|SafeUserObject|undefined = await this.getUser(this.req.body.email);
    if (!user) { return; }

    this.res.json({
      success: true,
      result: user
    } as SuccessDBResponse<SafeUserObject>);
  }
  // >>> View >>>

  // <<< Edit Password <<<
  async editPassword(): Promise<void> {
    if (!await this.validate(Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),

      newPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    }))) { return; }

    const user = await this.getUnsafeUser(this.req.body.email);
    if (!user) { return; }

    bcrypt.compare(this.req.body.password, user.password, async (err, result) => {
      if (err) { this.onError("HashError", err.message, 500); return; }

      if (!result) { this.onError("AuthError", "Wrong password", 400); return; }

      bcrypt.hash(this.req.body.newPassword, 3, async (err, hash) => {
        if (err) { this.onError("HashError", "err.message", 500); return; }
  
        await this.db<TUser>("user").where({email: this.req.body.email}).update({password: hash});
        this.redisClient.del(this.req.body.email);
  
        this.res.json({success: true, result: user.id} as SuccessDBResponse<TUser["id"]>);
      });
    });
  }
  // >>> Edit Password >>>

  async callEndpoint(name: string, req: Request, res: Response): Promise<void> {
    this.logger.debug(`[User] Incoming Request: ${JSON.stringify(req.body)}`);
    this.req = req; this.res = res;

    if (!this.allowNames.includes(req.params.endPoint)) {
      this.onError("EndpointNotFound", `Endpoint user/${req.params.endPoint} does not exist`, 404);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    this[name]();
  }

  async validate(schema: Joi.ObjectSchema): Promise<boolean> {
    const validationError = await this.validator.validate(schema, this.req.body);

    if (validationError) {
      this.onError("ValidationError", validationError.message, 400);
      return false;
    }

    return true;
  }

  async onError(errorType: string, errorMessage: string, status: number): Promise<void> {
    this.logger.error(`[User] ${status}#${errorType}, ${errorMessage}`);
    this.res.status(status).json({
      success: false,
      errorType: errorType,
      errorMessage: errorMessage
    } as ErrorResponse);
  }

  private async insertUser(email: string, hash: string): Promise<boolean> {
    try {
      this.logger.debug(`[User] Trying to insert user ${email}(${hash})`);
      await this.db<TUser>("user").insert({ email: email, password: hash });
    } catch(err: unknown) {
      const e = err as { message: string, code: string, errno: number };

      this.onError("DatabaseError", e.message, 500);
      return false;
    }

    return true;
  }

  private async getUser(email: string): Promise<SafeUserObject|undefined> {
    this.logger.debug(`[User] Getting safe user ${email}`);
    const user = await this.db<TUser>("user").where({ email: email }).select("id", "email", "is_banned").first();
    if (user) { return user; }

    this.onError("DatabaseError", "Unknown error", 500);
    return undefined;
  }

  private async getUnsafeUser(email: string): Promise<TUser|undefined> {
    const user = await this.db<TUser>("user").where({email}).select().first();

    if (user) { return user; }

    this.onError("DatabaseError", `User with email ${email} not found`, 404);
    return undefined;
  }
}