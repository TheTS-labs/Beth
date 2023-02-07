import bcrypt from "bcrypt";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import JoiValidator from "../../common/joi_validator";
import RequestError from "../../common/RequestError";
import { SafeUserObject } from "../../common/types";
import PermissionsModel from "../../db/models/permissions";
import UserModel from "../../db/models/user";
import * as type from "./types";

type CallEndpointReturnType = { success: true }|Record<string, never>|SafeUserObject;

export default class UserEndpoint implements IBaseEndpoint {
  validator: JoiValidator = new JoiValidator();
  allowNames: Array<string> = [
    "create", "view",
    "editPassword",
    "freezeUser"
  ];
  userModel: UserModel;
  permissionsModel: PermissionsModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger
  ) {
    this.userModel = new UserModel(this.db, this.logger);
    this.permissionsModel = new PermissionsModel(this.db, this.logger);
  }

  // >>> Create >>>
  async create(args: type.CreateArgs): Promise<{success: true}|never> {
    await this.validate(type.CreateArgsSchema, args);

    const hash = await bcrypt.hash(args.password, 3);

    await this.userModel.insertUser(args.email, hash).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    await this.permissionsModel.insertPermissions(args.email).catch((err: Error) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return { success: true };
  }
  // <<< Create <<<

  // <<< View <<<
  async view(args: type.ViewArgs): Promise<SafeUserObject|Record<string, never>> {
    await this.validate(type.ViewArgsSchema, args);

    const user = await this.userModel.getUser(args.email, true);

    return user||{};
  }
  // >>> View >>>

  // <<< Edit Password <<<
  async editPassword(args: type.EditPasswordArgs): Promise<{success: true}|never> {
    await this.validate(type.EditPasswordArgsSchema, args);
    await this.abortIfFreezen(args.email);

    const user = await this.userModel.getUser<false>(args.email, false);
    if (!user) { throw new RequestError("DatabaseError", `User with email ${args.email} not found`, 404); }

    const compareResult = await bcrypt.compare(args.password, user.password);
    if (!compareResult) { throw new RequestError("AuthError", "Wrong password", 400); }

    const newHash = await bcrypt.hash(args.newPassword, 3);

    await this.userModel.changePassword(args.email, newHash);
    await this.redisClient.del(args.email);

    return { success: true };
  }
  // >>> Edit Password >>>

  // <<< Freeze <<<
  async freeze(args: type.FreezeArgs): Promise<{success: true}|never> {
    await this.validate(type.FreezeArgsSchema, args);
    await this.abortIfFreezen(args.email);

    const user = await this.userModel.getUser<false>(args.email, false);
    if (!user) { throw new RequestError("DatabaseError", `User with email ${args.email} not found`, 404); }

    const compareResult = await bcrypt.compare(args.password, user.password);
    if (!compareResult) { throw new RequestError("AuthError", "Wrong password", 400); }

    await this.userModel.changeIsFreezeUser(args.email).catch((err: { message: string }) => {
      throw new RequestError("DatabaseError", err.message, 500);
    });

    return {success: true};
  }
  // >>> Freeze >>>

  async callEndpoint(name: string, args: type.UserRequestArgs): Promise<CallEndpointReturnType|never> {
    this.logger.debug(`[UserEndpoint] Incoming Request: ${JSON.stringify(args)}`);

    const userIncludes = this.allowNames.includes(name);

    if (!userIncludes) { throw new RequestError("EndpointNotFound", `Endpoint user/${name} does not exist`, 404); }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: CallEndpointReturnType = await this[name](args);

    return result;
  }

  async validate(schema: Joi.ObjectSchema, args: type.UserRequestArgs): Promise<void|never> {
    const validationError = await this.validator.validate(schema, args);
    if (validationError) { throw new RequestError("ValidationError", validationError.message, 400); }
  }

  async abortIfFreezen(email: string): Promise<void|never> {
    const result = await this.userModel.isFreezen(email);
    if (result) { throw new RequestError("UserIsFreezen", `User(${email}) is freezen`, 403); }
  }
}