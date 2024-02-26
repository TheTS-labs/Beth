import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import { ChainWhereSearchArgs, Where } from "../../endpoints/action/types";

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
    const result: TAction[] =  Array.isArray(select) ? await where.select(...select) : await where.select(select);

    return result;
  }

  public async chainWhereSearch(chain: ChainWhereSearchArgs): Promise<TAction[]> {
    this.logger.debug({
      message: "Trying to chain where search",
      path: module.filename,
      context: { chain }
    });

    const wheres = chain.chain.map((value) => {
      const type = value.type.toLowerCase();
      const clause = value.clause.charAt(0).toUpperCase() + value.clause.slice(1);

      return { ...value, method: type + clause };
    }) as (Where & { method: string })[];

    const query = this.db<TAction>("action");

    wheres.forEach((value) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      query[value.method](value.key, value.operator, value.value);
    });

    const result: TAction[] =  Array.isArray(chain.select) ? await query.select(...chain.select)
                                                           : await query.select(chain.select);

    return result;
  }
}