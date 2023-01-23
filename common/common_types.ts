import { TUser } from "../db/models/user";
import RequestError from "./RequestError";
import { ErrorResponse, SuccessResponse } from "./response_interfaces";

export type SafeUserObject = Pick<TUser, "email" | "id" | "is_banned">;
export type EndpointResponse = ErrorResponse|SuccessResponse<unknown>;
export type FunctionResponse<Type> = {
  success: true
  result: Type
} | {
  success: false
  result: RequestError
};