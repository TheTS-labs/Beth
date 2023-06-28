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
import TokenModel from "../../db/models/token";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true } | {} | SafeUserObject | { token: string };
type TPermissionsWithKey = TPermissions & { [key: string]: PermissionStatus | undefined };

export default class UserEndpoint extends BaseEndpoint<type.UserRequestArgs, CallEndpointReturnType> {
  allowNames: Array<string> = [
    "create", "view", "editPassword",
    "froze", "editTags", "verify",
    "issueToken"
  ];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel | CachingPermissionModel;
  tokenModel: TokenModel;

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
    this.tokenModel = new TokenModel(this.db, this.logger, this.redisClient, this.config);
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

    const requestedUser = await this.userModel.getSafeUser(args.email);

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

    if (args.email != auth.user.email && permissions["UserSuperFroze"] == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", "You can froze only yourself", 403);
    }

    await this.userModel.frozeUser(args.email, args.froze).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async editTags(args: type.EditTagsArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditTagsArgsSchema, args);

    const requestedUser = await this.userModel.getSafeUser(args.email);
    if (!requestedUser) {
      throw new RequestError("DatabaseError", "User doesn't exist", 404);
    }

    await this.userModel.editTags(args.email, args.newTags).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async verify(args: type.VerifyArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.VerifyArgsSchema, args);

    const requestedUser = await this.userModel.getSafeUser(args.email);
    if (!requestedUser) {
      throw new RequestError("DatabaseError", "User doesn't exist", 404);
    }

    await this.userModel.verifyUser(args.email, args.verify).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async issueToken(args: type.IssueTokenArgs, _auth: undefined): Promise<CallEndpointReturnType> {
    args = await this.validate(type.IssueTokenArgsSchema, args);
    const user = await this.userModel.getUnsafeUser(args.email);

    // TODO: Scope shorthands

    if (!user) {
      throw new RequestError("DatabaseError", "User doesn't exist", 404);
    }

    if (user.isFrozen) {
      throw new RequestError("UserIsFrozen", `User(${user.email}) is frozen`, 403);
    }

    const hash = await bcrypt.compare(args.password, user.password);
    if (!hash) {
      throw new RequestError("AuthError", "Wrong password or email", 403);
    }

    const permission = await this.permissionModel.getPermissions(user.email) as TPermissionsWithKey;
    if (!permission) {
      throw new RequestError("DatabaseError", "Permissions doesn't exist", 500);
    }

    args.scope.forEach(scope => {
      if (!permission[scope]) {
        throw new RequestError(
          "PermissionError",
          `You don't have permission ${scope} to issue the token with given scope`,
          403
        );
      }
    });

    const tokenId = await this.tokenModel.issue(user.email, JSON.stringify(args.scope))
                                         .catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    const token = jwt.sign({
      tokenId,
      scope: args.scope
    }, this.config.get("JWT_TOKEN_SECRET").required().asString(), { expiresIn: args.expiresIn });

    return { tokenId, token };
  }
}
