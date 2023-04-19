import Joi from "joi";

// >>> Simple Search >>>
export interface SimpleSearchArgs {
  key: string
  operator: string
  value: string
  select: string[] | string
}

export const SimpleSearchArgsSchema = Joi.object().keys({
  key: Joi.string().required(),
  operator: Joi.string().required(),
  value: Joi.string().required(),
  select: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).default("*")
});
// <<< Simple Search <<<



export type ActionRequestArgs = SimpleSearchArgs;