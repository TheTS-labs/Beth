import Joi from "joi";

import { VoteType } from "../../db/models/vote";

// >>> Vote >>>
export type VoteArgs = {
  postId: number
  voteType: VoteType
};

export const VoteArgsSchema = Joi.object().keys({
  postId: Joi.number().positive().required(),
  voteType: Joi.number().min(0).max(1).required()
});
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