import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { Auth } from "../../common/types";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { Permissions,PermissionStatus } from "../../db/models/permission";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = {} | Permissions | {success: true};

export default class PermissionEndpoint extends BaseEndpoint<type.PermissionRequestArgs, CallEndpointReturnType> {
  allowNames: Array<string> = ["view", "grant", "rescind"];
  permissionModel: PermissionModel;
  userModel: UserModel | CachingUserModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    super(db, redisClient, logger, config, "permission");
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;

    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.permissionModel = new PermissionModel(this.db, this.logger, this.redisClient, this.config);
  }

  async view(args: type.ViewArgs, _auth: Auth): Promise<Permissions> {
    args = await this.validate(type.ViewArgsSchema, args);

    const permissions = await this.permissionModel.read(args.email);
    if (!permissions) {
      throw new RequestError("DatabaseError", [args.email], 1);
    }

    return permissions;
  }
  
  async grant(args: type.GrantArgs, _auth: Auth): Promise<{success: true}|never> {
    args = await this.validate(type.GrantArgsSchema, args);

    await this.permissionModel.update(args.grantTo, {
      [args.grantPermission]: PermissionStatus.Has
    }).catch((err: Error) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return { success: true };
  }

  async rescind(args: type.RescindArgs, _auth: Auth): Promise<{success: true}|never> {
    args = await this.validate(type.RescindArgsSchema, args);

    await this.permissionModel.update(args.rescindFrom, {
      [args.rescindPermission]: PermissionStatus.Hasnt
    }).catch((err: Error) => {
      throw new RequestError("DatabaseError", [err.message]);
    });

    return { success: true };
  }
}