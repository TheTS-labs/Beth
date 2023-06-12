import { Knex } from "knex";
import { ScheduledTask } from "node-cron";
import winston from "winston";

import delayedRemoval from "./delayed_removal";

export default class ScheduledTasks {
  constructor(
    private db: Knex,
    private logger: winston.Logger,
    public cronJobs: ScheduledTask[] = []
  ) { }

  start(): void {
    this.cronJobs.push(delayedRemoval(this.db, this.logger));

    this.cronJobs.forEach(async job => {
      job.start();
    });
  }

  stop(): void {
    this.cronJobs.forEach(async job => {
      job.stop();
    });
  }
}