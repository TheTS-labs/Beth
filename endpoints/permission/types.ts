// View - list of perms
// Grant - Grant perm
// Rescind - rescind perm

import Joi from "joi";

// >>> View >>>
export interface ViewArgs {
  email: string
}

export const ViewArgsSchema = Joi.object({
  email: Joi.string().email().required(),
});
// <<< View <<<

// >>> Grant >>>
export interface GrantArgs {
  email: string
  grantPermission: string
  grantTo: string
  password: string
}

export const GrantArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  grantPermission: Joi.string().required(),
  grantTo: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
});
// <<< Grant <<<

// >>> Rescind >>>
export interface RescindArgs {
  email: string
  rescindFrom: string
  rescindPermission: string
  password: string
}

export const RescindArgsSchema = Joi.object({
  email: Joi.string().email().required(),
  rescindFrom: Joi.string().email().required(),
  rescindPermission: Joi.string().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,64}$")).required(),
});
// <<< Rescind <<<

export type PermissionRequestArgs = ViewArgs | GrantArgs | RescindArgs;
