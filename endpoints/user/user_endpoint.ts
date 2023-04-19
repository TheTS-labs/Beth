import bcrypt from "bcrypt";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { SafeUserObject } from "../../common/types";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel from "../../db/models/permission";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true } | {} | SafeUserObject;

export default class UserEndpoint extends BaseEndpoint<type.UserRequestArgs, CallEndpointReturnType> {
  allowNames: Array<string> = ["create", "view", "editPassword", "freeze"];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel | CachingPermissionModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    super(db, redisClient, logger, config, "user");
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PermissionModelType = REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;

    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
  }

  async create(args: type.CreateArgs, _user: TUser | undefined): Promise<{ success: true }> {
    args = await this.validate(type.CreateArgsSchema, args);

    const hash = await bcrypt.hash(args.password, 3);

    await this.userModel.insertUser(args.email, hash).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    await this.permissionModel.insertPermissions(args.email).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async view(args: type.ViewArgs, _user: TUser): Promise<SafeUserObject | {}> {
    args = await this.validate(type.ViewArgsSchema, args);

    const requestedUser = await this.userModel.getSafeUser(args.email);

    return requestedUser||{};
  }

  async editPassword(args: type.EditPasswordArgs, user: TUser): Promise<{ success: true }> {
    args = await this.validate(type.EditPasswordArgsSchema, args);

    const newHash = await bcrypt.hash(args.newPassword, 3);

    await this.userModel.changePassword(user.email, newHash);
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    if (REDIS_REQUIRED) {
      await this.redisClient.del(user.email);
    }

    return { success: true };
  }

  async freeze(args: type.FreezeArgs, user: TUser): Promise<{ success: true }> {
    args = await this.validate(type.FreezeArgsSchema, args);

    await this.userModel.freezeUser(user.email).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
}
