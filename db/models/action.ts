import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";

export interface TAction {
  id: number
  userId: number
  actionType: string
  createdAt: Date
  context: string
}

export default class ActionModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async insertAction(userId: number, actionType: string, context: object): Promise<void> {
    this.logger.debug({
      message: "Trying to insert action",
      path: module.filename,
      context: { userId, actionType, context }
    });

    await this.db<TAction>("action").insert({
      userId,
      actionType,
      context: JSON.stringify(context),
    });
  }

  public async simpleSearch(
    key: string,
    operator: string,
    value: string,
    select: string[] | string
  ): Promise<TAction[]> {
    this.logger.debug({
      message: "Trying to simple search",
      path: module.filename,
      context: { key, operator, value }
    });

    const where = this.db<TAction>("action").where(key, operator, value);
    console.log(typeof select);
    const result: TAction[] =  Array.isArray(select) ? await where.select(...select) : await where.select(select);

    return result;
  }
}