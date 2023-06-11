import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { Auth } from "../../common/types";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { PermissionStatus, TPermissions } from "../../db/models/permission";
import PostModel, { GetListReturnType, NestedTPost, TPost } from "../../db/models/post";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true, id: number } | { success: true } | NestedTPost[] | {};

export default class PostEndpoint extends BaseEndpoint<type.PostRequestArgs, CallEndpointReturnType> {
  public allowNames: string[] = [
    "create", "view", "edit", 
    "delete", "getList", 
    "forceDelete", "viewReplies", 
    "editTags"
  ];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel | CachingPermissionModel;
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
    const PermissionModelType = REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;
    const PostModelType = REDIS_REQUIRED ? CachingPostModel : PostModel;

    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModelType(this.db, this.logger, this.redisClient, this.config);
  }

  async create(args: type.CreateArgs, auth: Auth): Promise<{ success: true, id: number }> {
    args = await this.validate(type.CreateArgsSchema, args);

    const parent = args.replyTo ? await this.postModel.findParent(args.replyTo) : undefined;

    const { id } = await this.postModel.insertPost(
      auth.user.email,
      args.text,
      args.replyTo, parent
    ).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    }) as Pick<TPost, "id">;

    return { success: true, id: id };
  }

  async view(args: type.ViewArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewArgsSchema, args);

    const post = await this.postModel.getPost(args.id);

    if (post?.frozenAt) {
      return {};
    }

    return post||{};
  }

  async edit(args: type.EditArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditArgsSchema, args);

    const post = await this.postModel.getPost(args.id);
    const permissions = await this.permissionModel.getPermissions(auth.user.email) as TPermissions;
  
    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    if (post.author != auth.user.email && permissions["PostSuperEdit"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", "You can only edit your own posts", 403);
    }

    await this.postModel.editPost(args.id, args.newText);

    return { success: true };
  }

  async delete(args: type.DeleteArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.DeleteArgsSchema, args);

    const post = await this.postModel.getPost(args.id);
    const permissions = await this.permissionModel.getPermissions(auth.user.email) as TPermissions;

    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    if (post.author != auth.user.email && permissions["PostSuperDelete"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", "You can only delete your own posts", 403);
    }

    await this.postModel.frozePost(args.id);

    return { success: true };
  }

  async getList(args: type.GetListArgs, _auth: Auth): Promise<GetListReturnType> {
    args = await this.validate(type.GetListArgsSchema, args);

    const result = await this.postModel.getList(args.afterCursor, args.numberRecords||3)
                                       .catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return result;
  }

  async forceDelete(args: type.ForceDeleteArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ForceDeleteArgsSchema, args);

    const post = await this.postModel.getPost(args.id);

    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    await this.postModel.deletePost(args.id);

    return { success: true };
  }

  async viewReplies(args: type.ViewRepliesArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewRepliesArgsSchema, args);

    const results = await this.postModel.getReplies(args.parent).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return this.getNestedChildren(results, args.parent);
  }

  async editTags(args: type.EditTagsArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditTagsArgsSchema, args);

    const post = await this.postModel.getPost(args.id);
    const permissions = await this.permissionModel.getPermissions(auth.user.email) as TPermissions;

    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    if (post.author != auth.user.email && permissions["PostSuperTagsEdit"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", "You can only edit tags of your own posts", 403);
    }

    await this.postModel.editTags(args.id, args.newTags).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async getNestedChildren(arr: TPost[], repliesTo: number): Promise<NestedTPost[]> {
    const doesKeyExist = await this.redisClient.exists(`post_comments_${repliesTo}`);
    if (doesKeyExist) {
      const result = await this.redisClient.get(`post_comments_${repliesTo}`) as string;
      return JSON.parse(result) as NestedTPost[];
    }

    const stack: TPost[] = [];
    const map = new Map<number, NestedTPost>();

    for (const post of arr) {
      const nestedPost = post as NestedTPost;

      if (post.repliesTo == repliesTo) {
        const doesNestedKeyExist = await this.redisClient.exists(`post_comments_${post.id}`);
        if (doesNestedKeyExist) {
          const nestedResult = await this.redisClient.get(`post_comments_${post.id}`) as string;
          nestedPost.comments = JSON.parse(nestedResult) as NestedTPost[];
        } else {
          nestedPost.comments = [];
          stack.push(post);
        }
      }
      map.set(post.id, nestedPost);
    }

    while (stack.length) {
      const post = stack.pop() as TPost;
      const nestedPost = map.get(post.id) as NestedTPost;
      const grandChildrenCache = await this.redisClient.get(`post_comments_${post.id}`) as string;

      const grandChildren = nestedPost.comments = nestedPost.comments.concat(
        JSON.parse(grandChildrenCache) ?? [],
        arr.filter((tpost) => tpost.repliesTo == post.id)
           .map((tpost) => {
              if (!map.get(tpost.id)?.comments) {
                stack.push(tpost);
                map.set(tpost.id, { ...tpost, comments: [] });
              }
              
              return map.get(tpost.id) as NestedTPost;
            }),
      );

      await this.redisClient.set(`post_comments_${post.id}`, JSON.stringify(grandChildren), {
        NX: true,
        EX: this.config.get("POST_COMMENTS_EX").required().asIntPositive()
      });
    }

    const result = arr.filter((post) => post.repliesTo == repliesTo)
                      .map((post) => map.get(post.id) as NestedTPost);

    await this.redisClient.set(`post_comments_${repliesTo}`, JSON.stringify(result), {
      NX: true,
      EX: this.config.get("POST_COMMENTS_EX").required().asIntPositive()
    });

    return result;
  }
  
}