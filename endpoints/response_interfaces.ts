export interface BaseResponse {
  success: boolean
}
  
export interface ErrorResponse extends BaseResponse {
  errorType: string
  errorMessage: string
}
  
export interface SuccessDBResponse<Type> extends BaseResponse {
  result: Type
}