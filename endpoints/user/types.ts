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
  email: string
  password: string
  newPassword: string
}

export const EditPasswordArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
  newPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
});
// <<< Edit Password <<<

// >>> Freeze >>>
export interface FreezeArgs {
  email: string
  password: string
}

export const FreezeArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
});
// <<< Freeze <<<

export type UserRequestArgs = CreateArgs | ViewArgs | EditPasswordArgs | FreezeArgs;
