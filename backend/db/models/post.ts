import { Knex } from "knex";
import { getCursor, knexCursorPagination } from "knex-cursor-pagination";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import ICRUDModel from "../../common/types/crud_model";
import { User } from "./user";
import { Vote, VoteType } from "./vote";

export interface Post {
  id: number
  author: string
  createdAt: Date
  frozenAt: Date
  text: string
  repliesTo: number | null
  parent: number | null
  tags: string
}

export type DetailedPost = (
  Pick<Post, "id" | "text" | "repliesTo" | "tags" | "author"> &
  Pick<User, "displayName" | "username" | "verified"> &
  { 
    _cursor_0: number
    score: number
    userVote: null | boolean | VoteType
  }
);

export interface DetailedPosts {
  results: DetailedPost[]
  endCursor: string
}

export type NestedPost = (Post & { replies: NestedPost[] });

export default class PostModel implements ICRUDModel<
  Omit<Post, "id" | "createdAt" | "frozenAt" | "tags">,
  Post
> {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType,
    public config: ENV
  ) {}

  public async create(
    args: Omit<Post, "id" | "createdAt" | "frozenAt" | "tags">
  ): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create post",
      path: module.filename,
      context: args
    });

    const post = await this.db<Post>("post").insert(args, "id");

    return post[0].id;
  }

  public async read<SelectType extends keyof Post>(
    identifier: number,
    select?: "*" | SelectType[] | undefined
  ): Promise<Post | Pick<Post, SelectType> | undefined> {
    const post = await this.db<Post>("post")
                           .where({ id: identifier })
                           .select(select||"*")
                           .first();

    return post;
  }

  public async update(identifier: number, args: Partial<Post>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update post",
      path: module.filename,
      context: { identifier, args }
    });

    await this.db<Post>("post").where({ id: identifier }).update(args);
  }

  public async delete(identifier: number): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete post",
      path: module.filename,
      context: { identifier }
    });

    await this.db<Post>("post").where({ id: identifier }).del();
  }

  public async readHotTags(): Promise<{ tag: string, post_count: string }[]> {
    this.logger.log({
      level: "trying",
      message: "To read hot tags",
      path: module.filename
    });

    //? I can't do this without raw also because Knex turns .select("tag", "COUNT(*) as post_count") into
    //? select "tag", "COUNT(*)" as "post_count"
    // TODO: https://knexjs.org/guide/ref.html#alias

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

  public async readList(afterCursor?: string, numberRecords?: number): Promise<{ results: Post[], endCursor: string }> {
    this.logger.log({
      level: "trying",
      message: "To read a list of posts",
      path: module.filename,
      context: { afterCursor, numberRecords }
    });

    const results = await knexCursorPagination(
      this.db.queryBuilder()
             .select("*")
             .from("post")
             .whereNull("post.frozenAt"),
      { after: afterCursor, first: numberRecords }
    );
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }

  public async readReplies(repliesTo: number): Promise<DetailedPost[]> {
    this.logger.log({
      level: "trying",
      message: "To read replies of the posts",
      path: module.filename,
      context: { repliesTo }
    });

    const result = await this.db<DetailedPost>("post").select(
      "post.id",
      "post.author",
      "post.text",
      "post.repliesTo",
      "post.tags",
      "user.displayName",
      "user.username",
      "user.verified"
    ).join("user", "post.author", "=", "user.email")
     .where("frozenAt", null)
     .andWhere("repliesTo", repliesTo)
     .where("user.isFrozen", false)
     .orderBy("createdAt", "DESC");

    return result;
  }

  public async findParent(identifier: number): Promise<number | undefined> {
    this.logger.log({
      level: "trying",
      message: "To find the parent of the post",
      path: module.filename,
      context: { identifier }
    });
  
    const comment = await this.read(identifier);
    if (!comment) {
      this.logger.log({ level: "database",  message: `${identifier} is the parent`, path: module.filename });
      return;
    }

    let parent: number = comment.repliesTo || comment.id;
    let commentOfParent = await this.read(parent) as Post;

    while (commentOfParent) {
      this.logger.log({ level: "database",  message: `Probably ${parent}, checking...`, path: module.filename });
      commentOfParent = await this.read(parent) as Post;

      if (commentOfParent.repliesTo === null) {
        this.logger.log({
          level: "database",
          message: `Yeah, ${commentOfParent.id} is the parent`,
          path: module.filename
        });
        return commentOfParent.id;
      }
  
      this.logger.log({
        level: "database",
        message: `Nah, ${commentOfParent.id} is not a parent`,
        path: module.filename
      });
      parent = commentOfParent.repliesTo;
    }

    this.logger.log({ level: "database",  message: `Done, ${parent} is the parent`, path: module.filename });
    return parent;
  }

  public async readDetailedPosts(
    afterCursor: string,
    numberRecords: number,
    email?: string
  ): Promise<DetailedPosts | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read posts with more detailed info",
      path: module.filename,
      context: { afterCursor, numberRecords, email }
    });

    const results = await knexCursorPagination(this.db.queryBuilder()
      .select(
        "post.id",
        "post.author",
        "post.text",
        "post.repliesTo",
        "post.tags",
        "user.displayName",
        "user.username",
        "user.verified"
      )
      .from("post")
      .join("user", "post.author", "=", "user.email")
      .whereNull("post.repliesTo")
      .whereNull("post.frozenAt")
      .where("user.isFrozen", false)
      .orderBy("post.id", "desc"), { after: afterCursor, first: numberRecords });

    if (results.length === 0) {
      return undefined;
    }
    const endCursor = getCursor(results[results.length - 1]);

    const votes = (await this.db.transaction(async trx => {
      return Promise.all(results.map(result => 
        trx<Vote>("vote").select().where("vote.postId", result.id)
      ));
    })).flat();

    const additionalInfo: { [key: number]: { score: number, userVote: null | boolean | VoteType } } = {};

    votes.forEach(vote => {
      if (!additionalInfo.hasOwnProperty(vote.postId)) {
        additionalInfo[vote.postId] = {
          score: 0,
          userVote: null
        };
      }
      if (email && vote.userEmail == email) {
        additionalInfo[vote.postId].userVote = vote.voteType;
      }
      additionalInfo[vote.postId].score += vote.voteType ? 1 : -1;
    });

    return {
      results: results.map(result => ({ ...result, ...additionalInfo[result.id] })),
      endCursor
    };
  }

  public async search(
    query: string,
    afterCursor?: string,
    numberRecords?: number
  ): Promise<DetailedPosts> {
    this.logger.log({
      level: "trying",
      message: "To search posts",
      path: module.filename,
      context: { query, afterCursor, numberRecords }
    });

    const results = await knexCursorPagination(this.db.queryBuilder()
      .select(
        "post.id",
        "post.author",
        "post.text",
        "post.repliesTo",
        "post.tags",
        "user.displayName",
        "user.username",
        "user.verified"
      )
      .from("post")
      .join("user", "post.author", "=", "user.email")
      .whereNull("post.repliesTo")
      .whereNull("post.frozenAt")
      .where("user.isFrozen", false)
      .whereLike("text", query)
      .orderBy("post.id", "desc"), { after: afterCursor, first: numberRecords });
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }

  public async getUserPosts(
    username: string,
    afterCursor?: string,
    numberRecords?: number
  ): Promise<DetailedPosts> {
    this.logger.log({
      level: "trying",
      message: `To get posts made by @${username}`,
      path: module.filename,
      context: { username, afterCursor, numberRecords }
    });

    const results = await knexCursorPagination(this.db.queryBuilder()
      .select(
        "post.id",
        "post.author",
        "post.text",
        "post.repliesTo",
        "post.tags",
        "user.displayName",
        "user.username",
        "user.verified"
      )
      .from("post")
      .join("user", "post.author", "=", "user.email")
      .whereNull("post.repliesTo")
      .whereNull("post.frozenAt")
      .where("user.isFrozen", false)
      .where("user.username", username)
      .orderBy("post.id", "desc"), { after: afterCursor, first: numberRecords });
    const endCursor = getCursor(results[results.length - 1]);

    return {
      results: results,
      endCursor: endCursor
    };
  }
}