import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";

export enum PermissionStatus {
  Hasnt = 0,
  Has = 1
}

export interface TPermissions {
  id: number
  email: string
  UserView: PermissionStatus
  UserEditPassword: PermissionStatus
  UserFroze: PermissionStatus
  UserSuperFroze: PermissionStatus
  UserEditTags: PermissionStatus
  UserVerify: PermissionStatus
  PermissionsView: PermissionStatus
  PermissionsGrand: PermissionStatus
  PermissionsRescind: PermissionStatus
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

export default class PermissionsModel {
  constructor(
    public db: Knex,
    public logger: winston.Logger,
    public redisClient: RedisClientType, 
    public config: ENV
  ) {}

  public async insertPermissions(email: string): Promise<void> {
    this.logger.debug({ message: "Instering permission", path: module.filename, context: { email } });
    await this.db<TPermissions>("permission").insert({ email });
  }

  public async getPermissions(email: string): Promise<TPermissions | undefined> {
    this.logger.debug({ message: "Getting permissions", path: module.filename, context: { email } });
    const permissions = await this.db<TPermissions>("permission").where({ email }).first();

    return permissions;
  }

  public async grantPermission(email: string, permission: string): Promise<void> {
    this.logger.debug({ message: "Granting permission", path: module.filename, context: { email, permission } });
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: PermissionStatus.Has });
  }

  public async rescindPermission(email: string, permission: string): Promise<void> {
    this.logger.debug({ message: "Rescinding permission", path: module.filename, context: { email, permission } });
    await this.db<TPermissions>("permission").where({ email: email }).update({ [permission]: PermissionStatus.Hasnt });
  }
}
