import Joi from "joi";

// >>> Base >>>
interface Base {
  id: number
}

const base =  Joi.object().keys({
  id: Joi.number().integer().positive().required()
});
// <<< Base <<< 

// >>> Create >>>
export interface CreateArgs {
  text: string
  replyTo: number | undefined
}

export const CreateArgsSchema = Joi.object({
  text: Joi.string().required(),
  replyTo: Joi.number().positive()
});
// <<< Create <<<

// >>> View >>>
export type ViewArgs = Base;

export const ViewArgsSchema = base;
// <<< View <<<

// >>> Edit >>>
export interface EditArgs extends Base {
  newText: string
}
  
export const EditArgsSchema = base.keys({
  newText: Joi.string().required()
});
// <<< Edit <<<

// >>> Delete >>>
export type DeleteArgs = Base;

export const DeleteArgsSchema = base;
// <<< Delete <<<

// >>> Get List >>>
export interface GetListArgs {
  afterCursor: string | undefined
  numberRecords: number
}
  
export const GetListArgsSchema = Joi.object({
  afterCursor: Joi.string().default(() => undefined),
  numberRecords: Joi.number().positive().default(3)
});
// <<< Get List <<<

// >>> Force Delete >>>
export type ForceDeleteArgs = Base;
  
export const ForceDeleteArgsSchema = base;
// <<< Force Delete <<<

// >>> View Replies >>>
export interface ViewRepliesArgs {
  repliesTo: number
}

export const ViewRepliesArgsSchema = Joi.object({
  repliesTo: Joi.number().positive().required()
});
// <<< View Replies <<<

// >>> Edit Tags >>>
export interface EditTagsArgs extends Base {
  newTags: string
}

export const EditTagsArgsSchema = base.keys({
  newTags: Joi.string().pattern(/^[a-zA-Z0-9]+(?:,[a-zA-Z0-9]+)*$/).required()
});
// <<< Edit Tags <<<

// >>> Search >>>
export interface SearchArgs {
  query: string
  afterCursor: string | undefined
  numberRecords: number
}

export const SearchArgsSchema = Joi.object({
  query: Joi.string().required(),
  afterCursor: Joi.string().default(() => undefined),
  numberRecords: Joi.number().positive().default(10)
});
// <<< Search <<<

export type PostRequestArgs = CreateArgs | ViewArgs | EditArgs |
                              DeleteArgs | GetListArgs | ForceDeleteArgs |
                              ViewRepliesArgs | EditTagsArgs | SearchArgs;