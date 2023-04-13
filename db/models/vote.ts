import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";

export interface TVote {
  id: number
  userId: number
  postId: number
  createdAt: Date
  voteType: Vote
}

export enum Vote {
  Up = 1,
  Down = 0
}

export default class VoteModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async vote(postId: number, userId: number, unvote=false, voteType=Vote.Up): Promise<void> {
    if (unvote) {
      this.logger.debug({ message: "Unvoted", path: module.filename, context: { userId, postId } });
      await this.db<TVote>("vote").where({ postId, userId }).del();

      return;
    }

    this.logger.debug({ message: "Voted", path: module.filename, context: { userId, postId } });
    await this.db<TVote>("vote").insert({ userId, postId, voteType });
  }

  public async getVote(postId: number, userId: number): Promise<TVote | undefined> {
    this.logger.debug({ message: "Getting a vote", path: module.filename, context: { userId, postId } });
    const vote = await this.db<TVote>("vote").where({ postId, userId }).first();
    return vote;
  }

  public async getVoteCount(postId: number, voteType: Vote): Promise<number> {
    this.logger.debug({ message: "Getting a vote count", path: module.filename, context: { voteType, postId } });
    const count = await this.db<TVote>("vote").count("*")
                                              .where({ postId, voteType }) as unknown as [{ "count(*)": number }];

    return count[0]["count(*)"];
  }
}