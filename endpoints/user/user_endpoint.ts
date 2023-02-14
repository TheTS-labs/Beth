import bcrypt from "bcrypt";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import JoiValidator from "../../common/joi_validator";
import RequestError from "../../common/RequestError";
import { SafeUserObject } from "../../common/types";
import PermissionModel from "../../db/models/permission";
import UserModel, { TUser } from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true } | Record<string, never> | SafeUserObject;

export default class UserEndpoint implements IBaseEndpoint {
  validator: JoiValidator = new JoiValidator();
  allowNames: Array<string> = ["create", "view", "editPassword", "freeze"];
  userModel: UserModel;
  permissionModel: PermissionModel;

  constructor(public db: Knex, public redisClient: RedisClientType, public logger: winston.Logger) {
    this.userModel = new UserModel(this.db, this.logger);
    this.permissionModel = new PermissionModel(this.db, this.logger);
  }

  // >>> Create >>>
  async create(args: type.CreateArgs, _user: TUser | undefined): Promise<{ success: true } | never> {
    await this.validate(type.CreateArgsSchema, args);

    const hash = await bcrypt.hash(args.password, 3);

    await this.userModel.insertUser(args.email, hash).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    await this.permissionModel.insertPermissions(args.email).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // <<< Create <<<

  // <<< View <<<
  async view(args: type.ViewArgs, user: TUser): Promise<SafeUserObject | Record<string, never>> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.ViewArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const requestedUser = await this.getUser(args.email);

    return requestedUser;
  }
  // >>> View >>>

  // <<< Edit Password <<<
  async editPassword(args: type.EditPasswordArgs, user: TUser): Promise<{ success: true } | never> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.EditPasswordArgsSchema, args);
    await this.abortIfFreezen(user.email);

    const newHash = await bcrypt.hash(args.newPassword, 3);

    await this.userModel.changePassword(user.email, newHash);
    await this.redisClient.del(user.email);

    return { success: true };
  }
  // >>> Edit Password >>>

  // <<< Freeze <<<
  async freeze(args: type.FreezeArgs, user: TUser): Promise<{ success: true } | never> {
    await this.abortIfUserDoesntExist(user);
    await this.validate(type.FreezeArgsSchema, args);

    await this.userModel.changeIsFreezeUser(user.email).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // >>> Freeze >>>

  async callEndpoint(
    name: string, args: type.UserRequestArgs, user: TUser | undefined
  ): Promise<CallEndpointReturnType | never> {
    this.logger.debug(`[UserEndpoint] Incoming Request: ${JSON.stringify(args)}`);

    const userIncludes = this.allowNames.includes(name);
    if (!userIncludes) {
      throw new RequestError("EndpointNotFound", `Endpoint user/${name} does not exist`, 404);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: CallEndpointReturnType = await this[name](args, user);

    return result;
  }

  async validate(schema: Joi.ObjectSchema, args: type.UserRequestArgs): Promise<void | never> {
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

  async getUser(email: string): Promise<SafeUserObject | Record<string, never>> {
    this.logger.debug("[UserEndpoint] Getting user from cache...");
    const cachedUserString = await this.redisClient.get(`${email}_safe`);
    const cachedUser: SafeUserObject|Record<string, never> = JSON.parse(cachedUserString||"{}");

    this.logger.debug(`[UserEndpoint] Cached?: ${cachedUserString}`);

    if (Object.keys(cachedUser).length != 0) { return cachedUser as SafeUserObject; }

    this.logger.debug("[UserEndpoint] Getting user...");
    const user = await this.userModel.getUser(email, true);
    if (!user) {
      return {};
    }

    this.logger.debug("[UserEndpoint] Caching user...");
    await this.redisClient.set(`${email}_safe`, JSON.stringify(user), {
      EX: 60 * 10, // Expires in 10 minutes
      NX: true
    });

    return user;
  }
}
