import Joi from "joi";

// import { IBaseValidator } from "./base_validator";

export default class JoiValidator implements IBaseValidator {
  schema: Joi.ObjectSchema;

  constructor(schema: Joi.ObjectSchema) { this.schema = schema; }
  async validate(value: unknown): Promise<Joi.ValidationError|undefined> {
    return this.schema.validate(value).error;
  }
}