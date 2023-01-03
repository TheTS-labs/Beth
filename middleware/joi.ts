import { ObjectSchema } from 'joi'
import { Request, Response, NextFunction } from 'express'

export const middleware = (schema: ObjectSchema) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (req: Request, res: Response, next: NextFunction): Function|void => {
    const { error } = schema.validate(req.params)

    if (!error) { next() }
    else {
      const message = error.details.map((i: { message: string }) => i.message).join(',')
      console.log("[error]", message)
      res.status(422).json({ error: message }) 
    }
  }
}
