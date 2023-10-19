import { Knex } from "knex";
import { IWithPagination } from "knex-paginate";
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

  public async simpleSearch(
    key: string,
    operator: string,
    value: string,
    currentPage: number,
    perPage: number
  ): Promise<
    IWithPagination<
      Action,
      {
        perPage: number
        currentPage: number
        isLengthAware: true
      }
    >
  > {
    this.logger.log({
      level: "trying",
      message: "To preform a simple action(s) search",
      path: module.filename,
      context: { key, operator, value, currentPage, perPage }
    });

    const results = await this.db<Action>("action").select("*").where(key, operator, value).paginate({
      perPage,
      currentPage,
      isLengthAware: true
    });
    

    return results;
  }

  public async chainWhereSearch(chain: ChainWhereSearchArgs["chain"], currentPage: number, perPage: number): Promise<
    IWithPagination<
      Action,
      {
        perPage: number
        currentPage: number
        isLengthAware: true
      }
    >
  > {
    this.logger.log({
      level: "trying",
      message: "To preform a chained action(s) search",
      path: module.filename,
      context: { chain, currentPage, perPage }
    });

    const wheres = chain.map((value) => {
      const type = value.type.toLowerCase();
      const clause = value.clause.charAt(0).toUpperCase() + value.clause.slice(1);

      return { ...value, method: type + clause };
    }) as (Where & { method: "where" | "whereNot" | "andWhere" | "andWhereNot" })[];

    const query = this.db<Action>("action");

    wheres.forEach((value) => {
      query[value.method](value.key, value.operator, value.value);
    });

    const result = await query.paginate({
      perPage,
      currentPage,
      isLengthAware: true
    });

    return result;
  }
}