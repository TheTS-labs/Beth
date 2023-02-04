import bcrypt from "bcrypt";
import Joi from "joi";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import { IBaseEndpoint } from "../../common/base_endpoint";
import JoiValidator from "../../common/joi_validator";
import RequestError from "../../common/RequestError";
import { SafeUserObject } from "../../common/types";
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
  async create(args: CreateArgs): Promise<SafeUserObject|never> {
    await this.validate(CreateArgsSchema, args);

    const hash = await bcrypt.hash(args.password, 3);

    const insertResult = await this.model.insertUser(args.email, hash);

    await this.redisClient.set(args.email, JSON.stringify(insertResult));

    return insertResult;
  }
  // <<< Create <<<

  // <<< View <<<
  async view(args: ViewArgs): Promise<SafeUserObject|never> {
    await this.validate(ViewArgsSchema, args);

    const user = await this.model.getUser(args.email);

    return user;
  }
  // >>> View >>>

  // <<< Edit Password <<<
  async editPassword(args: EditPasswordArgs): Promise<SafeUserObject|never> {
    await this.validate(EditPasswordArgsSchema, args);

    const user = await this.model.getUnsafeUser(args.email);

    const compareResult = await bcrypt.compare(args.password, user.password);
    if (!compareResult) { throw new RequestError("AuthError", "Wrong password", 400); }

    const newHash = await bcrypt.hash(args.newPassword, 3);

    const updateResult = await this.model.changePassword(args.email, newHash);
    await this.redisClient.del(args.email);

    return updateResult;
  }
  // >>> Edit Password >>>

  async callEndpoint(name: string, args: UserRequestArgs): Promise<SafeUserObject|never> {
    this.logger.debug(`[UserEndpoint] Incoming Request: ${JSON.stringify(args)}`);

    const userIncludes = this.allowNames.includes(name);

    if (!userIncludes) { throw new RequestError("EndpointNotFound", `Endpoint user/${name} does not exist`, 404); }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result: FunctionResponse = await this[name](args);

    return result;
  }

  async validate(schema: Joi.ObjectSchema, args: UserRequestArgs): Promise<void|never> {
    const validationError = await this.validator.validate(schema, args);

    if (validationError) { throw new RequestError("ValidationError", validationError.message, 400); }
  }
}