import Joi from "joi";

import { Vote } from "../../db/models/vote";

// >>> Base >>>
interface Base {
  postId: number
  voteType: Vote
}

const base = Joi.object().keys({
  postId: Joi.number().positive().required(),
  voteType: Joi.number().min(0).max(1).required()
});
// <<< Base <<< 

// >>> Vote >>>
export interface VoteArgs extends Base {
  unvote: boolean
}

export const VoteArgsSchema = base.keys({
  unvote: Joi.boolean().default(false)
});
// <<< Vote <<<

// >>> Vote count >>>
export type VoteCountArgs = Base;

export const VoteCountArgsSchema = base;
// <<< Vote count <<<

export type VoteRequestArgs = VoteArgs | VoteCountArgs;