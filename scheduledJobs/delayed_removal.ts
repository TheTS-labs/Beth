import { Knex } from "knex";
import CronJob from "node-cron";
import winston from "winston";

import { TPost } from "../db/models/post";

export default function getJob(
  db: Knex,
  logger: winston.Logger,
): CronJob.ScheduledTask {
  return CronJob.schedule("0 0 * * */1", async () => {
    const sevenDaysAgo: number = Date.now() - 7 * 24 * 60 * 60 * 1000;

    logger.info(`[DelayedRemoval] Deleting posts(freezenAt <= ${sevenDaysAgo})`);

    await db<TPost>("post").where("freezenAt", "<=", sevenDaysAgo).del();
  });
}