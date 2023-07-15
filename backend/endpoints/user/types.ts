import Joi from "joi";

import scopes from "../../common/scopes";
import { DBBool } from "../../common/types";

// >>> Create >>>
export interface CreateArgs {
  username: string
  displayName: string
  email: string
  password: string
  repeatPassword: string
}

export const CreateArgsSchema = Joi.object({
  username: Joi.string().required(),
  displayName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().regex(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/mi
  ).required(),
  repeatPassword: Joi.ref("password"),
}).with("password", "repeatPassword");
// <<< Create <<<

// >>> View >>>
export interface ViewArgs {
  email: string
}

export const ViewArgsSchema = Joi.object({
  email: Joi.string().email().required(),
});
// <<< View <<<

// >>> Edit Password >>>
export interface EditPasswordArgs {
  newPassword: string
}

export const EditPasswordArgsSchema = Joi.object({
  newPassword: Joi.string().regex(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/mi
  ).required(),
});
// <<< Edit Password <<<

// >>> Froze >>>
export interface FrozeArgs {
  email: string
  froze: DBBool
}

export const FrozeArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  froze: Joi.number().min(0).max(1).default(1)
});
// <<< Froze <<<

// >>> Edit Tags >>>
export interface EditTagsArgs {
  email: string
  newTags: string
}

export const EditTagsArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  newTags: Joi.string().pattern(/^[a-zA-Z0-9]+(?:,[a-zA-Z0-9]+)*$/).required()
});
// <<< Edit Tags <<<

// >>> Verify >>>
export interface VerifyArgs {
  email: string
  verify: DBBool
}

export const VerifyArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  verify: Joi.number().min(0).max(1).default(1)
});
// <<< Verify <<<

// >>> Issue Token >>>
export type IssueTokenArgs = {
  email: string
  password: string
  expiresIn: string
  scope: string[]
  shorthand: undefined
} | {
  email: string
  password: string
  expiresIn: undefined
  shorthand: keyof typeof scopes
};

export const IssueTokenArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().regex(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/mi
  ).required(),
  expiresIn: Joi.alternatives().try(Joi.number(), Joi.string()).default(2592000), // 30 days
  scope: Joi.array().items(Joi.string()),
  shorthand: Joi.string().valid("login")
}).xor("scope", "shorthand");
// <<< Issue Token <<<

export type UserRequestArgs = CreateArgs | ViewArgs | EditPasswordArgs |
                              FrozeArgs | EditTagsArgs | VerifyArgs | IssueTokenArgs;
