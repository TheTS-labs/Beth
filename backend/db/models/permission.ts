import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import ICRUDModel from "../../common/types/crud_model";

export enum PermissionStatus {
  Hasnt = 0,
  Has = 1
}

export interface Permissions {
  id: number
  email: string
  UserView: PermissionStatus
  UserEditPassword: PermissionStatus
  UserFroze: PermissionStatus
  UserSuperFroze: PermissionStatus
  UserEditTags: PermissionStatus
  UserVerify: PermissionStatus
  PermissionView: PermissionStatus
  PermissionGrand: PermissionStatus
  PermissionRescind: PermissionStatus
  PostCreate: PermissionStatus
  PostView: PermissionStatus
  PostEdit: PermissionStatus
  PostDelete: PermissionStatus
  PostSuperEdit: PermissionStatus
  PostSuperDelete: PermissionStatus
  PostGetList: PermissionStatus
  PostForceDelete: PermissionStatus
  PostViewReplies: PermissionStatus
  PostEditTags: PermissionStatus
  PostSuperTagsEdit: PermissionStatus
  VotingVote: PermissionStatus
  VotingUnvote: PermissionStatus
  VotingVoteCount: PermissionStatus
  VotingGetVotes: PermissionStatus
  ActionSimpleSearch: PermissionStatus
  ActionChainWhereSearch: PermissionStatus
  RecommendationRecommend: PermissionStatus
}

export default class PermissionModel implements ICRUDModel<
  Partial<Omit<Permissions, "id" | "email">> & { email: string },
  Permissions
> {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async create(args: Partial<Omit<Permissions, "email">> & { email: string }): Promise<number> {
    this.logger.log({
      level: "trying",
      message: "To create permission for the user",
      path: module.filename,
      context: args
    });

    const permission = await this.db<Permissions>("permission").insert(args, ["id"]);

    return permission[0].id;
  }

  public async read<SelectType extends keyof Permissions>(
    identifier: string,
    select?: "*" | SelectType[] | undefined
  ): Promise<Permissions | Pick<Permissions, SelectType> | undefined> {
    this.logger.log({
      level: "trying",
      message: "To read permission of the user",
      path: module.filename,
      context: { identifier, select }
    });

    const permission = await this.db<Permissions>("permission")
                           .where({ email: identifier })
                           .select(select||["*"])
                           .first();
    
    return  permission as Pick<Permissions, SelectType>;
  }

  public async update(identifier: string, args: Partial<Omit<Permissions, "id">>): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To update permission of the user",
      path: module.filename,
      context: { identifier, args }
    });

    await this.db<Permissions>("permission").where({ email: identifier }).update(args);
  }

  public async delete(identifier: string): Promise<void> {
    this.logger.log({
      level: "trying",
      message: "To delete permission of the user",
      path: module.filename,
      context: { identifier }
    });

    await this.db<Permissions>("permission").where({ email: identifier }).del();
  }
}
