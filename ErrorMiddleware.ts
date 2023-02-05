import { NextFunction,Request, Response } from "express";
import winston from "winston";

import RequestError from "./common/RequestError";

export default class ErrorMiddleware {
    constructor (
      private logger: winston.Logger
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    middleware(err: Error, req: Request, res: Response, next: NextFunction): void {
        if (!(err instanceof RequestError)) {
            this.logger.error("Unknown error");
            this.logger.error(err.stack);
            res.status(500).send("Sorry, something went wrong");
        }
        const e = err as unknown as RequestError;

        this.logger.error(e.message());
        res.status(e.status).json({ error: e.object() });
  }
}