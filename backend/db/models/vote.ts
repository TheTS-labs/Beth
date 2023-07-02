import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";

export interface TVote {
  id: number
  userEmail: string
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

  public async vote(postId: number, userEmail: string, unvote=false, voteType=Vote.Up): Promise<void> {
    if (unvote) {
      this.logger.debug({ message: "Unvoted", path: module.filename, context: { userEmail, postId } });
      await this.db<TVote>("vote").where({ postId, userEmail }).del();

      return;
    }

    this.logger.debug({ message: "Voted", path: module.filename, context: { userEmail, postId } });
    await this.db<TVote>("vote").insert({ userEmail, postId, voteType });
  }

  public async getVote(postId: number, userEmail: string): Promise<TVote | undefined> {
    this.logger.debug({ message: "Getting a vote", path: module.filename, context: { userEmail, postId } });
    const vote = await this.db<TVote>("vote").where({ postId, userEmail }).first();
    return vote;
  }

  public async getVoteCount(postId: number, voteType: Vote): Promise<number> {
    this.logger.debug({ message: "Getting a vote count", path: module.filename, context: { voteType, postId } });
    const count = await this.db<TVote>("vote").count("*")
                                              .where({ postId, voteType }) as unknown as [{ "count": number }];

    return Number(count[0]["count"]);
  }

  public async getVotes(userEmail: string): Promise<TVote[]> {
    this.logger.debug({ message: "Getting all votes", path: module.filename, context: { userEmail } });
    const votes = await this.db<TVote>("vote").where({ userEmail });
    return votes;
  }
}