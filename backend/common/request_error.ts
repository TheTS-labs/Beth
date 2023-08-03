import { RequestErrorObject } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function format(value: string, ...args: any[]): string {
  let i = 0;
  return value.replace(/{}/g, function () {
    return typeof args[i] != "undefined" ? args[i++] : "";
  });
}

export const requestErrors = {
  PermissionDenied: {
    templates: ["You don't have scope: {}"],
    statusCodes: [403],
  },
  AuthError: {
    templates: [
      "Wrong email or password",
      "This token revoked",
      "The authenticity of the token cannot be verified"
    ],
    statusCodes: [403, 403, 403],
  },
  UserIsFrozen: {
    templates: ["User {} is frozen"],
    statusCodes: [403],
  },
  EndpointNotFound: {
    templates: ["Endpoint {}/{} doesn't exist"],
    statusCodes: [404],
  },
  ValidationError: {
    templates: ["{}"],
    statusCodes: [400],
  },
  DatabaseError: {
    templates: [
      "{}",
      "User permissions with email {} not found",
      "Post doesn't exist",
      "User doesn't exist",
      "You already voted",
      "There aren't enough posts to show"
    ],
    statusCodes: [500, 500, 404, 404, 403, 500],
  },
  PermissionError: {
    templates: [
      "You can only edit your own posts",
      "You can only delete your own posts",
      "You can only edit tags of your own posts",
      "You can froze only yourself",
      "You don't have permission {} to issue the token with given scope"
    ],
    statusCodes: [403, 403, 403, 403, 403],
  }
};

export default class RequestError {
  public errorMessage: string;
  public status: number;

  constructor(
    public errorType: keyof typeof requestErrors,
    public errorArgs=[""],
    public template=0,
    status?: number | undefined
  ) {
    this.errorMessage = format(
      requestErrors[errorType].templates[template],
      ...errorArgs
    );
    this.status = status || requestErrors[errorType].statusCodes[template];
  }

  message(): string {
    return `${this.status}#${this.errorType}, ${this.errorMessage}`;
  }
  object(): RequestErrorObject {
    return {
      errorStatus: this.status,
      errorType: this.errorType,
      errorMessage: this.errorMessage,
    };
  }
}
