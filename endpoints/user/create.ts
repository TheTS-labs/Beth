import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import bcrypt from "bcrypt";
import { RedisClientType } from "redis";
import winston from "winston";

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
  repeat_password: Joi.ref("password"),
}).with("password", "repeat_password");

export default async (req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<void> => {
  const validation = schema.validate(req.body);
  if (validation.error) { res.json({ message: "ValidationError", error: validation.error }); return; }
  
  bcrypt.hash(req.body.password, 3, async function(err, hash) {
    if (err) {
      logger.error(`[create][hash]: ${err.message}`);
      res.json({message: "HashError", error: err.message}); return;
    }

    try {
      await db<TUser>("user").insert({ email: req.body.email, password_hash: hash });
    } catch(err: unknown) {
      const e = err as { message: string, code: string, errno: number };

      logger.error(`[create] DatabaseError: ${e.message}`);
      res.status(500).json({
        message: "DatabaseError",
        err_code: e.code,
        errno: e.errno,
        err_msg: e.message
      }); return;
    }

    const user = await db<TUser>("user").where({
      email: req.body.email
    }).select("id", "email", "is_banned").first();

    if (!user) {
      res.status(500).json({
        message: "DatabaseError",
        err_msg: "Unknown error"
      }); return;
    }

    await redisClient.set(req.body.email, JSON.stringify(user));

    res.json({
      succsess: true,
      id: user.id
    });
  });
};