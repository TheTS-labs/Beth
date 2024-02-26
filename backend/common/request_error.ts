import { RequestErrorObject } from "./types";

export enum ERequestError {
  PermissionDenied,
  AuthErrorWrongCredentials,
  AuthErrorTokenRevoked,
  AuthErrorUnverifiedToken,
  UserIsFrozen,
  EndpointNotFound,
  ValidationError,
  DatabaseError,
  DatabaseErrorDoesntExist,
  DatabaseErrorAlreadyVoted,
  DatabaseErrorSufficientPosts,
  DatabaseErrorNoPermissionsFound,
  PermissionErrorCantIssueToken,
  PermissionErrorOnlyOwnPosts,
  PermissionErrorFrozeOnlyYourself,
}

export const requestErrorMessages: { [key in ERequestError]: string } = {
  [ERequestError.PermissionDenied]: "You don't have scope: {}",
  [ERequestError.AuthErrorWrongCredentials]: "Wrong email or password",
  [ERequestError.AuthErrorTokenRevoked]: "This token revoked",
  [ERequestError.AuthErrorUnverifiedToken]: "The authenticity of the token cannot be verified",
  [ERequestError.UserIsFrozen]: "User {} is frozen",
  [ERequestError.EndpointNotFound]: "Endpoint {}/{} doesn't exist",
  [ERequestError.ValidationError]: "{}",
  [ERequestError.DatabaseError]: "{}",
  [ERequestError.DatabaseErrorDoesntExist]: "{} doesn't exist",
  [ERequestError.DatabaseErrorAlreadyVoted]: "You already voted",
  [ERequestError.DatabaseErrorSufficientPosts]: "There aren't enough posts to show",
  [ERequestError.DatabaseErrorNoPermissionsFound]: "User permissions with email {} not found",
  [ERequestError.PermissionErrorCantIssueToken]: "You don't have permission {} to issue the token with given scope",
  [ERequestError.PermissionErrorOnlyOwnPosts]: "You can {} only your own posts",
  [ERequestError.PermissionErrorFrozeOnlyYourself]: "You can froze only yourself"
};

export const requestErrorStatusCodes: { [key in ERequestError]: number } = {
  [ERequestError.PermissionDenied]: 403,
  [ERequestError.AuthErrorWrongCredentials]: 400,
  [ERequestError.AuthErrorTokenRevoked]: 403,
  [ERequestError.AuthErrorUnverifiedToken]: 403,
  [ERequestError.UserIsFrozen]: 403,
  [ERequestError.EndpointNotFound]: 404,
  [ERequestError.ValidationError]: 400,
  [ERequestError.DatabaseError]: 500,
  [ERequestError.DatabaseErrorDoesntExist]: 404,
  [ERequestError.DatabaseErrorAlreadyVoted]: 400,
  [ERequestError.DatabaseErrorSufficientPosts]: 500,
  [ERequestError.DatabaseErrorNoPermissionsFound]: 500,
  [ERequestError.PermissionErrorCantIssueToken]: 403,
  [ERequestError.PermissionErrorOnlyOwnPosts]: 403,
  [ERequestError.PermissionErrorFrozeOnlyYourself]: 403
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function format(value: string, ...args: any[]): string {
  let i = 0;
  return value.replace(/{}/g, function () {
    return typeof args[i] != "undefined" ? args[i++] : "";
  });
}

export default class RequestError {
  public errorMessage: string;
  public status: number;

  constructor(
    public errorType: ERequestError,
    public errorArgs: string[] = [""],
  ) {
    this.errorMessage = format(
      requestErrorMessages[this.errorType],
      ...errorArgs
    );
    this.status = requestErrorStatusCodes[this.errorType];
  }

  message(): string {
    return `${this.status}#${this.errorType}, ${this.errorMessage}`;
  }
  object(): RequestErrorObject {
    return {
      errorStatus: this.status,
      errorType: ERequestError[this.errorType],
      errorMessage: this.errorMessage,
    };
  }
}
