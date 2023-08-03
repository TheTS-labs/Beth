import pick from "../../../common/pick";
import PostModel, { Post } from "../post";

export default class CachingPostModel extends PostModel {
  public async create(
    args: Omit<Post, "id" | "tags" | "createdAt" | "frozenAt">
  ): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create post",
      path: module.filename,
      context: args
    });

    const post = await this.db<Post>("post").insert(args, "*");

    await this.redisClient.set(`post:${post[0].id}`, JSON.stringify(post[0]), {
      EX: this.config.get("POST_EX").required().asIntPositive(),
      NX: true
    });

    return post[0].id;
  }

  public async read<SelectType extends keyof Post>(
    identifier: number,
    select?: "*" | (keyof Post)[]
  ): Promise<Post | Pick<Post, SelectType> | undefined> {
    const cachedPostString = await this.redisClient.get(`user:${identifier}`),
          cachedPost = JSON.parse(cachedPostString||"null") as Post | null;

    if (cachedPost) {
      return pick(cachedPost, select) as Pick<Post, SelectType>;
    }

    const post = await this.db<Post>("post")
                           .where({ id: identifier })
                           .select()
                           .first();

    if (!post) {
      return post;
    }

    await this.redisClient.set(`post:${identifier}`, JSON.stringify(post), {
      EX: this.config.get("POST_EX").required().asIntPositive(),
      NX: true
    });

    return pick(post, select) as Pick<Post, SelectType>;
  }

  public async update(identifier: number, args: Partial<Post>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update post",
      path: module.filename,
      context: { identifier, args }
    });

    const post = await this.db<Post>("post").where({ id: identifier }).update(args, "*");

    await this.redisClient.del(`post:${identifier}`);
    await this.redisClient.set(`post:${identifier}`, JSON.stringify(post[0]), {
      EX: this.config.get("USER_EX").required().asIntPositive(),
      NX: true
    });
  }

  public async delete(identifier: number): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete post",
      path: module.filename,
      context: { identifier }
    });

    await this.db<Post>("post").where({ id: identifier }).del();
    await this.redisClient.del(`post:${identifier}`);
  }

  public async readHotTags(): Promise<{ tag: string, post_count: string }[]> {
    this.logger.log({
      level: "trying",
      message: "To read hot tags",
      path: module.filename
    });

    const cachedHotTagsString = await this.redisClient.get("post:hotTags");
    const cachedHotTags: { tag: string, post_count: string }[] | null = JSON.parse(cachedHotTagsString||"null");

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

    await this.redisClient.set("post:hotTags", JSON.stringify(hotTags.rows), {
      EX: this.config.get("HOT_TAGS_EX").required().asIntPositive(),
      NX: true
    });

    return hotTags.rows;
  }
}