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
  afterCursor: string
  numberRecords: number
}
  
export const GetListArgsSchema = Joi.object({
  afterCursor: Joi.string(),
  numberRecords: Joi.number().positive()
});
// <<< Get List <<<

// >>> Force Delete >>>
export type ForceDeleteArgs = Base;
  
export const ForceDeleteArgsSchema = base;
// <<< Force Delete <<<

// >>> View Replies >>>
export interface ViewRepliesArgs {
  parent: number
}

export const ViewRepliesArgsSchema = Joi.object({
  parent: Joi.number().positive().required()
});
// <<< View Replies <<<

// >>> Upvote >>>
export type UpvoteArgs = Base;

export const UpvoteArgsSchema = base;
// <<< Upvote <<<

// >>> Downvote >>>
export type DownvoteArgs = Base;

export const DownvoteArgsSchema = base;
// <<< Downvote <<<

export type PostRequestArgs = CreateArgs | ViewArgs | EditArgs |
                              DeleteArgs | GetListArgs | ForceDeleteArgs |
                              ViewRepliesArgs | UpvoteArgs | DownvoteArgs;