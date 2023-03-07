import { privateEncrypt } from "crypto";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import RequestError from "../../common/request_error";
import ENV from "../../config";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { TPermissions } from "../../db/models/permission";
import PostModel, { GetListReturnType, TPost } from "../../db/models/post";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = object;

export default class PostEndpoint implements IBaseEndpoint {
  public allowNames: string[] = [
    "create", "view",
    "edit", "delete",
    "getList"
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

    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.postModel = new PostModel(this.db, this.logger, this.config);
  }

  // >>> Create >>>
  async create(args: type.CreateArgs, user: TUser): Promise<{ success: true, id: number }> {
    await this.validate(type.CreateArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const { id } = await this.postModel.insertPost(user.email, args.text).catch((err: Error) => {
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
      return { success: true };
    }

    if (post.author != user.email && !permissions["post_superDelete"]) {
      throw new RequestError("PermissionError", "You can only delete your own posts", 403);
    }

    await this.postModel.deletePost(args.id);

    return { success: true };
  }
  // <<< Delete <<<

  // <<< Get List <<<
  async getList(args: type.GetListArgs, _user: TUser): Promise<GetListReturnType> {
    await this.validate(type.GetListArgsSchema, args);

    const result = await this.postModel.getList(args.afterCursor, args.numberRecords||3)
                                       .catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return result;
  }
  // >>> Get List >>>

  async callEndpoint(
    name: string, args: type.PostRequestArgs, user: unknown | undefined
  ): Promise<CallEndpointReturnType> {
    const userIncludes = this.allowNames.includes(name);
    if (!userIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint post/${name} does not exist`, 404);
    }

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
}