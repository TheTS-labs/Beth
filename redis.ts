import { createClient as createRedisClient, RedisClientType } from "redis";
import winston from "winston";

import { ENV } from "./app";

export default class Redis {
  constructor(private logger: winston.Logger, public config: ENV) {}

  get(): RedisClientType {
    const redisClient: RedisClientType = createRedisClient();

    redisClient.on("error", error => {
      this.logger.error(`[Redis] ${error}`);
      process.exit(1);
    });
    redisClient.on("ready", () => {
      this.logger.info("[Redis] The client successfully initiated the connection to the server");
    });
    redisClient.on("reconnecting", () => {
      this.logger.warn("[Redis] The client is trying to reconnect to the server");
    });
    redisClient.on("end", () => {
      this.logger.warn("[Redis] The client disconnected the connection to the server via .quit() or .disconnect()");
    });

    if (this.config.get("REDIS_REQUIRED").required().asBool()) {
      redisClient.connect();
    }

    return redisClient;
  }
}