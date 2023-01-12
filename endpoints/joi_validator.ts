import Joi from "joi";

import BaseValidator from "./base_validator";

export default class JoiValidator implements BaseValidator {
  schema: Joi.ObjectSchema;

  constructor(schema: Joi.ObjectSchema) { this.schema = schema; }
  async validate(value: unknown): Promise<Joi.ValidationError|undefined> {
    return this.schema.validate(value).error;
  }
}