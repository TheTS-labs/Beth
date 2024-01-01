import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import { DBBool } from "../../common/types";
import ICRUDModel from "../../common/types/crud_model";

export interface User {
  id: number
  username: string
  displayName: string
  email: string
  password: string
  isFrozen: DBBool
  tags: string
  verified: DBBool
}

export default class UserModel implements ICRUDModel<Omit<User, "id" | "isFrozen" | "tags" | "verified">, User> {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType,
    public config: ENV
  ) {}

  public async create(args: Omit<User, "id" | "isFrozen" | "tags" | "verified">): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create user",
      path: module.filename,
      context: args
    });

    const user = await this.db<User>("user").insert(args, ["id"]);

    return user[0].id;
  }

  public async read<SelectType extends keyof User>(
    identifier: string,
    select?: SelectType[] | "*"
  ): Promise<User | Pick<User, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read user",
      path: module.filename,
      context: { identifier, select }
    });

    const user = await this.db<User>("user")
                           .where({ email: identifier })
                           .select(select||["id", "email", "isFrozen", "username", "displayName"])
                           .first();
    
    return user;
  }

  public async update(identifier: string, args: Partial<User>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update user",
      path: module.filename,
      context: { identifier, args }
    });

    await this.db<User>("user").where({ email: identifier }).update(args);
  }

  public async delete(identifier: string): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete user",
      path: module.filename,
      context: { identifier }
    });

    await this.db<User>("user").where({ email: identifier }).del();
  } 
}