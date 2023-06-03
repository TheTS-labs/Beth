import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../../app";
import PostModel, { GetListReturnType, GetPostsReturnType, HotTags, TPost } from "../post";

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
    this.logger.debug({
      message: "Trying to insert post",
      path: module.filename,
      context: { author, text: "[SKIP]", repliesTo, parent }
    });
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
    this.logger.debug({ message: "Trying to edit post", path: module.filename, context: { id } });
    await this.db<TPost>("post").where({ id: id }).update({ text: newText });
  }

  public async deletePost(id: number): Promise<void> {
    this.logger.debug({ message: "Trying to delete post", path: module.filename, context: { id } });
    await this.db<TPost>("post").where({ id: id }).del();
  }

  public async freezePost(id: number): Promise<void> {
    this.logger.debug({ message: "Trying to freeze post", path: module.filename, context: { id } });
    await this.db<TPost>("post").where({ id: id }).update({
      freezenAt: new Date(Date.now())
    });
  }

  public async getList(afterCursor: string | null, numberRecords: number): Promise<GetListReturnType> {
    this.logger.debug({
      message: "Trying to get list",
      path: module.filename,
      context: { afterCursor, numberRecords }
    });
    let query = this.db.queryBuilder()
                       .select("post.*")
                       .from("post")
                       .where({ "freezenAt": null });

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

    const result = await this.db<TPost>("post").where("freezenAt", null)
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
    await this.redisClient.del(`post_${id}`);
  }
  
  public async getHotTags(): Promise<HotTags> {
    const cachedHotTagsString = await this.redisClient.get("hot_tags");
    const cachedHotTags: HotTags = JSON.parse(cachedHotTagsString||"null");

    if (cachedHotTags) {
      return cachedHotTags;
    }

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

    await this.redisClient.set("hot_tags", JSON.stringify(hotTags.rows), {
      EX: this.config.get("HOT_TAGS_EX").required().asIntPositive(),
      NX: true
    });
    
    return hotTags.rows;
  }

  public async getPosts(afterCursor: string, numberRecords: number): Promise<GetPostsReturnType> {
    let query = this.db.queryBuilder()
      .select("p.text", "u.displayName", "u.username", "p.score", "u.verified")
      .fromRaw(`(
        SELECT post.id, post.author, post.text, post."repliesTo", post."freezenAt", 
               SUM(CASE WHEN "vote"."voteType" = true THEN 1 ELSE -1 END) AS score
        FROM "post"
        JOIN "vote" ON post.id = "vote"."postId"
        GROUP BY post.id 
      ) AS p`)
      .join("user as u", "p.author", "=", "u.email")
      .whereNull("p.repliesTo")
      .whereNull("p.freezenAt")
      .where("u.isFreezen", false)
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