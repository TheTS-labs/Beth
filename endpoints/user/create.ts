import { Request, Response } from "express";
import Joi from "joi";
import { Knex } from "knex";
import { TUser } from "../../db/migrations/20230106181658_create_user_table";
import bcrypt from "bcrypt";

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
  repeat_password: Joi.ref("password"),
}).with("password", "repeat_password");

export default async (req: Request, res: Response, db: Knex): Promise<void> => {
  const validation = schema.validate(req.body);
  if (validation.error) { res.json({ message: "ValidationError", error: validation.error }); return; }
  
  bcrypt.hash(req.body.password, 3, async function(err, hash) {
    if (err) { res.json({message: "HashError", error: err.message}); return; }

    let id;

    try {
      id = (await db<TUser>("user").insert({ email: req.body.email, password_hash: hash }))[0];
    } catch(err: unknown) {
      const e = err as { message: string, code: string, errno: number };

      console.error(`[create] DatabaseError: ${e.message}`);
      res.json({
        message: "DatabaseError",
        err_code: e.code,
        errno: e.errno,
        err_msg: e.message
      }); return;
    }

    res.json({
      succsess: true,
      id: id
    });
  });
};