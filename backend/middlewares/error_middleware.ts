import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "express-jwt";
import winston from "winston";

import { ENV } from "../app";
import RequestError from "../common/request_error";

export default class ErrorMiddleware {
  constructor(
    private logger: winston.Logger,
    private config: ENV
  ) {}

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

    const debug = this.config.get("DEBUG").required().asBool();

    this.logger.error({ message: err.stack, path: module.filename, context: { debug } });
    res.status(500).json({
      errorStatus: 500,
      errorType: "UnknownError",
      errorMessage: debug ? err.stack : "Sorry, something went wrong"
    });
    return;
  };
}
