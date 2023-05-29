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

// >>> Chain Where Search >>>
export interface Where {
  type: "OR" | "AND"
  clause: "where" | "whereNot"
  key: string
  operator: string
  value: string
}
export interface ChainWhereSearchArgs {
  chain: Where[]
  select: string[] | string
}

export const ChainWhereSearchArgsSchema = Joi.object().keys({
  chain: Joi.array().items(Joi.object().keys({
    type: Joi.string().valid("OR", "AND").default("OR"),
    clause: Joi.string().valid("where", "whereNot").required(),
    key: Joi.string().required(),
    operator: Joi.string().required(),
    value: Joi.string().required(),
  })),
  select: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).default("*")
});
// <<< Chain Where Search <<<

export type ActionRequestArgs = SimpleSearchArgs | ChainWhereSearchArgs;