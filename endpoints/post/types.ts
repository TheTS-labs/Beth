import Joi from "joi";

// >>> Create >>>
export interface CreateArgs {
  text: string
}

export const CreateArgsSchema = Joi.object({
  text: Joi.string().required()
});
// <<< Create <<<

// >>> View >>>
export interface ViewArgs {
  id: number
}
  
export const ViewArgsSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});
// <<< View <<<

// >>> Edit >>>
export interface EditArgs {
  id: number
  newText: string
}
  
export const EditArgsSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  newText: Joi.string().required()
});
// <<< Edit <<<

// >>> Delete >>>
export interface DeleteArgs {
  id: number
}
  
export const DeleteArgsSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});
// <<< Delete <<<

// >>> Get List >>>
export interface GetListArgs {
  afterCursor: string
  numberRecords: number
}
  
export const GetListArgsSchema = Joi.object({
  afterCursor: Joi.string(),
  numberRecords: Joi.number().positive()
});
// <<< Get List <<<


export type PostRequestArgs = CreateArgs | ViewArgs | EditArgs | DeleteArgs | GetListArgs;