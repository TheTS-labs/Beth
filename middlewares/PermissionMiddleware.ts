import { NextFunction, Response } from "express";
import { Knex } from "knex";
import { RedisClientType } from "redis";
import winston from "winston";

import RequestError from "../common/RequestError";
import { RequestWithUser } from "../common/types";
import PermissionModel, { TPermissions } from "../db/models/permission";
import { TUser } from "../db/models/user";

type TPermissionsIndex = TPermissions & { [key: string]: 0|1 };
type MiddlewareFunction = (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction) => Promise<void>;

export default class PermissionMiddleware {
  permissionModel: PermissionModel;

  constructor(private logger: winston.Logger, private db: Knex, private redisClient: RedisClientType) {
    this.permissionModel = new PermissionModel(this.db, this.logger);
  }

  public middleware(): MiddlewareFunction {
    return async (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        next();
      }

      const permission = req.originalUrl.replace("/", "").replace("/", "_");
      const permissions = await this.getPermissions(req.user.email) as TPermissionsIndex;
  
      if (!permissions[permission]) {
        throw new RequestError("PermissionDenied", `You don't have permission: ${permission}`, 403);
      }
  
      next();
    };
  }

  private async getPermissions(email: string): Promise<TPermissions> {
    const cachedPermissionsString = await this.redisClient.get(`${email}_permissions`);
    const cachedPermissions: TPermissions|Record<string, never> = JSON.parse(cachedPermissionsString||"{}");

    if (Object.keys(cachedPermissions).length != 0) { return cachedPermissions as TPermissions; }

    const permissions = await this.permissionModel.getPermissions(email);
    if (!permissions) {
      throw new RequestError("DatabaseError", `User permissions with email ${email} not found`, 500);
    }

    await this.redisClient.set(`${email}_permissions`, JSON.stringify(permissions), {
      EX: 60 * 5, // Expires in 5 minutes
      NX: true
    });

    return permissions;
  }
}