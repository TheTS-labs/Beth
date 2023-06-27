import Joi from "joi";

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
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
  repeatPassword: Joi.ref("password"),
}).with("password", "repeatPassword");
// <<< Create <<<

// >>> View >>>
export interface ViewArgs {
  id: number
}

export const ViewArgsSchema = Joi.object({
  id: Joi.number().positive().required(),
});
// <<< View <<<

// >>> Edit Password >>>
export interface EditPasswordArgs {
  newPassword: string
}

export const EditPasswordArgsSchema = Joi.object({
  newPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
});
// <<< Edit Password <<<

// >>> Froze >>>
export interface FrozeArgs {
  id: number
  froze: DBBool
}

export const FrozeArgsSchema = Joi.object({
  id: Joi.number().positive().required(),
  froze: Joi.number().min(0).max(1).default(1)
});
// <<< Froze <<<

// >>> Edit Tags >>>
export interface EditTagsArgs {
  id: number
  newTags: string
}

export const EditTagsArgsSchema = Joi.object({
  id: Joi.number().positive().required(),
  newTags: Joi.string().pattern(/^[a-zA-Z0-9]+(?:,[a-zA-Z0-9]+)*$/).required()
});
// <<< Edit Tags <<<

// >>> Verify >>>
export interface VerifyArgs {
  id: number
  verify: DBBool
}

export const VerifyArgsSchema = Joi.object({
  id: Joi.number().positive().required(),
  verify: Joi.number().min(0).max(1).default(1)
});
// <<< Verify <<<

// >>> Issue Token >>>
export interface IssueTokenArgs {
  id: number
  password: string
  expiresIn: string
  scope: string[]
}

export const IssueTokenArgsSchema = Joi.object({
  id: Joi.number().positive().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
  expiresIn: Joi.alternatives().try(Joi.number(), Joi.string()).default(2592000), // 30 days
  scope: Joi.array().items(Joi.string()).required()
});
// <<< Issue Token <<<

export type UserRequestArgs = CreateArgs | ViewArgs | EditPasswordArgs |
                              FrozeArgs | EditTagsArgs | VerifyArgs | IssueTokenArgs;
