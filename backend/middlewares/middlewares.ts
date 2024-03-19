import express, { Express } from "express";
import { Knex } from "knex";
import asyncMiddleware from "middleware-async";
import { RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "../app";
import FrozenMiddleware from "./frozen_middleware";
import HeadersMiddleware from "./headers_middleware";
import IdentityMiddleware from "./identity_middleware";
import JWTMiddleware from "./jwt_middleware";
import PermissionMiddleware from "./permission_middleware";

export default class Middlewares {
  private headersMiddleware: HeadersMiddleware;
  private JWTMiddleware: JWTMiddleware;
  private identityMiddleware: IdentityMiddleware;
  private permissionMiddleware: PermissionMiddleware;
  private frozenMiddleware: FrozenMiddleware;

  constructor(
    private logger: winston.Logger,
    private db: Knex,
    private redisClient: RedisClientType,
    private config: ENV
  ) {
    this.headersMiddleware = new HeadersMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.JWTMiddleware = new JWTMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.identityMiddleware = new IdentityMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.permissionMiddleware = new PermissionMiddleware(this.logger, this.db, this.redisClient, this.config);
    this.frozenMiddleware = new FrozenMiddleware(this.logger, this.db, this.redisClient, this.config);
  }

  public applyMiddlewares(app: Express, disableAuthFor: string[]): void {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(asyncMiddleware(this.headersMiddleware.middleware()));
    app.use(this.JWTMiddleware.middleware(disableAuthFor));
    app.use(asyncMiddleware(this.identityMiddleware.middleware()));
    app.use(asyncMiddleware(this.permissionMiddleware.middleware()));
    app.use(asyncMiddleware(this.frozenMiddleware.middleware()));
  }
}