import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import ICRUDModel from "../../common/types/crud_model";

export interface Vote {
  id: number
  userEmail: string
  postId: number
  createdAt: Date
  voteType: VoteType
}

export enum VoteType {
  Up = 1,
  Down = 0
}

export default class VoteModel implements ICRUDModel<Omit<Vote, "id" | "createdAt">, Vote> {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async create(args: Omit<Vote, "id" | "createdAt">): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create vote",
      path: module.filename,
      context: args
    });

    const vote = await this.db<Vote>("vote").insert(args, ["id"]);

    return vote[0].id;
  }

  public async read<SelectType extends keyof Vote>(
    identifier: number,
    select?: "*" | SelectType[] | undefined
  ): Promise<Vote | Pick<Vote, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read vote",
      path: module.filename,
      context: { identifier, select }
    });

    const vote = await this.db<Vote>("vote")
                           .where({ id: identifier })
                           .select(select||["*"])
                           .first();
    
    return vote as Pick<Vote, SelectType>;
  }

  public async update(identifier: number, args: Partial<Vote>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update vote",
      path: module.filename,
      context: { identifier, args }
    });

    await this.db<Vote>("vote").where({ id: identifier }).update(args);
  }
  
  public async delete(identifier: number): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete vote",
      path: module.filename,
      context: { identifier }
    });

    await this.db<Vote>("vote").where({ id: identifier }).del();
  }

  public async readByIds<SelectType extends keyof Vote>(
    postId: number,
    userEmail: string,
    select?: "*" | SelectType[] | undefined
  ): Promise<Vote | Pick<Vote, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read vote by postId and userEmail",
      path: module.filename,
      context: { postId, userEmail, select }
    });

    const vote = await this.db<Vote>("vote")
                           .where({ postId, userEmail })
                           .select(select||["*"])
                           .first();
    
    return vote as Pick<Vote, SelectType>;
  }

  public async readVoteCount(postId: number, voteType: VoteType): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To read vote count of the post",
      path: module.filename,
      context: { postId, voteType }
    });
  
    const count = await this.db<Vote>("vote").count("*")
                                             .where({ postId, voteType }) as unknown as [{ "count": number }];

    return Number(count[0]["count"]);
  }

  public async readVotesOfUser(userEmail: string): Promise<Vote[]> {
    this.logger.log({
      level: "trying",
      message: "To read all the votes of the user",
      path: module.filename,
      context: { userEmail }
    });

    const votes = await this.db<Vote>("vote").where({ userEmail });
    return votes;
  }
}