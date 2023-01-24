import { TUser } from "../db/models/user";
import RequestError from "./RequestError";

export type SafeUserObject = Pick<TUser, "email" | "id" | "is_banned">;
export type FunctionResponse<SuccessType> = {
  success: true
  result: SuccessType
} | {
  success: false
  result: RequestError
};
export type EndpointResponse<SuccessType> = {
  success: true
  result: SuccessType
} | {
  success: false
  errorType: string
  errorMessage: string
  errorStatus: number
};