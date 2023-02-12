import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import JoiValidator from "../../common/joi_validator";
import RequestError from "../../common/RequestError";
import PermissionModel, { TPermissions } from "../../db/models/permission";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = Record<string, never> | TPermissions | {success: true};

export default class PermissionEndpoint implements IBaseEndpoint {
  validator: JoiValidator = new JoiValidator();
  allowNames: Array<string> = ["view", "grant", "rescind"];
  permissionModel: PermissionModel;
  userModel: UserModel;

  constructor(public db: Knex, public redisClient: RedisClientType, public logger: winston.Logger) {
    this.permissionModel = new PermissionModel(this.db, this.logger);
    this.userModel = new UserModel(this.db, this.logger);
  }

  // <<< View <<<
  async view(args: type.ViewArgs, user: TUser): Promise<TPermissions | Record<string, never>> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.ViewArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const permissions = await this.permissionModel.getPermissions(args.email);

    return permissions || {};
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
  ): Promise<CallEndpointReturnType | never> {
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

  async validate(schema: Joi.ObjectSchema, args: type.PermissionRequestArgs): Promise<void | never> {
    const validationError = await this.validator.validate(schema, args);
    if (validationError) {
      throw new RequestError("ValidationError", validationError.message, 400);
    }
  }

  async abortIfFreezen(email: string): Promise<void | never> {
    const result = await this.userModel.isFreezen(email);
    if (result) {
      throw new RequestError("UserIsFreezen", `User(${email}) is freezen`, 403);
    }
  }

  async abortIfUserDoesntExist(user: TUser | undefined): Promise<void | never> {
    if (!user) {
      throw new RequestError("MiddlewareError", "User doesn't exist", 404);
    }
  }
}