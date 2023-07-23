import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import { Auth, UserScore } from "../../common/types";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel from "../../db/models/permission";
import PostModel, { GetPostsReturnType, HotTags, TPost } from "../../db/models/post";
import UserModel from "../../db/models/user";
import VoteModel, { Vote } from "../../db/models/vote";
import * as type from "./types";

type CallEndpointReturnType = { results: TPostWithRate[] } | { result: HotTags[] } | GetPostsReturnType;
type TPostWithVote = TPost & { voteType: Vote };
type TPostWithRate = TPost & { rate: number };
interface RecommendationRequirements {
  likedTags: string[]
  dislikedTags: string[]
  likedUsers: string[]
  dislikedUsers: string[]
  posts: GetPostsReturnType
}

export default class RecommendationEndpoint extends BaseEndpoint<type.RecommendationRequestArgs,
                                                                 CallEndpointReturnType> {
  public allowNames: string[] = [
    "recommend", "getHotTags", "globalRecommend"
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

  async globalRecommend(args: type.GetPostsArgs, _auth: Auth): Promise<GetPostsReturnType> {
    args = await this.validate(type.GetPostsArgsSchema, args);

    const posts = await this.postModel.getPosts(args.afterCursor, args.numberRecords);

    posts.results.sort((a, b) => b.score - a.score);

    // posts.results.sort((a, b) => {
    //   const millisecondsFromCreationA = Date.now() - a.createdAt.getTime(),
    //         millisecondsFromCreationB = Date.now() - b.createdAt.getTime();
    //   return millisecondsFromCreationB/b.score - millisecondsFromCreationA/a.score;
    // });

    return posts;
  }

  async getHotTags(_args: type.GetHotTagsArgs, _auth: Auth): Promise<{ result: HotTags }> {
    const hotTags = await this.postModel.getHotTags();
    return { result: hotTags };
  }

  async recommend(args: type.RecommendArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.RecommendArgsSchema, args);

    const votes = await this.voteModel.getVotes(auth.user.email);
    
    const postsWithVoteType = await Promise.all(votes.map(async (vote) => {
      const post = await this.postModel.getPost(vote.postId);
      if (post) {
        return {
          ...post,
          voteType: vote.voteType
        };
      }
    })) as TPostWithVote[];

    const requirements = await this.getRecommendationRequirements(args, postsWithVoteType, auth.user.email);

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

  private getPreferredTags(posts: TPostWithVote[], voteType: Vote): string[] {
    return posts.filter(item => item.voteType == voteType).flatMap(item => item.tags ? item.tags.split(",") : []);
  }

  private getPreferredUsers(posts: TPostWithVote[], voteType: Vote): string[] {
    return posts.filter(item => item.voteType == voteType).flatMap(item => item.author);
  }

  private async getRecommendationRequirements(
    args: type.RecommendArgs, postsWithVoteType: TPostWithVote[], email: string
  ): Promise<RecommendationRequirements> {
    return {
      likedTags: this.getPreferredTags(postsWithVoteType, Vote.Up),
      dislikedTags: this.getPreferredTags(postsWithVoteType, Vote.Down),
      likedUsers: this.getPreferredUsers(postsWithVoteType, Vote.Up),
      dislikedUsers: this.getPreferredUsers(postsWithVoteType, Vote.Down),
      posts: await this.postModel.getPosts(args.afterCursor, args.numberRecords, email)
    };
  }
}