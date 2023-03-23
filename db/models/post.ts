import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import winston from "winston";

import ENV from "../../config";

export type GetListReturnType = {
  results: TPost[]
  endCursor: string
};

export interface TPost {
  id: number
  author: string
  createdAt: Date
  freezenAt: Date
  text: string
  repliesTo: number | null
}

export default class PostModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public config: ENV
  ) {}

  public async insertPost(
    author: string,
    text: string,
    repliesTo: number | null
  ): Promise<Pick<TPost, "id"> | undefined | void> {
    this.logger.debug("[PostModel] Trying to insert post");
    const id = await this.db<TPost>("post").insert({ author: author, text: text, repliesTo: repliesTo }, "id");

    return id[0];
  }

  public async getPost(id: number): Promise<TPost | undefined> {
    this.logger.debug(`[PostModel] Trying to get post ${id}`);
    const post = await this.db<TPost>("post")
                           .where({ id })
                           .first();

    return post;
  }

  public async editPost(id: number, newText: string): Promise<void> {
    this.logger.debug(`[PostModel] Trying to edit post ${id}`);
    await this.db<TPost>("post").where({ id: id }).update({ text: newText });
  }

  public async deletePost(id: number): Promise<void> {
    this.logger.debug(`[PostModel] Trying to delete post ${id}`);
    await this.db<TPost>("post").where({ id: id }).del();
  }

  public async freezePost(id: number): Promise<void> {
    this.logger.debug(`[PostModel] Trying to freeze post ${id}`);
    await this.db<TPost>("post").where({ id: id }).update({
      freezenAt: new Date(Date.now())
    });
  }

  public async getList(afterCursor: string, numberRecords: number): Promise<GetListReturnType> {
    this.logger.debug(`[PostModel] Trying to get list: ${afterCursor}, ${numberRecords}`);
    let query = this.db.queryBuilder()
                       .select("post.*")
                       .from("post")
                       .where({ "freezenAt": null })
                       .orderBy("createdAt", "DESC");

    query = knexCursorPagination(query, { after: afterCursor, first: numberRecords });

    const results = await query;
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }

  public async getReplies(repliesTo: number, afterCursor: string, numberRecords: number): Promise<GetListReturnType> {
    this.logger.debug(`[PostModel] Trying to get replies to ${repliesTo}: ${afterCursor}, ${numberRecords}`);
    let query = this.db.queryBuilder()
                       .select("post.*")
                       .from("post")
                       .where({ "freezenAt": null, "repliesTo": repliesTo })
                       .orderBy("createdAt", "DESC");

    query = knexCursorPagination(query, { after: afterCursor, first: numberRecords });

    const results = await query;
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }
}