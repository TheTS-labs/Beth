import { NextFunction, Response } from "express";
import { Knex } from "knex";
import winston from "winston";

import RequestError from "../common/RequestError";
import { RequestWithUser } from "../common/types";
import PermissionModel, { TPermissions } from "../db/models/permission";
import { TUser } from "../db/models/user";

type TPermissionsIndex = TPermissions & { [key: string]: 0|1 };
type MiddlewareFunction = (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction) => Promise<void>;

export default class PermissionMiddleware {
  permissionModel: PermissionModel;

  constructor(private logger: winston.Logger, private db: Knex) {
    this.permissionModel = new PermissionModel(this.db, this.logger);
  }

  public middleware = (): MiddlewareFunction => {
    return async (req: RequestWithUser & { user: TUser }, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        next();
      }

      const permission = req.originalUrl.replace("/", "").replace("/", "_");
      const permissions = await this.permissionModel.getPermissions(req.user.email) as TPermissionsIndex|undefined;
    
      if (!permissions) {
        throw new RequestError("DatabaseError", `User permissions with email ${req.user.email} not found`, 500);
      }
  
      if (!permissions[permission]) {
        throw new RequestError("PermissionDenied", `You don't have permission: ${permission}`, 403);
      }
  
      next();
    };
  };
}