import { expressjwt } from "express-jwt";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";

export default class JWTMiddleware {
  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) { }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public middleware(disableAuthFor: string[]): any {
    return expressjwt({
      secret: this.config.get("JWT_TOKEN_SECRET").required().asString(),
      algorithms: ["HS256"],
      getToken: (req) => {
        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
          return req.headers.authorization.split(" ")[1];
        }

        return undefined;
      },
    }).unless({ path: disableAuthFor });
  }
}