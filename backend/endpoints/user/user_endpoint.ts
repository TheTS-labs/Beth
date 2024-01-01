import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import scopes from "../../common/scopes";
import { Auth, SafeUserObject } from "../../common/types";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { Permissions, PermissionStatus } from "../../db/models/permission";
import TokenModel from "../../db/models/token";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true } | {} | SafeUserObject | { token: string };

export default class UserEndpoint extends BaseEndpoint<type.UserRequestArgs, CallEndpointReturnType> {
  allowNames: Array<string> = [
    "create", "view", "edit",
    "froze", "editTags", "verify",
    "issueToken", "superView"
  ];
  userModel: UserModel | CachingUserModel;
  permissionModel: PermissionModel;
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

    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.permissionModel = new PermissionModel(this.db, this.logger, this.redisClient, this.config);
    this.tokenModel = new TokenModel(this.db, this.logger, this.redisClient, this.config);
  }

  async create(args: type.CreateArgs, _auth: Auth | undefined): Promise<CallEndpointReturnType> {
    args = await this.validate(type.CreateArgsSchema, args);

    const hash = await bcrypt.hash(args.password, 3);

    await this.userModel.create({
      username: args.username,
      displayName: args.displayName,
      email: args.email,
      password: hash
    }).catch((err: Error) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    await this.permissionModel.create({ email: args.email }).catch((err: Error) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return { success: true };
  }

  async view(args: type.ViewArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewArgsSchema, args);

    const requestedUser = await this.userModel.read(args.email);

    return requestedUser || {};
  }

  async superView(args: type.ViewArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.ViewArgsSchema, args);

    const requestedUser = await this.userModel.read(args.email, [
      "id",
      "username",
      "displayName",
      "isFrozen",
      "tags",
      "verified"
    ]);

    return requestedUser || {};
  }

  async edit(args: type.EditArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditArgsSchema, args);
    const hash = await bcrypt.compare(args.password, auth.user.password);

    if (!hash) {
      throw new RequestError("AuthError");
    }

    if (args.edit.password) {
      const newHash = await bcrypt.hash(args.edit.password, 3);
      args.edit.password = newHash;
    }

    await this.userModel.update(auth.user.email, args.edit);

    return { success: true };
  }

  async froze(args: type.FrozeArgs, auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.FrozeArgsSchema, args);
    args.email = args.email || auth.user.email;

    const permissions = await this.permissionModel.read(auth.user.email) as Permissions;

    if (args.email != auth.user.email && permissions.UserSuperFroze == PermissionStatus.Hasnt) {
      throw new RequestError("PermissionError", [""], 3);
    }

    await this.userModel.update(args.email, { isFrozen: args.froze }).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return { success: true };
  }

  async editTags(args: type.EditTagsArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.EditTagsArgsSchema, args);

    const requestedUser = await this.userModel.read(args.email);
    if (!requestedUser) {
      throw new RequestError("DatabaseError", [""], 3);
    }

    await this.userModel.update(args.email, { tags: args.newTags }).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return { success: true };
  }

  async verify(args: type.VerifyArgs, _auth: Auth): Promise<CallEndpointReturnType> {
    args = await this.validate(type.VerifyArgsSchema, args);

    const requestedUser = await this.userModel.read(args.email);
    if (!requestedUser) {
      throw new RequestError("DatabaseError", [""], 3);
    }

    await this.userModel.update(args.email, { verified: args.verify }).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return { success: true };
  }

  async issueToken(args: type.IssueTokenArgs, _auth: undefined): Promise<CallEndpointReturnType> {
    args = await this.validate(type.IssueTokenArgsSchema, args);
    const user = await this.userModel.read(args.email, "*");

    if (!user) {
      throw new RequestError("DatabaseError", [""], 3);
    }

    if (user.isFrozen) {
      throw new RequestError("UserIsFrozen", [user.email]);
    }

    const hash = await bcrypt.compare(args.password, user.password);
    if (!hash) {
      throw new RequestError("AuthError");
    }

    const permission = await this.permissionModel.read(user.email) ;
    if (!permission) {
      throw new RequestError("DatabaseError", [user.email], 1);
    }

    const scope = args.scope || scopes[args.shorthand];
    scope.forEach(exactScope => {
      if (!permission[exactScope]) {
        throw new RequestError("PermissionError", [exactScope], 4);
      }
    });

    const tokenId = await this.tokenModel.create({ owner: user.email, scope: JSON.stringify(scope) })
                                         .catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    const token = jwt.sign({
      tokenId,
      scope,
      email: user.email
    }, this.config.get("JWT_TOKEN_SECRET").required().asString(), { expiresIn: args.expiresIn });

    return { tokenId, token };
  }
}
