import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError, { ERequestError } from "../../common/request_error";
import { Auth, UserScore } from "../../common/types";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import CachingVoteModel from "../../db/models/caching/caching_vote";
import PermissionModel from "../../db/models/permission";
import PostModel, { DetailedPosts, Post } from "../../db/models/post";
import UserModel from "../../db/models/user";
import VoteModel, { VoteType } from "../../db/models/vote";
import * as type from "./types";

type CallEndpointReturnType = { result: { tag: string, postCount: string }[] } | DetailedPosts | never;

type PostWithVote = Post & { voteType: VoteType };
interface RecommendationRequirements {
  likedTags: string[]
  dislikedTags: string[]
  likedUsers: string[]
  dislikedUsers: string[]
  posts: DetailedPosts | undefined
}

export default class RecommendationEndpoint extends BaseEndpoint<type.RecommendationRequestArgs,
                                                                 CallEndpointReturnType> {
  public allowNames: string[] = [
    "recommend", "getHotTags", "globalRecommend"
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
    super(db, redisClient, logger, config, "recommendation");
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PostModelType = REDIS_REQUIRED ? CachingPostModel : PostModel;
    const VoteModelType = REDIS_REQUIRED ? CachingVoteModel : VoteModel;

    this.permissionModel = new PermissionModel(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModelType(this.db, this.logger, this.redisClient, this.config);
    this.voteModel = new VoteModelType(this.db, this.logger, this.redisClient, this.config);
  }

  async globalRecommend(args: type.GlobalRecommendArgs, _auth: Auth): Promise<DetailedPosts> {
    args = await this.validate(type.GlobalRecommendArgsSchema, args);

    const posts = await this.postModel.readDetailedPosts(args.afterCursor, args.numberRecords);

    if (!posts) {
      throw new RequestError(ERequestError.DatabaseErrorSufficientPosts);
    }

    posts.results.sort((a, b) => b.score - a.score);

    return posts;
  }

  async getHotTags(_args: type.GetHotTagsArgs, _auth: Auth): Promise<{ result: {
    tag: string
    postCount: string
  }[] }> {
    const hotTags = await this.postModel.readHotTags();
    return { result: hotTags };
  }

  async recommend(args: type.RecommendArgs, auth: Auth): Promise<DetailedPosts> {
    args = await this.validate(type.RecommendArgsSchema, args);

    const votes = await this.voteModel.readVotesOfUser(auth.user.email);
    
    const postsWithVoteType = await Promise.all(votes.map(async (vote) => {
      const post = await this.postModel.read(vote.postId);
      if (post) {
        return {
          ...post,
          voteType: vote.voteType
        };
      }
    })) as PostWithVote[];

    const requirements = await this.getRecommendationRequirements(args, postsWithVoteType, auth.user.email);

    if (!requirements.posts) {
      throw new RequestError(ERequestError.DatabaseErrorSufficientPosts);
    }

    const recommendations = requirements.posts.results.map(recommendPost => {
      const tags = recommendPost.tags ? recommendPost.tags.split(",") : [];
      const likedTagsCount = tags.filter(tag => requirements.likedTags.includes(tag)).length;
      const dislikedTagsCount = tags.filter(tag => requirements.dislikedTags.includes(tag)).length;
      const tagScore = likedTagsCount - dislikedTagsCount;

      const isLiked = requirements.likedUsers.includes(recommendPost.author) ? UserScore.Liked : UserScore.Nothing;
      const isDisliked = requirements.dislikedUsers.includes(recommendPost.author) ? UserScore.Disliked 
                                                                                   : UserScore.Nothing;
      const userScore = isDisliked + isLiked;

      return {
        ...recommendPost,
        rate: tagScore + userScore
      };
    });

    recommendations.sort((a, b) => b.rate - a.rate);

    return {
      results: recommendations,
      endCursor: requirements.posts.endCursor
    };
  }

  private getPreferredTags(posts: PostWithVote[], voteType: VoteType): string[] {
    return posts.filter(item => item.voteType == voteType).flatMap(item => item.tags ? item.tags.split(",") : []);
  }

  private getPreferredUsers(posts: PostWithVote[], voteType: VoteType): string[] {
    return posts.filter(item => item.voteType == voteType).flatMap(item => item.author);
  }

  private async getRecommendationRequirements(
    args: type.RecommendArgs, postsWithVoteType: PostWithVote[], email: string
  ): Promise<RecommendationRequirements> {
    return {
      likedTags: this.getPreferredTags(postsWithVoteType, VoteType.Up),
      dislikedTags: this.getPreferredTags(postsWithVoteType, VoteType.Down),
      likedUsers: this.getPreferredUsers(postsWithVoteType, VoteType.Up),
      dislikedUsers: this.getPreferredUsers(postsWithVoteType, VoteType.Down),
      posts: await this.postModel.readDetailedPosts(args.afterCursor, args.numberRecords, email)
    };
  }
}