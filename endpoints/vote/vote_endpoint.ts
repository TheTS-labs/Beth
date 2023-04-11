import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import { IBaseEndpoint } from "../../common/base_endpoint";
import RequestError from "../../common/request_error";
import { EndpointThisType } from "../../common/types";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel from "../../db/models/permission";
import PostModel from "../../db/models/post";
import UserModel, { TUser } from "../../db/models/user";
import VoteModel, { Vote } from "../../db/models/vote";
import * as type from "./types";

type CallEndpointReturnType = { success: true } | { count: number, voteType: Vote };

export default class VoteEndpoint implements IBaseEndpoint {
  public allowNames: string[] = [
    "vote", "unvote", "voteCount",
    "getVotes"
  ];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel | CachingPermissionModel;
  postModel: PostModel | CachingPostModel;
  voteModel: VoteModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PermissionModelType = REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;
    const PostModelType = REDIS_REQUIRED ? CachingPostModel : PostModel;

    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModelType(this.db, this.logger, this.redisClient, this.config);
    this.voteModel = new VoteModel(this.db, this.logger, this.redisClient, this.config);
  }

  // >>> Vote >>>
  async vote(args: type.VoteArgs, user: TUser): Promise<CallEndpointReturnType>{
    args = await this.validate(type.VoteArgsSchema, args);

    const post = await this.postModel.getPost(args.postId);
    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    const vote = await this.voteModel.getVote(args.postId, user.id);
    if (vote) {
      throw new RequestError("DatabaseError", "You already voted", 403);
    }

    await this.voteModel.vote(user.id, args.postId, args.unvote, args.voteType).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // <<< Vote <<<

  // >>> Vote count >>>
  async voteCount(args: type.VoteCountArgs, _user: TUser): Promise<CallEndpointReturnType>{
    args = await this.validate(type.VoteCountArgsSchema, args);

    const post = await this.postModel.getPost(args.postId);
    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    const count = await this.voteModel.getVoteCount(args.postId, args.voteType);

    return { count: count, voteType: args.voteType };
  }
  // <<< Vote count <<<

  async callEndpoint(
    this: EndpointThisType<VoteEndpoint, type.VoteRequestArgs, Promise<CallEndpointReturnType>>,
    name: string, args: type.VoteRequestArgs, user: TUser | undefined
  ): Promise<CallEndpointReturnType> {
    const userIncludes = this.allowNames.includes(name);
    if (!userIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint vote/${name} does not exist`, 404);
    }

    const result: CallEndpointReturnType = await this[name](args, user);

    return result;
  }

  async validate<EType>(schema: Joi.ObjectSchema, args: EType): Promise<EType> {
    const { error, value } = schema.validate(args);
    if (error) {
      throw new RequestError("ValidationError", error.message, 400);
    }

    return value as EType;
  }
}