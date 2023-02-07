import { createClient as createRedisClient, RedisClientType } from "redis";
import winston from "winston";

export default class Redis {
  constructor (
    private logger: winston.Logger
  ) {}

  get(): RedisClientType {
    const redisClient: RedisClientType = createRedisClient();
    
    redisClient.on("error", (error) => { this.logger.error(`[redis]: ${error}`); process.exit(1); });
    redisClient.on("ready", () => {
      this.logger.info("[redis]: The client successfully initiated the connection to the server");
    });
    redisClient.on("reconnecting", () => {
      this.logger.warn("[redis]: The client is trying to reconnect to the server...");
    });
    redisClient.on("end", () => {
      this.logger.warn("[redis]: The client disconnected the connection to the server via .quit() or .disconnect()");
    });

    redisClient.connect();

    return redisClient;
  }
}