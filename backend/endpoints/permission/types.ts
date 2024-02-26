import Joi from "joi";

// >>> View >>>
export interface ViewArgs {
  email: string
}

export const ViewArgsSchema = Joi.object({
  email: Joi.string().email().required(),
});
// <<< View <<<

// >>> Grand >>>
export interface GrandArgs {
  grandPermission: string
  grandTo: string
}

export const GrandArgsSchema = Joi.object({
  grandPermission: Joi.string().required(),
  grandTo: Joi.string().email().required()
});
// <<< Grand <<<

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

export type PermissionRequestArgs = ViewArgs | GrandArgs | RescindArgs;
