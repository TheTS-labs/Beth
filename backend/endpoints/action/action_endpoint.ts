import { Knex } from "knex";
import { IWithPagination } from "knex-paginate";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { Auth } from "../../common/types";
import { Action } from "../../db/models/action";
import * as type from "./types";

type CallEndpointReturnType = IWithPagination<Action, {
  perPage: number
  currentPage: number
  isLengthAware: true
}>;

export default class ActionEndpoint extends BaseEndpoint<type.ActionRequestArgs, CallEndpointReturnType> {
  public allowNames: string[] = [
    "simpleSearch", "chainWhereSearch"
  ];

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    super(db, redisClient, logger, config, "action");
  }

  public async simpleSearch(
    args: type.SimpleSearchArgs,
    _auth: Auth
  ): Promise<IWithPagination<Action, {
    perPage: number
    currentPage: number
    isLengthAware: true
  }>> {
    args = await this.validate(type.SimpleSearchArgsSchema, args);

    const result = this.actionModel.simpleSearch(
      args.key,
      args.operator,
      args.value,
      args.currentPage,
      args.perPage
    ).catch((err: Error) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return result;
  }

  public async chainWhereSearch(args: type.ChainWhereSearchArgs, _auth: Auth): Promise<IWithPagination<Action, {
    perPage: number
    currentPage: number
    isLengthAware: true
  }>> {
    args = await this.validate(type.ChainWhereSearchArgsSchema, args);

    const result = this.actionModel.chainWhereSearch(args.chain, args.currentPage, args.perPage).catch((err: Error) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return result;
  }
}