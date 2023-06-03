import { Request } from "express";

import { TUser } from "../db/models/user";

export type SafeUserObject = Pick<TUser, "email" | "id" | "isFreezen">;
export type RequestErrorObject = {
  errorType: string
  errorMessage: string
  errorStatus: number
};
export type RequestWithUser = Request & {
  user?: undefined | TUser
};
export type EndpointThisType<CType, AType, RType> = CType & {
  [name: string]: (args: AType, user: TUser | undefined) => RType
};

export enum DBBool {
  No,
  Yes
}

export enum UserScore {
  Liked = 1,
  Nothing = 0,
  Disliked = -1
}