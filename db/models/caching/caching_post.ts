import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../../app";
import RequestError from "../../../common/request_error";
import PostModel, { GetListReturnType, TPost } from "../post";

export default class CachingPostModel implements PostModel {
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
    this.logger.debug("[PostModel] Trying to insert post");
    const id = await this.db<TPost>("post").insert({
      author: author,
      text: text,
      repliesTo: repliesTo,
      parent: parent
    }, "id");

    return id[0];
  }

  public async getPost(id: number): Promise<TPost | undefined> {
    this.logger.debug(`[PostModel] Trying to get post ${id}`);

    const cachedPostString = await this.redisClient.get(`post_${id}`);
    const cachedPost: TPost = JSON.parse(cachedPostString||"null");

    if (cachedPost) {
      return cachedPost;
    }

    const post = await this.db<TPost>("post")
                           .where({ id })
                           .first();

    await this.redisClient.set(`post_${id}`, JSON.stringify(post), {
      EX: this.config.get("POST_EX").required().asIntPositive(),
      NX: true
    });

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

  public async getReplies(parent: number): Promise<TPost[]> { // <--- Probably Cache
    this.logger.debug(`[PostModel] Trying to get replies to ${parent}`);

    const result = await this.db<TPost>("post").where("freezenAt", null)
                                               .andWhere("parent", parent)
                                               .select()
                                               .orderBy("createdAt", "DESC");

    return result;
  }

  public async findParent(id: number): Promise<number | undefined> {
    const comment = await this.getPost(id);
    if (!comment) {
      return;
    }

    let parent: number = comment.repliesTo || comment.id;
    let commentOfParent = await this.getPost(parent) as TPost;

    while (commentOfParent) {
      commentOfParent = await this.getPost(parent) as TPost;

      if (commentOfParent.repliesTo === null) {
        return commentOfParent.id;
      }
  
      parent = commentOfParent.repliesTo;
    }

    return parent;
  }

  public async upvote(id: number): Promise<void> {
    const post = await this.db<TPost>("post").where({ id }).first();
    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    await this.db<TPost>("post").where({ id }).update({ upvotes: post.upvotes+1 });
  }

  public async downvote(id: number): Promise<void> {
    const post = await this.db<TPost>("post").where({ id }).first();
    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    await this.db<TPost>("post").where({ id }).update({ downvotes: post.downvotes+1 });
  }

  public async editTags(id: number, newTags: string): Promise<void> {
    await this.db<TPost>("post").where({ id }).update({ tags: newTags });
    await this.redisClient.del(`post_${id}`);
  }
}