import Joi from "joi";

// >>> Simple Search >>>
export interface SimpleSearchArgs {
  key: string
  operator: string
  value: string
  currentPage: number
  perPage: number
}

export const SimpleSearchArgsSchema = Joi.object().keys({
  key: Joi.string().required(),
  operator: Joi.string().required(),
  value: Joi.string().required(),
  currentPage: Joi.number().positive().default(1),
  perPage: Joi.number().positive().default(10).max(100),
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
  currentPage: number
  perPage: number
}

export const ChainWhereSearchArgsSchema = Joi.object().keys({
  chain: Joi.array().items(Joi.object().keys({
    type: Joi.string().valid("OR", "AND").default("OR"),
    clause: Joi.string().valid("where", "whereNot").required(),
    key: Joi.string().required(),
    operator: Joi.string().required(),
    value: Joi.string().required(),
  })),
  currentPage: Joi.number().positive().default(0),
  perPage: Joi.number().positive().default(10).max(100),
});
// <<< Chain Where Search <<<

export type ActionRequestArgs = SimpleSearchArgs | ChainWhereSearchArgs;