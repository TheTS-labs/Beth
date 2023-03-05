import { Knex } from "knex";
import winston from "winston";

import ENV from "../../config";

export interface TPost {
  id: number
  author: string
  created_at: Date
  text: string
}

export default class PostModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public config: ENV
  ) {}

  public async insertPost(author: string, text: string): Promise<Pick<TPost, "id"> | undefined | void> {
    this.logger.debug("[PostModel] Trying to insert post");
    const id = await this.db<TPost>("post").insert({ author: author, text: text }, "id");

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
    this.logger.debug(`[PostModel] Trying to edit post ${id}`);
    await this.db<TPost>("post").where({ id: id }).del();
  }
}