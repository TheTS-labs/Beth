import pick from "../../../common/pick";
import VoteModel, { Vote } from "../vote";

export default class CachingVoteModel extends VoteModel {
  public async create(args: Omit<Vote, "id" | "createdAt">): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create vote",
      path: module.filename,
      context: args
    });

    const vote = await this.db<Vote>("vote").insert(args, "*");

    await this.redisClient.set(`vote:${vote[0].postId}:${vote[0].userEmail}`, JSON.stringify(vote[0]), {
      EX: this.config.get("VOTE_EX").required().asIntPositive(),
      NX: true
    });

    return vote[0].id;
  }

  public async read<SelectType extends keyof Vote>(
    identifier: number,
    select?: (keyof Vote)[] | "*"
  ): Promise<Vote | Pick<Vote, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read vote",
      path: module.filename,
      context: { identifier, select }
    });

    const cachedVoteString = await this.redisClient.get(`vote:${identifier}`),
          cachedVote = JSON.parse(cachedVoteString||"null");

    if (cachedVote) {
      // TODO: Remove select == "*" because it is in pick function 
      if (!select || select == "*") {
        return cachedVote;
      }

      return pick(cachedVote, ...select) as Pick<Vote, SelectType>;
    }

    const vote = await this.db<Vote>("vote").where({ id: identifier }).select().first();

    if (!vote) {
      return vote;
    }

    await this.redisClient.set(`vote:${identifier}`, JSON.stringify(vote), {
      EX: this.config.get("VOTE_EX").required().asIntPositive(),
      NX: true
    });

    if (!select || select == "*") {
      return vote;
    }

    return pick(vote, ...select) as Pick<Vote, SelectType>;
  }

  public async update(identifier: number, args: Partial<Vote>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update vote",
      path: module.filename,
      context: { identifier, args }
    });

    const vote = await this.db<Vote>("vote").where({ id: identifier }).update(args, "*");

    await this.redisClient.del(`vote:${identifier}`);
    await this.redisClient.set(`vote:${identifier}`, JSON.stringify(vote[0]), {
      EX: this.config.get("VOTE_EX").required().asIntPositive(),
      NX: true
    });
  }

  public async delete(identifier: number): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete vote",
      path: module.filename,
      context: { identifier }
    });

    const vote = await this.db<Vote>("vote").where({ id: identifier }).del("*");
    await this.redisClient.del(`vote:${identifier}`);
    await this.redisClient.del(`vote:${vote[0].postId}:${vote[0].userEmail}`);
  }

  public async readByIds<SelectType extends keyof Vote>(
    postId: number,
    userEmail: string,
    select?: (keyof Vote)[] | "*"
  ): Promise<Vote | Pick<Vote, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read vote by postId and userEmail",
      path: module.filename,
      context: { postId, userEmail, select }
    });

    const cachedVoteString = await this.redisClient.get(`vote:${postId}:${userEmail}`),
          cachedVote = JSON.parse(cachedVoteString||"null");

    if (cachedVote) {
      if (!select || select == "*") {
        return cachedVote;
      }

      return pick(cachedVote, ...select) as Pick<Vote, SelectType>;
    }

    const vote = await this.db<Vote>("vote").where({ postId, userEmail }).select().first();

    if (!vote) {
      return vote;
    }

    await this.redisClient.set(`vote:${postId}:${userEmail}`, JSON.stringify(vote), {
      EX: this.config.get("VOTE_EX").required().asIntPositive(),
      NX: true
    });

    if (!select || select == "*") {
      return vote;
    }

    return pick(vote, ...select) as Pick<Vote, SelectType>;
  }
}