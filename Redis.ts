import { createClient as createRedisClient, RedisClientType } from "redis";
import winston from "winston";

export default async (logger: winston.Logger): Promise<RedisClientType> => {
  const redisClient: RedisClientType = createRedisClient();
  redisClient.on("error", (error) => { logger.error(`[redis]: ${error}`); process.exit(1); });
  redisClient.on("ready", () => { logger.info("[redis]: The client successfully initiated the connection to the server"); });
  redisClient.on("reconnecting", () => { logger.warn("[redis]: The client is trying to reconnect to the server..."); });
  redisClient.on("end", () => { logger.warn("[redis]: The client disconnected the connection to the server via .quit() or .disconnect()"); });
  await redisClient.connect();

  return redisClient;
};