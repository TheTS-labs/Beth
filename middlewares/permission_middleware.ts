import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import RequestError from "../common/request_error";
import { RequestWithUser } from "../common/types";
import ENV from "../config";
import CachingPermissionModel from "../db/models/caching/caching_permission";
import PermissionModel, { TPermissions } from "../db/models/permission";
import { TUser } from "../db/models/user";

type TPermissionsIndex = TPermissions & { [key: string]: 0|1 };
type MiddlewareFunction = (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction) => Promise<void>;

export default class PermissionMiddleware {
  permissionModel: PermissionModel | CachingPermissionModel;

  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) {
    const PermissionModelType = this.config.REDIS_REQUIRED ? CachingPermissionModel : PermissionModel;

    this.permissionModel = new PermissionModelType(this.db, this.logger, this.redisClient, this.config);
  }

  public middleware(): MiddlewareFunction {
    return async (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        this.logger.debug("[PermissionMiddleware] Excluded path. Skip");
        next();
      }

      const permission = req.originalUrl.replace("/", "").replaceAll("/", "_");
      this.logger.debug(`[PermissionMiddleware] Checking for ${permission} permission`);
      const permissions = await this.permissionModel.getPermissions(req.user.email) as TPermissionsIndex;
  
      if (!permissions[permission]) {
        throw new RequestError("PermissionDenied", `You don't have permission: ${permission}`, 403);
      }
  
      next();
    };
  }
}