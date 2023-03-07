import { Knex } from "knex";
import winston from "winston";

import delayedRemoval from "./delayed_removal";

export default async function initScheduledJobs(
  db: Knex,
  logger: winston.Logger
): Promise<void> {
  delayedRemoval(db, logger).start();
}