import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../../app";
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
    this.logger.debug("[CachingPostModel] Trying to insert post");
    const id = await this.db<TPost>("post").insert({
      author: author,
      text: text,
      repliesTo: repliesTo,
      parent: parent
    }, "id");

    return id[0];
  }

  public async getPost(id: number): Promise<TPost | undefined> {
    this.logger.debug(`[CachingPostModel] Trying to get post ${id}`);

    const cachedPostString = await this.redisClient.get(`post_${id}`);
    const cachedPost: TPost = JSON.parse(cachedPostString||"null");

    if (cachedPost) {
      return cachedPost;
    }

    const post = await this.db<TPost>("post")
                           .where({ id })
                           .first();

    if (post) {
      await this.redisClient.set(`post_${id}`, JSON.stringify(post), {
        EX: this.config.get("POST_EX").required().asIntPositive(),
        NX: true
      });
    }

    return post;
  }

  public async editPost(id: number, newText: string): Promise<void> {
    this.logger.debug(`[CachingPostModel] Trying to edit post ${id}`);
    await this.db<TPost>("post").where({ id: id }).update({ text: newText });
  }

  public async deletePost(id: number): Promise<void> {
    this.logger.debug(`[CachingPostModel] Trying to delete post ${id}`);
    await this.db<TPost>("post").where({ id: id }).del();
  }

  public async freezePost(id: number): Promise<void> {
    this.logger.debug(`[CachingPostModel] Trying to freeze post ${id}`);
    await this.db<TPost>("post").where({ id: id }).update({
      freezenAt: new Date(Date.now())
    });
  }

  public async getList(afterCursor: string, numberRecords: number): Promise<GetListReturnType> {
    this.logger.debug(`[CachingPostModel] Trying to get list: ${afterCursor}, ${numberRecords}`);
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

  public async getReplies(parent: number): Promise<TPost[]> {
    this.logger.debug(`[CachingPostModel] Trying to get replies to ${parent}`);

    const result = await this.db<TPost>("post").where("freezenAt", null)
                                               .andWhere("parent", parent)
                                               .select()
                                               .orderBy("createdAt", "DESC");

    return result;
  }

  public async findParent(id: number): Promise<number | undefined> {
    this.logger.debug(`[CachingPostModel] Finding parent for ${id}`);
  
    const comment = await this.getPost(id);
    if (!comment) {
      this.logger.debug(`[CachingPostModel] ${id} is the parent`);
      return;
    }

    let parent: number = comment.repliesTo || comment.id;
    let commentOfParent = await this.getPost(parent) as TPost;

    while (commentOfParent) {
      this.logger.debug(`[CachingPostModel] Probably ${parent}, checking`);
      commentOfParent = await this.getPost(parent) as TPost;

      if (commentOfParent.repliesTo === null) {
        this.logger.debug(`[CachingPostModel] Yeah, ${commentOfParent.id} is the parent`);
        return commentOfParent.id;
      }
  
      this.logger.debug(`[CachingPostModel] Nah, ${commentOfParent.id} is not a parent`);
      parent = commentOfParent.repliesTo;
    }

    this.logger.debug(`[CachingPostModel] Done, ${parent} is the parent`);
    return parent;
  }

  public async editTags(id: number, newTags: string): Promise<void> {
    this.logger.debug(`[CachingPostModel] Editing tags for ${id}: ${newTags}`);
    await this.db<TPost>("post").where({ id }).update({ tags: newTags });
    await this.redisClient.del(`post_${id}`);
  }
}