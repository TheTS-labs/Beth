import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel from "../../db/models/permission";
import PostModel, { TPost } from "../../db/models/post";
import UserModel, { TUser } from "../../db/models/user";
import VoteModel, { Vote } from "../../db/models/vote";
import * as type from "./types";

type CallEndpointReturnType = object;

export default class RecommendationEndpoint extends BaseEndpoint<type.RecommendationRequestArgs,
                                                                 CallEndpointReturnType> {
  public allowNames: string[] = [
    "recommend"
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
    super(db, redisClient, logger, config, "recommendation");
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PermissionModelType = REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;
    const PostModelType = REDIS_REQUIRED ? CachingPostModel : PostModel;

    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModelType(this.db, this.logger, this.redisClient, this.config);
    this.voteModel = new VoteModel(this.db, this.logger, this.redisClient, this.config);
  }

  async recommend(_args: object, user: TUser): Promise<CallEndpointReturnType>{
    const votes = await this.voteModel.getVotes(user.id);
    const postsWithVoteType: (TPost & { voteType: Vote })[] = [];

    // The reason why a for loop is used instead of forEach 
    // in this code is that forEach does not wait for
    // asynchronous operations to complete before moving to
    // the next iteration. As a result, when return is
    // executed, the asynchronous operations may not have completed
    // yet, and the posts array may be empty. In contrast, a for loop
    // waits for each asynchronous operation to complete before moving
    // to the next iteration, ensuring that the posts array is fully
    // populated before return is executed.
    for (const vote of votes) {
      const post = await this.postModel.getPost(vote.postId);
      if (post) {
        const postWithVoteType: TPost & { voteType: Vote } = {
          ...post,
          voteType: vote.voteType
        };
        postsWithVoteType.push(postWithVoteType);
      }
    }

    const {likedTags, dislikedTags } = this.getPreferedTags(postsWithVoteType);
    const { likedUsers, dislikedUsers } = this.getPreferedUsers(postsWithVoteType);

    const posts = await this.postModel.getList("", 10);
    const recommendations: (TPost & { score: number })[] = [];

    for (const recommendPost of posts.results) {
      const tagScore = recommendPost.tags.split(",").filter(
        tag => likedTags.includes(tag)
      ).length - recommendPost.tags.split(",").filter(
        tag => dislikedTags.includes(tag)
      ).length;

      const userScore = (
        likedUsers.includes(recommendPost.author) ? 1 : 0
      ) - (
        dislikedUsers.includes(recommendPost.author) ? 1 : 0
      );

      const postWithScore = {
        ...recommendPost,
        score: tagScore + userScore
      };

      recommendations.push(postWithScore);
    }

    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }

  private getPreferedTags(posts: (TPost & { voteType: Vote })[]): { likedTags: string[], dislikedTags: string[] } {
    let likedTags = posts.filter(item => item.voteType == Vote.Up).map(item => item.tags.split(",")).flat();
    let dislikedTags = posts.filter(item => item.voteType == Vote.Down).map(item => item.tags.split(",")).flat();
    likedTags = likedTags.filter(item => !dislikedTags.includes(item));
    dislikedTags = dislikedTags.filter(item => !likedTags.includes(item));

    return { likedTags, dislikedTags };
  }

  private getPreferedUsers(posts: (TPost & { voteType: Vote })[]): { likedUsers: string[], dislikedUsers: string[] } {
    let likedUsers = posts.filter(item => item.voteType == Vote.Up).map(item => item.author).flat();
    let dislikedUsers = posts.filter(item => item.voteType == Vote.Down).map(item => item.author).flat();
    likedUsers = likedUsers.filter(item => !dislikedUsers.includes(item));
    dislikedUsers = dislikedUsers.filter(item => !likedUsers.includes(item));

    return { likedUsers, dislikedUsers };
  }
}