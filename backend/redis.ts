import { createClient as createRedisClient, RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "./app";

export default class Redis {
  constructor(private logger: winston.Logger, public config: ENV) {}

  get(): RedisClientType {
    const redisClient: RedisClientType = createRedisClient();

    redisClient.on("error", error => {
      this.logger.error({ message: error, path: module.filename });
      // Perhaps the Redis server is unavailable?
      process.exit(1);
    });
    redisClient.on("ready", () => {
      this.logger.log({
        level: "system",
        message: "The Redis client successfully initiated the connection to the server",
        path: module.filename
      });
    });
    redisClient.on("reconnecting", () => {
      this.logger.warn({
        level: "system",
        message: "The Redis client is trying to reconnect to the server",
        path: module.filename
      });
    });
    redisClient.on("end", () => {
      this.logger.log({
        level: "fail",
        message: "The Redis client disconnected the connection to the server via .quit() or .disconnect()",
        path: module.filename
      });
    });

    const redisRequired = this.config.get("REDIS_REQUIRED").required().asBool();
    if (redisRequired) {
      redisClient.connect();
    }

    return redisClient;
  }
}