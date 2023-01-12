import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import BaseEndpoint from "../base_endpoint";
import JoiValidator from "../joi_validator";

export default class Create implements BaseEndpoint {
  validator: JoiValidator;

  constructor() {
    this.validator = new JoiValidator(Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
      repeat_password: Joi.ref("password"),
    }).with("password", "repeat_password"));
  }

  async call(req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<void> {
    if (!await this.validate(req, res)) { return; }

    bcrypt.hash(req.body.password, 3, async (err, hash) => {
      if (err) {
        logger.error(`[create][hash]: ${err.message}`);
        res.json({message: "HashError", error: err.message}); return;
      }

      const insertResult = await this.insertUser(db, req.body.email, hash, logger, res);
      if (!insertResult) { return; }

      const user = await this.getUser(db, req.body.email, res);
      if (!user) { return;}

      await redisClient.set(req.body.email, JSON.stringify(user));

      res.json({ succsess: true, id: user.id });
    });
  }

  async validate(req: Request, res: Response): Promise<boolean> {
    const validationError = await this.validator.validate(req.body);

    if (validationError) { res.json({ message: "ValidationError", error: validationError }); return false; }

    return true;
  }

  private async insertUser(db: Knex, email: string, hash: string, logger: winston.Logger, res: Response): Promise<boolean> {
    try {
      await db<TUser>("user").insert({ email: email, password: hash });
    } catch(err: unknown) {
      const e = err as { message: string, code: string, errno: number };

      logger.error(`[create] DatabaseError: ${e.message}`);
      res.status(500).json({
        message: "DatabaseError",
        err_code: e.code,
        errno: e.errno,
        err_msg: e.message
      });
      return false;
    }

    return true;
  }

  private async getUser(db: Knex, email: string, res: Response): Promise<Pick<TUser, "email"|"id"|"is_banned">|undefined> {
    const user = await db<TUser>("user").where({ email: email }).select("id", "email", "is_banned").first();
    if (user) { return user; }

    res.status(500).json({
      message: "DatabaseError",
      err_msg: "Unknown error"
    }); return undefined;
  }
}
