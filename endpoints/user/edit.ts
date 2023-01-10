import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import { RedisClientType } from "redis";
import winston from "winston";
import bcrypt from "bcrypt";

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),

  edit_password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
});

export default async (req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<void> => {
  const validation = schema.validate(req.body);
  if (validation.error) { res.json({ message: "ValidationError", error: validation.error }); return; }

  const user = await db<TUser>("user").where({
    email: req.body.email
  }).select().first();

  if (!user) {
    logger.error(`[edit] DatabaseError: User with email ${req.body.email} not found`);
    res.status(404).json({
      message: "DatabaseError",
      err_msg: `User with email ${req.body.email} not found`
    }); return;
  }

  bcrypt.compare(req.body.password, user.password, async function(err, result) {
    if (err) {
      logger.error(`[edit][hash]: ${err.message}`);
      res.json({message: "HashError", error: err.message}); return;
    }

    if (!result) { res.json({message: "AuthError", error: "Wrong password"}); return; }

    bcrypt.hash(req.body.edit_password, 3, async function(err, hash) {
      if (err) {
        logger.error(`[edit][hash]: ${err.message}`);
        res.json({message: "HashError", error: err.message}); return;
      }

      await db<TUser>("user").where({email: req.body.email}).update({password: hash});
      redisClient.del(req.body.email);

      res.json({success: true, id: user.id});
    });
  });
};