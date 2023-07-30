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
import PostModel, { NestedPost, Post } from "../../db/models/post";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true, id: number } | { success: true } | NestedPost[] | {};

export default class PostEndpoint extends BaseEndpoint<type.PostRequestArgs, CallEndpointReturnType> {
  public allowNames: string[] = [
    "create", "view", "edit", 
    "delete", "getList", 
    "forceDelete", "viewReplies", 
    "editTags"
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
      parent: parent||null
    }).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message);
    });

    return { success: true, id };
  }

  async view(args: type.ViewArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewArgsSchema, args);

    const post = await this.postModel.read(args.id);

    if (!post || post?.frozenAt) {
      return {};
    }

    return post;
  }

  async edit(args: type.EditArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditArgsSchema, args);

    const post = await this.postModel.read(args.id);
    const permissions = await this.permissionModel.read(auth.user.email) as Permissions;
  
    if (!post) {
      throw new RequestError("DatabaseError", "", 2);
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
      throw new RequestError("DatabaseError", "", 2);
    }

    if (post.author != auth.user.email && permissions["PostSuperDelete"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", "", 1);
    }

    await this.postModel.update(args.id, { frozenAt: new Date(Date.now()) });

    return { success: true };
  }

  async getList(args: type.GetListArgs, _auth: Auth): Promise<{ results: Post[], endCursor: string }> {
    args = await this.validate(type.GetListArgsSchema, args);

    // TODO: Change `GetListArgs.afterCursor: string | null` to `GetListArgs.afterCursor: string | undefined`

    const result = await this.postModel.readList(args.afterCursor||undefined, args.numberRecords)
                                       .catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message);
    });

    return result;
  }

  async forceDelete(args: type.ForceDeleteArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ForceDeleteArgsSchema, args);

    const post = await this.postModel.read(args.id);

    if (!post) {
      throw new RequestError("DatabaseError", "", 2);
    }

    await this.postModel.delete(args.id);

    return { success: true };
  }

  async viewReplies(args: type.ViewRepliesArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewRepliesArgsSchema, args);

    const results = await this.postModel.readReplies(args.parent).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message);
    });

    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    if (REDIS_REQUIRED) {
      return this.getNestedChildren(results, args.parent);
    }

    return this.getNestedChildrenWithoutRedis(results, args.parent);
  }

  async editTags(args: type.EditTagsArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditTagsArgsSchema, args);

    const post = await this.postModel.read(args.id);
    const permissions = await this.permissionModel.read(auth.user.email) as Permissions;

    if (!post) {
      throw new RequestError("DatabaseError", "", 2);
    }

    if (post.author != auth.user.email && permissions["PostSuperTagsEdit"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", "", 2);
    }

    await this.postModel.update(args.id, { tags: args.newTags }).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message);
    });

    return { success: true };
  }

  async getNestedChildren(arr: Post[], repliesTo: number): Promise<NestedPost[]> {
    const doesKeyExist = await this.redisClient.exists(`post:replies:${repliesTo}`);
    if (doesKeyExist) {
      const result = await this.redisClient.get(`post:replies:${repliesTo}`) as string;
      return JSON.parse(result) as NestedPost[];
    }

    const stack: Post[] = [];
    const map = new Map<number, NestedPost>();

    for (const post of arr) {
      const nestedPost = post as NestedPost;

      if (post.repliesTo == repliesTo) {
        const doesNestedKeyExist = await this.redisClient.exists(`post:replies:${post.id}`);
        if (doesNestedKeyExist) {
          const nestedResult = await this.redisClient.get(`post:replies:${post.id}`) as string;
          nestedPost.replies = JSON.parse(nestedResult) as NestedPost[];
        } else {
          nestedPost.replies = [];
          stack.push(post);
        }
      }
      map.set(post.id, nestedPost);
    }

    while (stack.length) {
      const post = stack.pop() as Post;
      const nestedPost = map.get(post.id) as NestedPost;
      const grandChildrenCache = await this.redisClient.get(`post:replies:${post.id}`) as string;

      const grandChildren = nestedPost.replies = nestedPost.replies.concat(
        JSON.parse(grandChildrenCache) ?? [],
        arr.filter(post => post.repliesTo == post.id)
           .map(post => {
              if (!map.get(post.id)?.replies) {
                stack.push(post);
                map.set(post.id, { ...post, replies: [] });
              }
              
              return map.get(post.id) as NestedPost;
            }),
      );

      await this.redisClient.set(`post:replies:${post.id}`, JSON.stringify(grandChildren), {
        NX: true,
        EX: this.config.get("POST_REPLIES_EX").required().asIntPositive()
      });
    }

    const result = arr.filter(post => post.repliesTo == repliesTo)
                      .map(post => map.get(post.id) as NestedPost);

    await this.redisClient.set(`post:replies:${repliesTo}`, JSON.stringify(result), {
      NX: true,
      EX: this.config.get("POST_REPLIES_EX").required().asIntPositive()
    });

    return result;
  }

  async getNestedChildrenWithoutRedis(arr: Post[], repliesTo: number): Promise<NestedPost[]> {
    const stack: Post[] = [];
    const map = new Map<number, NestedPost>();

    for (const post of arr) {
      const nestedPost = post as NestedPost;

      if (post.repliesTo == repliesTo) {
        nestedPost.replies = [];
        stack.push(post);
      }
      map.set(post.id, nestedPost);
    }

    while (stack.length) {
      const post = stack.pop() as Post;
      const nestedPost = map.get(post.id) as NestedPost;

      nestedPost.replies = arr.filter(post => post.repliesTo == post.id).map(post => {
        stack.push(post);
        map.set(post.id, { ...post, replies: [] });
        
        return map.get(post.id) as NestedPost;
      });
    }

    const result = arr.filter(post => post.repliesTo == repliesTo)
                      .map(post => map.get(post.id) as NestedPost);

    return result;
  }
}