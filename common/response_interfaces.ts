export interface BaseResponse {
  success: boolean
}
  
export interface ErrorResponse extends BaseResponse {
  errorType: string
  errorMessage: string
  errorStatus: number
}
  
export interface SuccessResponse<Type> extends BaseResponse {
  result: Type
}