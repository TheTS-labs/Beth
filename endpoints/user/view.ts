import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import { RedisClientType } from "redis";
import winston from "winston";

const schema = Joi.object({
  email: Joi.string().email().required()
});

type RedisObject = Omit<TUser, "password_hash">;
type DBObject = Pick<TUser, "email" | "id" | "is_banned">;

const getUser = async (req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<DBObject|RedisObject|undefined> => {
  const cached_user = await redisClient.get(req.body.email);

  if (cached_user) {
    return JSON.parse(cached_user) as RedisObject;
  }

  const user = await db<TUser>("user").where({
    email: req.body.email
  }).select("id", "email", "is_banned").first();

  if (!user) {
    logger.error(`[view] DatabaseError: User with email ${req.body.email} not found`);
    res.status(404).json({
      message: "DatabaseError",
      err_msg: `User with email ${req.body.email} not found`
    }); return undefined;
  }

  await redisClient.set(req.body.email, JSON.stringify(user));

  return user;
};

export default async (req: Request, res: Response, db: Knex, redisClient: RedisClientType, logger: winston.Logger): Promise<void> => {
  const validation = schema.validate(req.body);
  if (validation.error) { res.json({ message: "ValidationError", error: validation.error }); return; }

  const user: DBObject|RedisObject|undefined = await getUser(req, res, db, redisClient, logger);
  if (!user) { return; }

  res.json({
    succsess: true,
    user: user
  });
};