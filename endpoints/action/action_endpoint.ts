import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { TAction } from "../../db/models/action";
import { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true };

export default class ActionEndpoint extends BaseEndpoint<type.ActionRequestArgs, CallEndpointReturnType> {
  public allowNames: string[] = [
    "simpleSearch"
  ];

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    super(db, redisClient, logger, config, "action");
  }

  public async simpleSearch(args: type.SimpleSearchArgs, _user: TUser): Promise<TAction[]> {
    args = await this.validate(type.SimpleSearchArgsSchema, args);

    const result = this.actionModel.simpleSearch(
      args.key,
      args.operator,
      args.value,
      args.select
    ).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return result;
  }
}