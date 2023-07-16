import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";

export type NestedTPost = (TPost & { comments: NestedTPost[] });
export type HotTags = { tag: string, post_count: string }[];

export interface GetListReturnType {
  results: TPost[]
  endCursor: string
}

export interface GetPostsReturnType {
  results: {
      text: string
      displayName: string
      username: string
      score: string
      verified: boolean
      _cursor_0: number
  }[]
  endCursor: string
}

export interface TPost {
  id: number
  author: string
  createdAt: Date
  frozenAt: Date
  text: string
  repliesTo: number | null
  parent: number | null
  tags: string
}

export default class PostModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async insertPost(
    author: string,
    text: string,
    repliesTo: number | undefined=undefined,
    parent: number | undefined=undefined
  ): Promise<Pick<TPost, "id"> | undefined | void> {
    this.logger.debug({ message: "Trying to insert post", path: module.filename });
    const id = await this.db<TPost>("post").insert({
      author: author,
      text: text,
      repliesTo: repliesTo,
      parent: parent
    }, "id");

    return id[0];
  }

  public async getPost(id: number): Promise<TPost | undefined> {
    this.logger.debug({ message: "Trying to get post", path: module.filename, context: { id } });
    const post = await this.db<TPost>("post")
                           .where({ id })
                           .first();

    return post;
  }

  public async editPost(id: number, newText: string): Promise<void> {
    this.logger.debug({ message: "Trying to edit post", path: module.filename, context: { id } });
    await this.db<TPost>("post").where({ id: id }).update({ text: newText });
  }

  public async deletePost(id: number): Promise<void> {
    this.logger.debug({ message: "Trying to delete post", path: module.filename, context: { id } });
    await this.db<TPost>("post").where({ id: id }).del();
  }

  public async frozePost(id: number): Promise<void> {
    this.logger.debug({ message: "Trying to froze post", path: module.filename, context: { id } });
    await this.db<TPost>("post").where({ id: id }).update({
      frozenAt: new Date(Date.now())
    });
  }

  public async getList(afterCursor: string | null, numberRecords: number): Promise<GetListReturnType> {
    this.logger.debug({
      message: "Trying to get list",
      path: module.filename,
      context: { afterCursor, numberRecords }
    });
    let query = this.db.queryBuilder()
                        .select("p.text", "u.displayName", "u.username", "p.score", "u.verified")
                        .fromRaw(`(
                          SELECT post.id, post.author, post.text, post."repliesTo", post."frozenAt", 
                                SUM(CASE WHEN "vote"."voteType" = true THEN 1 ELSE -1 END) AS score
                          FROM "post"
                          JOIN "vote" ON post.id = "vote"."postId"
                          GROUP BY post.id 
                        ) AS p`)
                        .join("user as u", "p.author", "=", "u.email")
                        .whereNull("p.repliesTo")
                        .whereNull("p.frozenAt")
                        .where("u.isFrozen", false)
                        .orderBy("p.id", "desc");

    query = knexCursorPagination(query, { after: afterCursor, first: numberRecords });

    const results = await query;
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }

  public async getReplies(parent: number): Promise<TPost[]> {
    this.logger.debug({ message: "Trying to get replies", path: module.filename, context: { parent } });

    const result = await this.db<TPost>("post").where("frozenAt", null)
                                               .andWhere("parent", parent)
                                               .select()
                                               .orderBy("createdAt", "DESC");

    return result;
  }

  public async findParent(id: number): Promise<number | undefined> {
    this.logger.debug({ message: "Finding parent", path: module.filename, context: { id } });
  
    const comment = await this.getPost(id);
    if (!comment) {
      this.logger.debug({ message: `${id} is the parent`, path: module.filename });
      return;
    }

    let parent: number = comment.repliesTo || comment.id;
    let commentOfParent = await this.getPost(parent) as TPost;

    while (commentOfParent) {
      this.logger.debug({ message: `Probably ${parent}, checking`, path: module.filename });
      commentOfParent = await this.getPost(parent) as TPost;

      if (commentOfParent.repliesTo === null) {
        this.logger.debug({ message: `Yeah, ${commentOfParent.id} is the parent`, path: module.filename });
        return commentOfParent.id;
      }
  
      this.logger.debug({ message: `Nah, ${commentOfParent.id} is not a parent`, path: module.filename });
      parent = commentOfParent.repliesTo;
    }

    this.logger.debug({ message: `Done, ${parent} is the parent`, path: module.filename });
    return parent;
  }

  public async editTags(id: number, newTags: string): Promise<void> {
    this.logger.debug({ message: "Editing tags", path: module.filename, context: { id, newTags } });
    await this.db<TPost>("post").where({ id }).update({ tags: newTags });
  }

  public async getHotTags(): Promise<HotTags> {
    const hotTags = await this.db.raw(`
      SELECT tag, COUNT(*) as post_count
      FROM (
        SELECT unnest(string_to_array(tags, ',')) AS tag
        FROM post
      ) AS subquery
      GROUP BY tag
      ORDER BY post_count DESC
      LIMIT 8
    `);
    
    return hotTags.rows;
  }

  public async getPosts(afterCursor: string, numberRecords: number): Promise<GetPostsReturnType> {
    let query = this.db.queryBuilder()
      .select("p.text", "u.displayName", "u.username", "p.score", "u.verified")
      .fromRaw(`(
        SELECT post.id, post.author, post.text, post."repliesTo", post."frozenAt", 
               SUM(CASE WHEN "vote"."voteType" = true THEN 1 ELSE -1 END) AS score
        FROM "post"
        JOIN "vote" ON post.id = "vote"."postId"
        GROUP BY post.id 
      ) AS p`)
      .join("user as u", "p.author", "=", "u.email")
      .whereNull("p.repliesTo")
      .whereNull("p.frozenAt")
      .where("u.isFrozen", false)
      .orderBy("p.id", "desc");

    query = knexCursorPagination(query, { after: afterCursor, first: numberRecords });

    const results = await query;
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }
}