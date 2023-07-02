import { Request } from "express";

import { TToken } from "../db/models/token";
import { TUser } from "../db/models/user";

export type SafeUserObject = Pick<TUser, "email" | "id" | "isFrozen">;
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

export const ScopeShorthands = {
  Read: [
    "user:view",
    "permissions:view",
    "post:view",
    "post:viewReplies",
    "post:getList",
    "voting:voteCount",
    "voting:getVotes",
    "recommendation:recommend"
  ],
  Write: [
    "user:editPassword",
    "user:froze",
    "post:create",
    "post:edit",
    "post:delete",
    "post:editTags",
    "voting:vote",
    "voting:unvote",
  ],
  Admin: [
    "UserSuperFroze",
    "UserEditTags",
    "UserVerify",
    "PermissionsGrand",
    "PermissionsRescind",
    "PostSuperEdit",
    "PostSuperDelete",
    "PostForceDelete",
    "PostSuperTagsEdit",
    "ActionSimpleSearch",
    "ActionChainWhereSearch",
  ]
};

export interface Auth {
  tokenId: number
  scope: string[]
  user: TUser
  token: TToken
}

export type JWTRequest = Request & { auth?: Auth };