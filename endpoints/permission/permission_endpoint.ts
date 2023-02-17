import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import RequestError from "../../common/RequestError";
import PermissionModel, { TPermissions } from "../../db/models/permission";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = {} | TPermissions | {success: true};

export default class PermissionEndpoint implements IBaseEndpoint {
  allowNames: Array<string> = ["view", "grant", "rescind"];
  permissionModel: PermissionModel;
  userModel: UserModel;

  constructor(public db: Knex, public redisClient: RedisClientType, public logger: winston.Logger) {
    this.permissionModel = new PermissionModel(this.db, this.logger);
    this.userModel = new UserModel(this.db, this.logger);
  }

  // <<< View <<<
  async view(args: type.ViewArgs, user: TUser): Promise<TPermissions | {}> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.ViewArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const permissions = await this.getPermissions(args.email);

    return permissions;
  }
  // >>> View >>>

  // <<< Grant <<<
  async grant(args: type.GrantArgs, user: TUser): Promise<{success: true}|never> {
    await this.abortIfUserDoesntExist(user);
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
    await this.abortIfUserDoesntExist(user);
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
    this.logger.debug(`[PermissionEndpoint] Incoming Request: ${JSON.stringify(args)}`);

    const permissionIncludes = this.allowNames.includes(name);

    if (!permissionIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint permission/${name} does not exist`, 404);
    }

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

  async abortIfUserDoesntExist(user: TUser | undefined): Promise<void> {
    if (!user) {
      throw new RequestError("MiddlewareError", "User doesn't exist", 404);
    }
  }

  private async getPermissions(email: string): Promise<TPermissions | {}> {
    this.logger.debug("[PermissionEndpoint] Getting user permissions from cache...");
    const cachedPermissionsString = await this.redisClient.get(`${email}_permissions`);
    const cachedPermissions: TPermissions|{} = JSON.parse(cachedPermissionsString||"{}");

    this.logger.debug(`[PermissionEndpoint] Cached?: ${cachedPermissionsString}`);

    if (Object.keys(cachedPermissions).length != 0) { return cachedPermissions as TPermissions; }

    this.logger.debug("[PermissionEndpoint] Getting user permissions...");
    const permissions = await this.permissionModel.getPermissions(email);
    if (!permissions) {
      return {};
    }

    this.logger.debug("[PermissionEndpoint] Caching user permissions...");
    await this.redisClient.set(`${email}_permissions`, JSON.stringify(permissions), {
      EX: 60 * 5, // Expires in 5 minutes
      NX: true
    });

    return permissions;
  }
}