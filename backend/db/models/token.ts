import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import { DBBool } from "../../common/types";
import ICRUDModel from "../../common/types/crud_model";

export interface Token {
  id: number
  owner: string
  revoked: DBBool
  iat: Date
  scope: string
}

export default class TokenModel implements ICRUDModel<Omit<Token, "id" | "iat" | "revoked">, Token> {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async create(args: Omit<Token, "id" | "iat" | "revoked">): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create token",
      path: module.filename,
      context: args
    });

    const token = await this.db<Token>("token").insert(args, ["id"]);

    return token[0].id;
  }

  public async read<SelectType extends keyof Token>(
    identifier: number,
    select?: "*" | SelectType[] | undefined
  ): Promise<Token | Pick<Token, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read token",
      path: module.filename,
      context: { identifier, select }
    });

    const token = await this.db<Token>("token")
                           .where({ id: identifier })
                           .select(select||["*"])
                           .first();
    
    return token as Pick<Token, SelectType>;
  }

  public async update(identifier: number, args: Partial<Token>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update token",
      path: module.filename,
      context: { identifier, args }
    });

    await this.db<Token>("token").where({ id: identifier }).update(args);
  }

  public async delete(identifier: number): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete token",
      path: module.filename,
      context: { identifier }
    });

    await this.db<Token>("token").where({ id: identifier }).del();
  }
}