import Joi from "joi";

// import { IBaseValidator } from "./base_validator";

export default class JoiValidator implements IBaseValidator {
  async validate(schema: Joi.ObjectSchema, value: unknown): Promise<Joi.ValidationError | undefined> {
    return schema.validate(value).error;
  }
}
