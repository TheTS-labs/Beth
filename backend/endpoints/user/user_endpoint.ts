import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { Auth,SafeUserObject } from "../../common/types";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { PermissionStatus, TPermissions } from "../../db/models/permission";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true } | {} | SafeUserObject | { token: string };

export default class UserEndpoint extends BaseEndpoint<type.UserRequestArgs, CallEndpointReturnType> {
  allowNames: Array<string> = [
    "create", "view", "editPassword",
    "froze", "editTags", "verify"
  ];
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

  async create(args: type.CreateArgs, _auth: Auth | undefined): Promise<CallEndpointReturnType> {
    args = await this.validate(type.CreateArgsSchema, args);

    const hash = await bcrypt.hash(args.password, 3);

    await this.userModel.insertUser(args.username, args.displayName, args.email, hash).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    await this.permissionModel.insertPermissions(args.email).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async view(args: type.ViewArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewArgsSchema, args);

    const requestedUser = await this.userModel.getSafeUser(args.id);

    return requestedUser || {};
  }

  async editPassword(args: type.EditPasswordArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditPasswordArgsSchema, args);

    const newHash = await bcrypt.hash(args.newPassword, 3);

    await this.userModel.changePassword(auth.user.email, newHash);
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    if (REDIS_REQUIRED) {
      await this.redisClient.del(auth.user.email);
    }

    return { success: true };
  }

  async froze(args: type.FrozeArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.FrozeArgsSchema, args);

    const permissions = await this.permissionModel.getPermissions(auth.user.email) as TPermissions;

    if (args.id != auth.user.id && permissions["UserSuperFroze"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", "You can froze only yourself", 403);
    }

    await this.userModel.frozeUser(args.id, args.froze).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async editTags(args: type.EditTagsArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditTagsArgsSchema, args);

    const requestedUser = await this.userModel.getSafeUser(args.id);
    if (!requestedUser) {
      throw new RequestError("DatabaseError", "User doesn't exist", 404);
    }

    await this.userModel.editTags(args.id, args.newTags).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async verify(args: type.VerifyArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.VerifyArgsSchema, args);

    const requestedUser = await this.userModel.getSafeUser(args.id);
    if (!requestedUser) {
      throw new RequestError("DatabaseError", "User doesn't exist", 404);
    }

    await this.userModel.verifyUser(args.id, args.verify).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  // async issueToken(args: type.IssueTokenArgs, auth: Auth): Promise<CallEndpointReturnType> {
  //   args = await this.validate(type.IssueTokenArgsSchema, args);

  //   const hash = await bcrypt.hash(args.password, 3);

  //   if (hash != auth.user.password) {
  //     throw new RequestError("AuthError", "Wrong password or email", 403);
  //   }

  //   jwt.sign({
  //     data: "foobar"
  //   }, "secret", { expiresIn: "1h" });

  //   return { token: "" };
  // }
}
