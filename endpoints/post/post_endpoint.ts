import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import RequestError from "../../common/request_error";
import ENV from "../../config";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingPostModel from "../../db/models/caching/caching_post";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { TPermissions } from "../../db/models/permission";
import PostModel, { GetListReturnType, NestedTPost, TPost } from "../../db/models/post";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true, id: number } | { success: true } | NestedTPost[];

export default class PostEndpoint implements IBaseEndpoint {
  public allowNames: string[] = [
    "create", "view",
    "edit", "delete",
    "getList", "forceDelete",
    "viewReplies"
  ];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel | CachingPermissionModel;
  postModel: PostModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    const UserModelType = this.config.REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PermissionModelType = this.config.REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;
    const PostModelType = this.config.REDIS_REQUIRED ? CachingPostModel : PostModel;

    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModelType(this.db, this.logger, this.redisClient, this.config);
  }

  // >>> Create >>>
  async create(args: type.CreateArgs, user: TUser): Promise<{ success: true, id: number }> {
    await this.validate(type.CreateArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const parent = args.replyTo ? await this.postModel.findParent(args.replyTo) : undefined;

    const { id } = await this.postModel.insertPost(
      user.email,
      args.text,
      args.replyTo, parent
    ).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    }) as Pick<TPost, "id">;

    return { success: true, id: id };
  }
  // <<< Create <<<

  // >>> View >>>
  async view(args: type.ViewArgs, user: TUser): Promise<{ success: true }|{}> {
    await this.validate(type.ViewArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const post = await this.postModel.getPost(args.id);

    if (post?.freezenAt) {
      return {};
    }

    return post||{};
  }
  // <<< View <<<

  // >>> Edit >>>
  async edit(args: type.EditArgs, user: TUser): Promise<{ success: true }> {
    await this.validate(type.EditArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const post = await this.postModel.getPost(args.id);
    const permissions = await this.permissionModel.getPermissions(user.email) as TPermissions;
  
    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    if (post.author != user.email && !permissions["post_superEdit"]) {
      throw new RequestError("PermissionError", "You can only edit your own posts", 403);
    }

    await this.postModel.editPost(args.id, args.newText);

    return { success: true };
  }
  // <<< Edit <<<

  // >>> Delete >>>
  async delete(args: type.DeleteArgs, user: TUser): Promise<{ success: true }> {
    await this.validate(type.DeleteArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const post = await this.postModel.getPost(args.id);
    const permissions = await this.permissionModel.getPermissions(user.email) as TPermissions;

    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    if (post.author != user.email && !permissions["post_superDelete"]) {
      throw new RequestError("PermissionError", "You can only delete your own posts", 403);
    }

    await this.postModel.freezePost(args.id);

    return { success: true };
  }
  // <<< Delete <<<

  // <<< Get List <<<
  async getList(args: type.GetListArgs, user: TUser): Promise<GetListReturnType> {
    await this.validate(type.GetListArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const result = await this.postModel.getList(args.afterCursor, args.numberRecords||3)
                                       .catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return result;
  }
  // >>> Get List >>>

  // <<< Force Delete <<<
  async forceDelete(args: type.ForceDeleteArgs, user: TUser): Promise<{ success: true }> {
    await this.validate(type.ForceDeleteArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const post = await this.postModel.getPost(args.id);

    if (!post) {
      throw new RequestError("DatabaseError", "Post doesn't exist", 404);
    }

    await this.postModel.deletePost(args.id);

    return { success: true };
  }
  // >>> Force Delete >>>

  // <<< View Replies <<<
  async viewReplies(args: type.ViewRepliesArgs, user: TUser): Promise<NestedTPost[]> {
    await this.validate(type.ViewRepliesArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const results = await this.postModel.getReplies(args.parent).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return this.getNestedChildren(results, args.parent);
  }
  // >>> Get List >>>

  async callEndpoint(
    name: string, args: type.PostRequestArgs, user: unknown | undefined
  ): Promise<CallEndpointReturnType> {
    const userIncludes = this.allowNames.includes(name);
    if (!userIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint post/${name} does not exist`, 404);
    }

    // Element implicitly has an 'any' type
    // because expression of type 'string' can't be used to index type 'PostEndpoint'.
    // No index signature with a parameter of type 'string' was found on type 'PostEndpoint'.
    // But it actually can be used
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: CallEndpointReturnType = await this[name](args, user);

    return result;
  }

  async validate(schema: Joi.ObjectSchema, args: type.PostRequestArgs): Promise<void> {
    const validationResult = schema.validate(args);
    if (validationResult.error) {
      throw new RequestError("ValidationError", validationResult.error.message, 400);
    }
  }

  async abortIfFreezen(email: string): Promise<void> {
    const result = await this.userModel.isFreezen(email);
    if (result) {
      throw new RequestError("UserIsFreezen", `User(${email}) is freezen`, 403);
    }
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
        EX: this.config.POST_COMMENTS_EX
      });
    }

    const result = arr.filter((post) => post.repliesTo == repliesTo)
                      .map((post) => map.get(post.id) as NestedTPost);

    await this.redisClient.set(`post_comments_${repliesTo}`, JSON.stringify(result), {
      NX: true,
      EX: this.config.POST_COMMENTS_EX
    });

    return result;
  }
  
}