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
  grantPermission: string
  grantTo: string
}

export const GrantArgsSchema = Joi.object({
  grantPermission: Joi.string().required(),
  grantTo: Joi.string().email().required()
});
// <<< Grant <<<

// >>> Rescind >>>
export interface RescindArgs {
  rescindFrom: string
  rescindPermission: string
}

export const RescindArgsSchema = Joi.object({
  rescindFrom: Joi.string().email().required(),
  rescindPermission: Joi.string().required()
});
// <<< Rescind <<<

export type PermissionRequestArgs = ViewArgs | GrantArgs | RescindArgs;
