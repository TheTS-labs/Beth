import { NextFunction,Request, Response } from "express";
import winston from "winston";

import RequestError from "./common/RequestError";

export default class ErrorMiddleware {
    constructor (
      private logger: winston.Logger
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public middleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
      if (err instanceof RequestError) { this.logger.error(err.message()); res.status(err.status).json(err.object()); }

      this.logger.error("Unknown error");
      this.logger.error(err.stack);
      res.status(500).send("Sorry, something went wrong");
    };
}