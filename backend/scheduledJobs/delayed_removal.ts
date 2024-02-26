import { Knex } from "knex";
import CronJob from "node-cron";
import winston from "winston";

export default function getJob(
  db: Knex,
  logger: winston.Logger,
): CronJob.ScheduledTask {
  return CronJob.schedule("0 0 * * *", async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    logger.log({
      level: "system",
      message: "Deleting posts...",
      path: module.filename,
      context: { softDeletedAt: ["<=", sevenDaysAgo]}
    });

    await db("post").where("softDeletedAt", "<", sevenDaysAgo).del();
  });
}