import Joi from "joi";

export interface BaseResponse {
  success: boolean
}
  
export interface ErrorResponse extends BaseResponse {
  errorType: string
  errorMessage: string
}

export interface JoiErrorResponse extends BaseResponse {
  errorType: string
  errorMessage: Joi.ValidationError
}
  
export interface SuccessDBResponse<Type> extends BaseResponse {
  result: Type
}