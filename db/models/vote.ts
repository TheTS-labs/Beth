import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";

export type GetVotesReturnType = {
  results: TVote[]
  endCursor: string
};

export interface TVote {
  id: number
  userId: number
  postId: number
  createdAt: Date
  voteType: 0 | 1
}

export default class VoteModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async vote(userId: number, postId: number, voteType: 0 | 1): Promise<void> {
    this.logger.debug(`[VoteModel] ${userId} voted ${postId}: ${voteType}`);
    await this.db<TVote>("vote").insert({ userId, postId, voteType });
  }

  public async unvote(postId: number, userId: number): Promise<void> {
    this.logger.debug(`[VoteModel] ${userId} unvoted ${postId}`);
    await this.db<TVote>("vote").where({ postId, userId }).del();
  }

  public async getVotes(
    postId: number,
    afterCursor: string | undefined,
    numberRecords: number
  ): Promise<GetVotesReturnType> {
    this.logger.debug(`[VoteModel] Trying to get list: ${afterCursor}, ${numberRecords}`);
    let query = this.db.queryBuilder()
                       .select("vote.*")
                       .from("vote")
                       .where({ postId })
                       .orderBy("createdAt", "DESC");

    query = knexCursorPagination(query, { after: afterCursor, first: numberRecords });

    const results = await query;
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }

  public async getVoteByPostAndUser(postId: number, userId: number): Promise<TVote | undefined> {
    this.logger.debug(`[VoteModel] Getting a vote: userId ${userId}, postId ${postId}`);
    const vote = await this.db<TVote>("vote").where({ postId, userId }).first();
    return vote;
  }

  public async getVoteCount(postId: number, voteType: 0 | 1): Promise<number> {
    this.logger.debug(`[VoteModel] Getting a vote count: voteType ${voteType}, postId ${postId}`);
    const count = await this.db<TVote>("vote").count("*")
                                              .where({ postId, voteType }) as unknown as [{ "count(*)": number }];

    return count[0]["count(*)"];
  }
}