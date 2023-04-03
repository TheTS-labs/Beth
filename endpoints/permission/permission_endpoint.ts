import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../../app";
import { IBaseEndpoint } from "../../common/base_endpoint";
import RequestError from "../../common/request_error";
import CachingPermissionModel from "../../db/models/caching/caching_permission";
import CachingUserModel from "../../db/models/caching/caching_user";
import PermissionModel, { TPermissions } from "../../db/models/permission";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = {} | TPermissions | {success: true};

export default class PermissionEndpoint implements IBaseEndpoint {
  allowNames: Array<string> = ["view", "grant", "rescind"];
  permissionModel: PermissionModel | CachingPermissionModel;
  userModel: UserModel | CachingUserModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger,
    public config: ENV
  ) {
    const REDIS_REQUIRED = this.config.get("REDIS_REQUIRED").required().asBool();
    const UserModelType = REDIS_REQUIRED ? CachingUserModel : UserModel;
    const PermissionModelType = REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;

    this.userModel = new UserModelType(this.db, this.logger, this.redisClient, this.config);
    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
  }

  // <<< View <<<
  async view(args: type.ViewArgs, user: TUser): Promise<TPermissions> {
    await this.validate(type.ViewArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const permissions = await this.permissionModel.getPermissions(args.email);
    if (!permissions) {
      throw new RequestError("DatabaseError", `User permissions with email ${args.email} not found`, 500);
    }

    return permissions;
  }
  // >>> View >>>

  // <<< Grant <<<
  async grant(args: type.GrantArgs, user: TUser): Promise<{success: true}|never> {
    await this.validate(type.GrantArgsSchema, args);
    await this.abortIfFreezen(user.email);

    await this.permissionModel.grantPermission(args.grantTo, args.grantPermission).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // >>> Grant >>>

  // <<< Rescind <<<
  async rescind(args: type.RescindArgs, user: TUser): Promise<{success: true}|never> {
    await this.validate(type.RescindArgsSchema, args);
    await this.abortIfFreezen(user.email);

    await this.permissionModel.rescindPermission(args.rescindFrom, args.rescindPermission).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // >>> Rescind >>>

  async callEndpoint(
    name: string, args: type.PermissionRequestArgs, user: TUser | undefined
  ): Promise<CallEndpointReturnType> {
    const permissionIncludes = this.allowNames.includes(name);
    if (!permissionIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint permission/${name} does not exist`, 404);
    }

    // Element implicitly has an 'any' type
    // because expression of type 'string' can't be used to index type 'PermissionEndpoint'.
    // No index signature with a parameter of type 'string' was found on type 'PermissionEndpoint'.
    // But it actually can be used
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: CallEndpointReturnType = await this[name](args, user);

    return result;
  }

  async validate(schema: Joi.ObjectSchema, args: type.PermissionRequestArgs): Promise<void> {
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