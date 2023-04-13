import { NextFunction, Request, Response } from "express";
import winston from "winston";

import RequestError from "../common/request_error";

export default class ErrorMiddleware {
  constructor(private logger: winston.Logger) {}

  public middleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof RequestError) {
      this.logger.debug({ message: err.message(), path: module.filename });
      res.status(err.status).json(err.object());
      return;
    }

    this.logger.debug({ message: err.stack, path: module.filename });
    res.status(500).send("Sorry, something went wrong");
    return;
  };
}
