import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import { TUser } from "../db/models/user";
import RequestError from "./request_error";
import { EndpointThisType } from "./types";

export default class BaseEndpoint<RequestArgsType, CallEndpointReturnType> {
  public allowNames!: Array<string>;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV,
    public endpointName: string
  ) { }

  async callEndpoint(
    this: EndpointThisType<this, RequestArgsType, Promise<CallEndpointReturnType>>,
    name: string, args: RequestArgsType, user: TUser | undefined
  ): Promise<CallEndpointReturnType> {
    const userIncludes = this.allowNames.includes(name);
    if (!userIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint ${this.endpointName}/${name} does not exist`, 404);
    }

    const result: CallEndpointReturnType = await this[name](args, user);

    return result;
  }

  async validate<EType>(schema: Joi.ObjectSchema, args: EType): Promise<EType> {
    const { error, value } = schema.validate(args);
    if (error) {
      throw new RequestError("ValidationError", error.message, 400);
    }

    return value as EType;
  }
}