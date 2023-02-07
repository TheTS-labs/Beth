import { TUser } from "../db/models/user";

export type SafeUserObject = Pick<TUser, "email" | "id" | "isBanned">;
export type RequestErrorObject = {
  errorType: string
  errorMessage: string
  errorStatus: number
};