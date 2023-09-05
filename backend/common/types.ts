import { Request } from "express";

import { Token } from "../db/models/token";
import { User } from "../db/models/user";

export type SafeUserObject = Omit<User, "password">;
export type RequestErrorObject = {
  errorType: string
  errorMessage: string
  errorStatus: number
};

export type EndpointThisType<CType, AType, RType> = CType & {
  [name: string]: (args: AType, auth: JWTRequest["auth"]) => RType
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

export interface Auth {
  tokenId: number
  scope: string[]
  user: User
  token: Token
}

export interface JWTRequest extends Request {
  auth: Auth | undefined
}