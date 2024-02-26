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

// >>> Global Recommend >>>
export interface GlobalRecommendArgs {
  afterCursor: string
  numberRecords: number
}

export const GlobalRecommendArgsSchema = Joi.object({
  afterCursor: Joi.string().default(""),
  numberRecords: Joi.number().positive().default(10),
});
// <<< Global Recommend <<<

export type RecommendationRequestArgs = RecommendArgs | GlobalRecommendArgs;