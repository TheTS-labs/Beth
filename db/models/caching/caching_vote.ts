import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../../app";
import VoteModel, { GetVotesReturnType, TVote } from "../vote";

export default class CachingVoteModel implements VoteModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async vote(userId: number, postId: number, voteType: 0 | 1): Promise<void> {
    await this.db<TVote>("vote").insert({ userId, postId, voteType });
  }

  public async unvote(postId: number, userId: number): Promise<void> {
    const deletedId = await this.db<TVote>("vote").where({ postId, userId }).del(["id"]);
    await this.redisClient.del(`vote_${deletedId}`);
  }

  public async getVotes(
    postId: number,
    afterCursor: string | undefined,
    numberRecords: number
  ): Promise<GetVotesReturnType> {
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

  public async getVoteById(id: number): Promise<TVote | undefined> {
    const cachedVoteString = await this.redisClient.get(`vote_${id}`)||"null";
    const cachedVote: TVote = JSON.parse(cachedVoteString);

    if (cachedVote) {
      return cachedVote;
    }

    const vote = await this.db<TVote>("vote").where({ id }).first();

    await this.redisClient.set(`vote_${id}`, JSON.stringify(vote), {
      EX: this.config.get("VOTE_EX").required().asIntPositive(),
      NX: true
    });

    return vote;
  }

  public async getVoteByPostAndUser(postId: number, userId: number): Promise<TVote | undefined> {
    const vote = await this.db<TVote>("vote").where({ postId, userId }).first();
    return vote;
  }

  public async getVoteCount(postId: number, voteType: 0 | 1): Promise<number> {
    const count = await this.db<TVote>("vote").count("*")
                                              .where({ postId, voteType }) as unknown as [{ "count(*)": number }];

    return count[0]["count(*)"];
  }
}