import { Request } from "express";

import { TUser } from "../db/models/user";

export type SafeUserObject = Pick<TUser, "email" | "id" | "isFreezen">;
export type RequestErrorObject = {
  errorType: string
  errorMessage: string
  errorStatus: number
};
export type RequestWithUser = Request & {
  user?: undefined|TUser
};