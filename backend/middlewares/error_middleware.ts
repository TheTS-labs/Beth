import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "express-jwt";
import winston from "winston";

import RequestError from "../common/request_error";

export default class ErrorMiddleware {
  constructor(private logger: winston.Logger) {}

  public middleware = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof RequestError) {
      this.logger.error({ message: err.message(), path: module.filename });
      res.status(err.status).json(err.object());
      return;
    }

    if (err instanceof UnauthorizedError) {
      this.logger.error({ message: err.code, path: module.filename });
      res.status(err.status).json({
        errorStatus: err.status,
        errorType: "UnauthorizedError",
        errorMessage: err.code
      });
      return;
    }

    this.logger.error({ message: err.stack, path: module.filename });
    res.status(500).json({
      errorStatus: 500,
      errorType: "UnknownError",
      // TODO: Reveal error if DEBUG=true
      errorMessage: "Sorry, something went wrong"
    });
    return;
  };
}
