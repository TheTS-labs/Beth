import { RequestErrorObject } from "./types";

export default class RequestError {
  constructor(public errorType: string, public errorMessage: string, public status: number) {}

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
