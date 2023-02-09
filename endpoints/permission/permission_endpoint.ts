import bcrypt from "bcrypt";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import JoiValidator from "../../common/joi_validator";
import RequestError from "../../common/RequestError";
import PermissionModel, { TPermissions } from "../../db/models/permission";
import UserModel from "../../db/models/user";
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
  async view(args: type.ViewArgs): Promise<TPermissions | Record<string, never>> {
    await this.validate(type.ViewArgsSchema, args);

    const permissions = await this.permissionModel.getPermissions(args.email);

    return permissions || {};
  }
  // >>> View >>>

  // <<< Grant <<<
  async grant(args: type.GrantArgs): Promise<{success: true}|never> {
    await this.validate(type.GrantArgsSchema, args);
    await this.abortIfFreezen(args.email);
    await this.abortIfDontHasPermission(args.email, "canGrant");

    const user = await this.userModel.getUser<false>(args.email, false);
    if (!user) {
      throw new RequestError("DatabaseError", `User with email ${args.email} not found`, 404);
    }

    const compareResult = await bcrypt.compare(args.password, user.password);
    if (!compareResult) {
      throw new RequestError("AuthError", "Wrong password", 400);
    }

    await this.permissionModel.grantPermission(args.grantTo, args.grantPermission).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // >>> Grant >>>

  // <<< Rescind <<<
  async rescind(args: type.RescindArgs): Promise<{success: true}|never> {
    await this.validate(type.RescindArgsSchema, args);
    await this.abortIfFreezen(args.email);
    await this.abortIfDontHasPermission(args.email, "canRescind");

    const user = await this.userModel.getUser<false>(args.email, false);
    if (!user) {
      throw new RequestError("DatabaseError", `User with email ${args.email} not found`, 404);
    }

    const compareResult = await bcrypt.compare(args.password, user.password);
    if (!compareResult) {
      throw new RequestError("AuthError", "Wrong password", 400);
    }

    await this.permissionModel.rescindPermission(args.rescindFrom, args.rescindPermission).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // >>> Rescind >>>

  async callEndpoint(name: string, args: type.PermissionRequestArgs): Promise<CallEndpointReturnType | never> {
    this.logger.debug(`[PermissionEndpoint] Incoming Request: ${JSON.stringify(args)}`);

    const permissionIncludes = this.allowNames.includes(name);

    if (!permissionIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint permission/${name} does not exist`, 404);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: CallEndpointReturnType = await this[name](args);

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

  async abortIfDontHasPermission(email: string, permission: string): Promise<void | never> {
    const permissions = await this.permissionModel.getPermissions(email) as unknown as { [key: string]: 0|1 };
    if (!permissions) {
      throw new RequestError("DatabaseError", `User permissions with email ${email} not found`, 500);
    }

    if (!permissions[permission]) {
      throw new RequestError("PermissionDenied", `You don't have permission: ${permission}`, 403);
    }
  }
}