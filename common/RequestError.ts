import { EndpointResponse } from "./types";

export default class RequestError {
  constructor(
    private errorType: string,
    private errorMessage: string,
    private status: number
  ) {}

  message(): string { return `${this.status}#${this.errorType}, ${this.errorMessage}`; }
  object(): EndpointResponse<unknown> & { success: false } {
    return {
      success: false,
      errorStatus: this.status,
      errorType: this.errorType,
      errorMessage: this.errorMessage
    };
  }
}