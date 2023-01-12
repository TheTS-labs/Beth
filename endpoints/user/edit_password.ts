import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import BaseEndpoint from "../base_endpoint";
import JoiValidator from "../joi_validator";

export default class EditPassword implements BaseEndpoint {
  validator: JoiValidator;

  constructor() {
    this.validator = new JoiValidator(Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    
      new_password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    }));
  }

  async call(req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<void> {
    if (!await this.validate(req, res)) { return; }

    const user = await this.getUser(db, req.body.email, res, logger);
    if (!user) { return; }

    bcrypt.compare(req.body.password, user.password, async (err, result) => {
      if (err) {
        logger.error(`[edit_password][hash]: ${err.message}`);
        res.json({message: "HashError", error: err.message}); return;
      }

      if (!result) { res.json({message: "AuthError", error: "Wrong password"}); return; }

      bcrypt.hash(req.body.new_password, 3, async function(err, hash) {
        if (err) {
          logger.error(`[edit][hash]: ${err.message}`);
          res.json({message: "HashError", error: err.message}); return;
        }
  
        await db<TUser>("user").where({email: req.body.email}).update({password: hash});
        redisClient.del(req.body.email);
  
        res.json({success: true, id: user.id});
      });
    });
  }

  async validate(req: Request, res: Response): Promise<boolean> {
    const validationError = await this.validator.validate(req.body);

    if (validationError) { res.json({ message: "ValidationError", error: validationError }); return false; }

    return true;
  }

  private async getUser(db: Knex, email: string, res: Response, logger: winston.Logger): Promise<TUser|undefined> {
    const user = await db<TUser>("user").where({
      email: email
    }).select().first();

    if (user) { return user; }

    logger.error(`[edit] DatabaseError: User with email ${email} not found`);
    res.status(404).json({
      message: "DatabaseError",
      err_msg: `User with email ${email} not found`
    }); return undefined;
  }
}
