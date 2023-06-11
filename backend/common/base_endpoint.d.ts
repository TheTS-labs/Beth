/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import { EndpointThisType, JWTRequest } from "./types";

declare class IBaseEndpoint {
  public allowNames: Array<string>;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  );

  async callEndpoint(
    this: EndpointThisType<any, object, Promise<object>>,
    name: string, args: object, auth: JWTRequest["auth"]
  ): Promise<object>;
  async validate<EType>(schema: unknown, args: EType): Promise<EType>;
}
