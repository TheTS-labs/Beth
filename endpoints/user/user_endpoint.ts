import bcrypt from "bcrypt";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import JoiValidator from "../../common/joi_validator";
import RequestError from "../../common/RequestError";
import { EndpointResponse, FunctionResponse, SafeUserObject } from "../../common/types";
import UserModel from "../../db/models/user";
import { CreateArgs, CreateArgsSchema, EditPasswordArgs, EditPasswordArgsSchema, UserRequestArgs, ViewArgs, ViewArgsSchema } from "./types";

export default class UserEndpoint implements IBaseEndpoint {
  validator: JoiValidator = new JoiValidator();
  allowNames: Array<string> = [
    "create", "view",
    "editPassword",
  ];
  model: UserModel;

  constructor(
    public db: Knex,
    public redisClient: RedisClientType,
    public logger: winston.Logger
  ) { this.model = new UserModel(this.db, this.logger); }

  // >>> Create >>>
  async create(args: CreateArgs): Promise<FunctionResponse<SafeUserObject>> {
    const validationError = await this.validate(CreateArgsSchema, args);
    if (!validationError.success) { return validationError; }

    const hash = await bcrypt.hash(args.password, 3);

    const insertResult = await this.model.insertUser(args.email, hash);
    if (!insertResult.success) { return insertResult; }

    await this.redisClient.set(args.email, JSON.stringify(insertResult.result));

    return insertResult;
  }
  // <<< Create <<<

  // <<< View <<<
  async view(args: ViewArgs): Promise<FunctionResponse<SafeUserObject>> {
    const validationError = await this.validate(ViewArgsSchema, args);
    if (!validationError.success) { return validationError; }

    const user = await this.model.getUser(args.email);

    return user;
  }
  // >>> View >>>

  // <<< Edit Password <<<
  async editPassword(args: EditPasswordArgs): Promise<FunctionResponse<SafeUserObject>> {
    const validationError = await this.validate(EditPasswordArgsSchema, args);
    if (!validationError.success) { return validationError; }

    const user = await this.model.getUnsafeUser(args.email);
    if (!user.success) { return user; }

    const compareResult = await bcrypt.compare(args.password, user.result.password);
    if (!compareResult) { return { success: false, result: new RequestError("AuthError", "Wrong password", 400) }; }

    const newHash = await bcrypt.hash(args.newPassword, 3);

    const updateResult = await this.model.changePassword(args.email, newHash);
    if (updateResult.success) { await this.redisClient.del(args.email); }

    return updateResult;
  }
  // >>> Edit Password >>>

  async callEndpoint(name: string, args: UserRequestArgs): Promise<EndpointResponse<SafeUserObject>> {
    this.logger.debug(`[UserEndpoint] Incoming Request: ${JSON.stringify(args)}`);

    const userIncludes = this.allowNames.includes(name);

    if (!userIncludes) {
      const err = new RequestError("EndpointNotFound", `Endpoint user/${name} does not exist`, 404);
      this.logger.error(`[UserEndpoint] ${err.message()}`);
      return err.object();
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: FunctionResponse = await this[name](args);

    if (!result.success) { this.logger.error(`[UserEndpoint] ${result.result.message()}`); return result.result.object(); }

    return result;
  }

  async validate(schema: Joi.ObjectSchema, args: UserRequestArgs): Promise<FunctionResponse<undefined>> {
    const validationError = await this.validator.validate(schema, args);

    if (validationError) {
      return { success: false,
               result: new RequestError("ValidationError", validationError.message, 400) };
    }

    return { success: true, result: undefined };
  }
}