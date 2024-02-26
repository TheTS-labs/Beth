import pick from "../../../common/pick";
import UserModel, { User } from "../user";

export default class CachingUserModel extends UserModel {
  public async create(args: Omit<User, "id" | "isFrozen" | "tags" | "verified">): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create user",
      path: module.filename,
      context: args
    });

    const user = await this.db<User>("user").insert(
      args,
      ["id", "username", "displayName", "email", "isFrozen", "tags", "verified"]
    );

    await this.redisClient.set(`user:${args.email}`, JSON.stringify(user[0]), {
      EX: this.config.get("USER_EX").required().asIntPositive(),
      NX: true
    });

    return user[0].id;
  }

  public async read<SelectType extends keyof User>(
    identifier: string,
    //? (keyof User)[] is used instead of SelectType[] because TypeScript
    //? does not recognize the presence of User keys in SelectType for some reason
    select?: (keyof User)[] | "*"
  ): Promise<User | Pick<User, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read user",
      path: module.filename,
      context: { identifier, select }
    });

    if (select?.includes("password") || select == "*") {
      const user = await this.db<User>("user")
                           .where({ email: identifier })
                           .select(select)
                           .first();
      return user as Pick<User, SelectType>;
    }

    const cachedUserString = await this.redisClient.get(`user:${identifier}`),
          cachedUser = JSON.parse(cachedUserString||"null") as Omit<User, "password"> | null;

    if (cachedUser) {
      return pick(
        cachedUser,
        select || ["id", "email", "isFrozen", "username", "displayName"]
      ) as Pick<User, SelectType>;
    }

    const user = await this.db<User>("user")
                           .where({ email: identifier })
                           .select(["id", "email", "isFrozen", "username", "displayName", "verified"])
                           .first();
    if (!user) {
      return undefined;
    }

    await this.redisClient.set(`user:${identifier}`, JSON.stringify(user), {
      EX: this.config.get("USER_EX").required().asIntPositive(),
      NX: true
    });

    return pick(
      user,
      select || ["id", "email", "isFrozen", "username", "displayName", "verified"]
    ) as Pick<User, SelectType>;
  }

  public async update(identifier: string, args: Partial<User>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update user",
      path: module.filename,
      context: { identifier, args }
    });

    const user = await this.db<User>("user").where({ email: identifier }).update(
      args,
      ["id", "username", "displayName", "email", "isFrozen", "tags", "verified"]
    );

    await this.redisClient.del(`user:${identifier}`);
    await this.redisClient.set(`user:${identifier}`, JSON.stringify(user[0]), {
      EX: this.config.get("USER_EX").required().asIntPositive(),
      NX: true
    });
  }

  public async delete(identifier: string): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete user",
      path: module.filename,
      context: { identifier }
    });

    await this.db<User>("user").where({ email: identifier }).del();
    await this.redisClient.del(`user:${identifier}`);
  } 
}