import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { Auth } from "../../common/types";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import CachingVoteModel from "../../db/models/caching/caching_vote";
import PermissionModel from "../../db/models/permission";
import PostModel from "../../db/models/post";
import UserModel from "../../db/models/user";
import VoteModel, { VoteType } from "../../db/models/vote";
import * as type from "./types";

type CallEndpointReturnType = { success: true, action: "create" | "update" | "delete" } |
                              { goodCount: number, badCount: number, total: number };

export default class VoteEndpoint extends BaseEndpoint<type.VoteRequestArgs, CallEndpointReturnType> {
  public allowNames: string[] = [
    "vote", "voteCount"
  ];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel;
  postModel: PostModel | CachingPostModel;
  voteModel: VoteModel | CachingVoteModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    super(db, redisClient, logger, config, "voting");
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PostModelType = REDIS_REQUIRED ? CachingPostModel : PostModel;
    const VoteModelType = REDIS_REQUIRED ? CachingVoteModel : VoteModel;

    this.permissionModel = new PermissionModel(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModelType(this.db, this.logger, this.redisClient, this.config);
    this.voteModel = new VoteModelType(this.db, this.logger, this.redisClient, this.config);
  }

  async vote(args: type.VoteArgs, auth: Auth): Promise<CallEndpointReturnType>{
    args = await this.validate(type.VoteArgsSchema, args);

    const post = await this.postModel.read(args.postId);
    if (!post) {
      throw new RequestError("DatabaseError", [""], 2);
    }

    const vote = await this.voteModel.readByIds(args.postId, auth.user.email);

    // Create a vote if the user has never voted yet to the post 
    if (!vote) {
      await this.voteModel.create({
        postId: args.postId,
        userEmail: auth.user.email,
        voteType: args.voteType
      }).catch((err: { message: string }) => {
        throw new RequestError("DatabaseError", [err.message]);
      });
  
      return { success: true, action: "create" };
    }

    // Delete the vote if the user chooses same type as previously recorded
    if (vote.voteType == args.voteType) {
      await this.voteModel.delete(vote?.id||-1).catch((err: { message: string }) => {
        throw new RequestError("DatabaseError", [err.message]);
      });

      return { success: true, action: "delete" };
    } 
    
    // Update the vote if the user chooses another vote type
    await this.voteModel.update(vote.id, { voteType: args.voteType }).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return { success: true, action: "update" };
  }
  
  async voteCount(args: type.VoteCountArgs, _auth: Auth): Promise<CallEndpointReturnType>{
    args = await this.validate(type.VoteCountArgsSchema, args);

    const post = await this.postModel.read(args.postId);
    if (!post) {
      throw new RequestError("DatabaseError", [""], 2);
    }

    const goodCount = await this.voteModel.readVoteCount(args.postId, VoteType.Up);
    const badCount = await this.voteModel.readVoteCount(args.postId, VoteType.Down);
    const total = goodCount - badCount;

    return { goodCount, badCount, total };
  }
}