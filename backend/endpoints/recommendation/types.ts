import Joi from "joi";

// >>> Recommend >>>
export interface RecommendArgs {
  afterCursor: string
  numberRecords: number
}

export const RecommendArgsSchema = Joi.object({
  afterCursor: Joi.string().default(""),
  numberRecords: Joi.number().positive().default(10),
});
// <<< Recommend <<<

// >>> Get Hot Tags >>>
export type GetHotTagsArgs = {};

export const GetHotTagsArgsSchema = Joi.object({});
// <<< Get Hot Tags <<<

// >>> Get Posts >>>
export interface GetPostsArgs {
  afterCursor: string
  numberRecords: number
}

export const GetPostsArgsSchema = Joi.object({
  afterCursor: Joi.string().default(""),
  numberRecords: Joi.number().positive().default(10),
});
// <<< Get Posts <<<

export type RecommendationRequestArgs = RecommendArgs | GetHotTagsArgs;