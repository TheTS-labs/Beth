import Joi from "joi";

import { Vote } from "../../db/models/vote";

// >>> Vote >>>
export interface VoteArgs {
  postId: number
  voteType: Vote
}

export const VoteArgsSchema = Joi.object({
  postId: Joi.number().positive().required(),
  voteType: Joi.number().min(0).max(1).required()
});
// <<< Vote <<<

// >>> Unvote >>>
export interface UnvoteArgs {
  postId: number
}

export const UnvoteArgsSchema = Joi.object({
  postId: Joi.number().positive().required(),
});
// <<< Unvote <<<

// >>> Vote count >>>
export interface VoteCountArgs {
  postId: number
  voteType: Vote
}

export const VoteCountArgsSchema = Joi.object({
  postId: Joi.number().positive().required(),
  voteType: Joi.number().min(0).max(1).required()
});
// <<< Vote count <<<

// >>> Get votes >>>
export interface GetVotesArgs {
  postId: number
  afterCursor: string | undefined
  numberRecords: number
}
  
export const GetVotesArgsSchema = Joi.object({
  postId: Joi.number().positive().required(),
  afterCursor: Joi.string(),
  numberRecords: Joi.number().positive().default(10)
});
// <<< Get votes <<<

export type VoteRequestArgs = VoteArgs | UnvoteArgs | VoteCountArgs | GetVotesArgs;