import Joi from "joi";

// >>> Create >>>
export interface CreateArgs {
  email: string
  password: string
  repeatPassword: string
}

export const CreateArgsSchema = Joi.object({
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
  freeze: 1 | 0
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
  verify: 1 | 0
}

export const VerifyArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  verify: Joi.number().min(0).max(1).default(1)
});
// <<< Verify <<<

export type UserRequestArgs = CreateArgs | ViewArgs | EditPasswordArgs | FreezeArgs | EditTagsArgs | VerifyArgs;
