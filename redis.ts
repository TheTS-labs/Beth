import { createClient as createRedisClient, RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "./app";

export default class Redis {
  constructor(private logger: winston.Logger, public config: ENV) {}

  get(): RedisClientType {
    const redisClient: RedisClientType = createRedisClient();

    redisClient.on("error", error => {
      this.logger.error({ message: error, path: module.filename });
      process.exit(1);
    });
    redisClient.on("ready", () => {
      this.logger.info({
        message: "The client successfully initiated the connection to the server",
        path: module.filename
      });
    });
    redisClient.on("reconnecting", () => {
      this.logger.warn({ message: "The client is trying to reconnect to the server", path: module.filename });
    });
    redisClient.on("end", () => {
      this.logger.warn({
        message: "The client disconnected the connection to the server via .quit() or .disconnect()",
        path: module.filename
      });
    });

    if (this.config.get("REDIS_REQUIRED").required().asBool()) {
      redisClient.connect();
    }

    return redisClient;
  }
}