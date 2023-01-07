import { Request, Response } from 'express'
import Joi from 'joi'
import { Knex } from 'knex'
import { TUser } from '../../db/migrations/20230106181658_create_user_table'
import bcrypt from "bcrypt"

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  repeat_password: Joi.ref('password'),
}).with('password', 'repeat_password')

export default (req: Request, res: Response, db: Knex): void => {
  const validation = schema.validate(req.body)
  if (validation.error) { res.json({ message: 'ValidationError', error: validation.error }); return }
  
  bcrypt.hash(req.body.password, 3, function(err, hash) {
    if (err) { res.json({message: "HashError", error: err.message}); return }

    db<TUser>('user').insert(
      { email: req.body.email, password_hash: hash }
    ).then((id) => {
      res.json({
        succsess: true,
        id: id[0]
      })
    }).catch((err) => { res.json({message: "DatabaseError", error: err.message}) })
  })
}