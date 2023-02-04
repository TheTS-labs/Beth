import { TUser } from "../db/models/user";

export type SafeUserObject = Pick<TUser, "email" | "id" | "is_banned">;
export type RequestErrorObject = {
  errorType: string
  errorMessage: string
  errorStatus: number
};