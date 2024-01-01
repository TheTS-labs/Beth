import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import ActionModel from "../db/models/action";
import RequestError, { ERequestError } from "./request_error";
import { EndpointThisType, JWTRequest } from "./types";
import IBaseEndpoint from "./types/base_endpoint";

export default class BaseEndpoint<RequestArgsType extends object,
                                  CallEndpointReturnType extends object> implements IBaseEndpoint {
  public allowNames!: Array<string>;
  public actionModel: ActionModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV,
    public endpointName: string
  ) {
    this.actionModel = new ActionModel(this.db, this.logger, this.redisClient, this.config);
  }

  async callEndpoint(
    this: EndpointThisType<this, RequestArgsType, Promise<CallEndpointReturnType>>,
    name: string, args: RequestArgsType, auth: JWTRequest["auth"]
  ): Promise<CallEndpointReturnType> {
    const endpointIncludes = this.allowNames.includes(name);
    if (!endpointIncludes) {
      throw new RequestError(ERequestError.EndpointNotFound, [this.endpointName, name]);
    }

    const result: CallEndpointReturnType = await this[name](args, auth);

    const domain = this.endpointName.charAt(0).toUpperCase() + this.endpointName.slice(1);
    const endpoint = name.charAt(0).toUpperCase() + name.slice(1);
    const actionName = domain + endpoint;

    this.actionModel.create({ userId: auth?.user?.id||-1, actionType: actionName, context: JSON.stringify(args) });

    return result;
  }

  async validate<EType>(schema: Joi.ObjectSchema, args: EType): Promise<EType> {
    const { error, value } = schema.validate(args);
    if (error) {
      throw new RequestError(ERequestError.ValidationError, [error.message]);
    }

    return value as EType;
  }
}