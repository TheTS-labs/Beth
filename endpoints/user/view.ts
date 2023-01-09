import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { TUser } from "../../db/migrations/20230106181658_create_user_table";

const schema = Joi.object({
  email: Joi.string().email().required()
}).with("password", "repeat_password");

export default async (req: Request, res: Response, db: Knex): Promise<void> => {
  const validation = schema.validate(req.body);
  if (validation.error) { res.json({ message: "ValidationError", error: validation.error }); return; }

  const user = await db<TUser>("user").where({
    email: req.body.email
  }).select("id", "email", "is_banned").first();

  if (!user) {
    console.error(`[view] DatabaseError: User with email ${req.body.email} not found`);
    res.status(404).json({
      message: "DatabaseError",
      err_msg: `User with email ${req.body.email} not found`
    }); return;
  }

  res.json({
    succsess: true,
    user: user,
  });
};