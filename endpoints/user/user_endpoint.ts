import bcrypt from "bcrypt";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import RequestError from "../../common/request_error";
import { SafeUserObject } from "../../common/types";
import ENV from "../../config";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel from "../../db/models/permission";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true } | {} | SafeUserObject;

export default class UserEndpoint implements IBaseEndpoint {
  allowNames: Array<string> = ["create", "view", "editPassword", "freeze"];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel | CachingPermissionModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    const UserModelType = this.config.REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PermissionModelType = this.config.REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;

    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
  }

  // >>> Create >>>
  async create(args: type.CreateArgs, _user: TUser | undefined): Promise<{ success: true }> {
    await this.validate(type.CreateArgsSchema, args);

    const hash = await bcrypt.hash(args.password, 3);

    await this.userModel.insertUser(args.email, hash).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    await this.permissionModel.insertPermissions(args.email).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // <<< Create <<<

  // <<< View <<<
  async view(args: type.ViewArgs, user: TUser): Promise<SafeUserObject | {}> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.ViewArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const requestedUser = await this.userModel.getSafeUser(args.email);

    return requestedUser||{};
  }
  // >>> View >>>

  // <<< Edit Password <<<
  async editPassword(args: type.EditPasswordArgs, user: TUser): Promise<{ success: true }> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.EditPasswordArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const newHash = await bcrypt.hash(args.newPassword, 3);

    await this.userModel.changePassword(user.email, newHash);
    await this.redisClient.del(user.email);

    return { success: true };
  }
  // >>> Edit Password >>>

  // <<< Freeze <<<
  async freeze(args: type.FreezeArgs, user: TUser): Promise<{ success: true }> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.FreezeArgsSchema, args);

    await this.userModel.freezeUser(user.email).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // >>> Freeze >>>

  async callEndpoint(
    name: string, args: type.UserRequestArgs, user: TUser | undefined
  ): Promise<CallEndpointReturnType> {
    const userIncludes = this.allowNames.includes(name);
    if (!userIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint user/${name} does not exist`, 404);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: CallEndpointReturnType = await this[name](args, user);

    return result;
  }

  async validate(schema: Joi.ObjectSchema, args: type.UserRequestArgs): Promise<void> {
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

  async abortIfUserDoesntExist(user: TUser | undefined): Promise<void> {
    if (!user) {
      throw new RequestError("MiddlewareError", "User doesn't exist", 404);
    }
  }
}
