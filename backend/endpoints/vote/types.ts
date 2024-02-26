import Joi from "joi";

import { VoteType } from "../../db/models/vote";

// >>> Base >>>
interface Base {
  postId: number
  voteType: VoteType
}

const base = Joi.object().keys({
  postId: Joi.number().positive().required(),
  voteType: Joi.number().min(0).max(1).required()
});
// <<< Base <<< 

// >>> Vote >>>
export type VoteArgs = Base;
export const VoteArgsSchema = base;
// <<< Vote <<<

// >>> Vote count >>>
export interface VoteCountArgs {
  postId: number
}

export const VoteCountArgsSchema = Joi.object().keys({
  postId: Joi.number().positive().required()
});
// <<< Vote count <<<

export type VoteRequestArgs = VoteArgs | VoteCountArgs;