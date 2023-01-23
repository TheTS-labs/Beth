import { ErrorResponse } from "./response_interfaces";

export default class RequestError {
  constructor(
    private errorType: string,
    private errorMessage: string,
    private status: number
  ) {}

  message(): string { return `${this.status}#${this.errorType}, ${this.errorMessage}`; }
  object(): ErrorResponse {
    return {
      success: false,
      errorStatus: this.status,
      errorType: this.errorType,
      errorMessage: this.errorMessage
    };
  }
}