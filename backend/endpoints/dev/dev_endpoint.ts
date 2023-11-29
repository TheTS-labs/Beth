import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import { Auth } from "../../common/types";
import * as type from "./types";

type CallEndpointReturnType = { success: true };

export default class DevEndpoint extends BaseEndpoint<type.VoteRequestArgs, CallEndpointReturnType> {
  public allowNames: string[] = [ "seed" ];

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    super(db, redisClient, logger, config, "dev");
  }
  
  async seed(_args: type.SeedArgs, _auth: Auth): Promise<CallEndpointReturnType>{
    await this.db.seed.run();

    return { success: true };
  }
}