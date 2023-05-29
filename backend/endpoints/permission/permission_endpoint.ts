import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import BaseEndpoint from "../../common/base_endpoint_class";
import RequestError from "../../common/request_error";
import { EndpointThisType } from "../../common/types";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { TPermissions } from "../../db/models/permission";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = {} | TPermissions | {success: true};

export default class PermissionEndpoint extends BaseEndpoint<type.PermissionRequestArgs, CallEndpointReturnType> {
  allowNames: Array<string> = ["view", "grant", "rescind"];
  permissionModel: PermissionModel | CachingPermissionModel;
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
    const PermissionModelType = REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;

    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
  }

  async view(args: type.ViewArgs, _user: TUser): Promise<TPermissions> {
    args = await this.validate(type.ViewArgsSchema, args);

    const permissions = await this.permissionModel.getPermissions(args.email);
    if (!permissions) {
      throw new RequestError("DatabaseError", `User permissions with email ${args.email} not found`, 500);
    }

    return permissions;
  }
  
  async grant(args: type.GrantArgs, _user: TUser): Promise<{success: true}|never> {
    args = await this.validate(type.GrantArgsSchema, args);

    await this.permissionModel.grantPermission(args.grantTo, args.grantPermission).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }

  async rescind(args: type.RescindArgs, _user: TUser): Promise<{success: true}|never> {
    args = await this.validate(type.RescindArgsSchema, args);

    await this.permissionModel.rescindPermission(args.rescindFrom, args.rescindPermission).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
}