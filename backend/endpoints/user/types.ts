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
  newPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
});
// <<< Edit Password <<<

// >>> Freeze >>>
export interface FreezeArgs {
  email: string
  freeze: DBBool
}

export const FreezeArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  freeze: Joi.number().min(0).max(1).default(1)
});
// <<< Freeze <<<

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

export type UserRequestArgs = CreateArgs | ViewArgs | EditPasswordArgs | FreezeArgs | EditTagsArgs | VerifyArgs;
