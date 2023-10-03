import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { Auth } from "../../common/types";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { Permissions,PermissionStatus } from "../../db/models/permission";
import PostModel, { DetailedPost, DetailedPosts, Post } from "../../db/models/post";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true, id: number } | { success: true } | DetailedPost[] | {} |
                              DetailedPosts;

export default class PostEndpoint extends BaseEndpoint<type.PostRequestArgs, CallEndpointReturnType> {
  public allowNames: string[] = [
    "create", "view", "edit", 
    "delete", "getList", 
    "forceDelete", "viewReplies", 
    "editTags", "search", "getUserPosts"
  ];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel;
  postModel: PostModel | CachingPostModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    super(db, redisClient, logger, config, "post");
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PostModelType = REDIS_REQUIRED ? CachingPostModel : PostModel;

    this.permissionModel = new PermissionModel(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModelType(this.db, this.logger, this.redisClient, this.config);
  }

  async create(args: type.CreateArgs, auth: Auth): Promise<{ success: true, id: number }> {
    args = await this.validate(type.CreateArgsSchema, args);

    const parent = args.replyTo ? await this.postModel.findParent(args.replyTo) : undefined;

    const id = await this.postModel.create({
      author: auth.user.email,
      text: args.text,
      repliesTo: args.replyTo||null,
      parent: parent||null,
      tags: args.tags
    }).catch((err: Error) => {
      throw new RequestError("DatabaseError",[ err.message]);
    });

    return { success: true, id };
  }

  async view(args: type.ViewArgs, auth: Auth | undefined): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewArgsSchema, args);

    const post = await this.postModel.readDetailedPost(args.id, auth?.user?.email);

    return post || {};
  }

  async edit(args: type.EditArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditArgsSchema, args);

    const post = await this.postModel.read(args.id);
    const permissions = await this.permissionModel.read(auth.user.email) as Permissions;
  
    if (!post) {
      throw new RequestError("DatabaseError", [""], 2);
    }

    if (post.author != auth.user.email && permissions["PostSuperEdit"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError");
    }

    await this.postModel.update(args.id, { text: args.newText });

    return { success: true };
  }

  async delete(args: type.DeleteArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.DeleteArgsSchema, args);

    const post = await this.postModel.read(args.id);
    const permissions = await this.permissionModel.read(auth.user.email) as Permissions;

    if (!post) {
      throw new RequestError("DatabaseError", [""], 2);
    }

    if (post.author != auth.user.email && permissions["PostSuperDelete"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", [""], 1);
    }

    await this.postModel.update(args.id, { frozenAt: new Date(Date.now()) });

    return { success: true };
  }

  async getList(args: type.GetListArgs, _auth: Auth): Promise<{ results: Post[], endCursor: string }> {
    args = await this.validate(type.GetListArgsSchema, args);

    const result = await this.postModel.readList(args.afterCursor, args.numberRecords)
                                       .catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return result;
  }

  async forceDelete(args: type.ForceDeleteArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ForceDeleteArgsSchema, args);

    const post = await this.postModel.read(args.id);

    if (!post) {
      throw new RequestError("DatabaseError", [""], 2);
    }

    await this.postModel.delete(args.id);

    return { success: true };
  }

  async viewReplies(args: type.ViewRepliesArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewRepliesArgsSchema, args);

    const results = await this.postModel.readReplies(args.repliesTo).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return results;
  }

  async editTags(args: type.EditTagsArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditTagsArgsSchema, args);

    const post = await this.postModel.read(args.id);
    const permissions = await this.permissionModel.read(auth.user.email) as Permissions;

    if (!post) {
      throw new RequestError("DatabaseError", [""], 2);
    }

    if (post.author != auth.user.email && permissions["PostSuperTagsEdit"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", [""], 2);
    }

    await this.postModel.update(args.id, { tags: args.newTags }).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError",[ err.message]);
    });

    return { success: true };
  }

  async search(args: type.SearchArgs, _auth: Auth, recursive?: boolean): Promise<CallEndpointReturnType> {
    args = await this.validate(type.SearchArgsSchema, args);

    const searchResults = await this.postModel.search(
      args.query,
      args.afterCursor,
      args.numberRecords
    ).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    if (args.tags) {
      const filtered = searchResults.results.filter(({ tags }) => {
        const postTags = tags.split(",");
        const queryTags = args.tags?.split(",") || [];

        return postTags.some(tag => queryTags.includes(tag));
      });

      if (filtered.length >= 1) {
        return {
          endCursor: searchResults.endCursor,
          results: filtered
        };
      }

      const multiplier = this.config.get("RECURSIVE_SEARCH_MULTIPLIER").required().asFloatPositive();

      const performanceStart = performance.now();
      const recursiveSearch = await this.search({
        query: args.query,
        afterCursor: searchResults.endCursor,
        numberRecords: Math.floor(args.numberRecords*multiplier),
        tags: args.tags
      }, _auth, true) as DetailedPosts;

      if (!recursive) {
        this.logger.log({
          level: "system",
          message: `Time collapsed to complete the search: ~${Math.floor(performance.now()-performanceStart)} ms`,
          path: module.filename
        });
      }

      return recursiveSearch;
    }

    return searchResults;
  }

  async getUserPosts(args: type.GetUserPostsArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.GetUserPostsArgsSchema, args);

    const results = await this.postModel.getUserPosts(
      args.email,
      args.afterCursor,
      args.numberRecords
    ).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return results;
  }
}