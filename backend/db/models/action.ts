import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import ICRUDModel from "../../common/types/crud_model";
import { ChainWhereSearchArgs, Where } from "../../endpoints/action/types";

export interface Action {
  id: number
  userId: number
  actionType: string
  createdAt: Date
  context: string
}

export default class ActionModel implements ICRUDModel<Omit<Action, "id" | "createdAt">, Action> {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async create(args: Omit<Action, "id" | "createdAt">): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create action",
      path: module.filename,
      context: args
    });

    const action = await this.db<Action>("action").insert(args, ["id"]);

    return action[0].id;
  }

  public async read<SelectType extends keyof Action>(
    identifier: number,
    select?: "*" | SelectType[] | undefined
  ): Promise<Action | Pick<Action, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read action",
      path: module.filename,
      context: { identifier, select }
    });

    const action = await this.db<Action>("action")
                           .where({ id: identifier })
                           .select(select||["*"])
                           .first();
    
    return action as Pick<Action, SelectType>;
  }

  public async update(identifier: number, args: Partial<Action>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update action",
      path: module.filename,
      context: { identifier, args }
    });

    await this.db<Action>("action").where({ id: identifier }).update(args);
  }

  public async delete(identifier: number): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete action",
      path: module.filename,
      context: { identifier }
    });

    await this.db<Action>("action").where({ id: identifier }).del();
  }

  // TODO: Change return type with select, as in `this.read`
  public async simpleSearch(
    key: string,
    operator: string,
    value: string,
    select: string[] | string
  ): Promise<Action[]> {
    this.logger.log({
      level: "trying",
      message: "To preform a simple action(s) search",
      path: module.filename,
      context: { key, operator, value, select }
    });

    const where = this.db<Action>("action").where(key, operator, value);
    const result: Action[] =  Array.isArray(select) ? await where.select(...select) : await where.select(select);

    return result;
  }

  public async chainWhereSearch(chain: ChainWhereSearchArgs): Promise<Action[]> {
    this.logger.log({
      level: "trying",
      message: "To preform a chained action(s) search",
      path: module.filename,
      context: chain
    });

    const wheres = chain.chain.map((value) => {
      const type = value.type.toLowerCase();
      const clause = value.clause.charAt(0).toUpperCase() + value.clause.slice(1);

      return { ...value, method: type + clause };
    }) as (Where & { method: "where" | "whereNot" | "andWhere" | "andWhereNot" })[];

    const query = this.db<Action>("action");

    wheres.forEach((value) => {
      query[value.method](value.key, value.operator, value.value);
    });

    const result: Action[] =  Array.isArray(chain.select) ? await query.select(...chain.select)
                                                          : await query.select(chain.select);

    return result;
  }
}