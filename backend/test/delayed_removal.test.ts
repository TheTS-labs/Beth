import * as env from "env-var";
import knex from "knex";
import CronJob from "node-cron";

import { Post } from "../db/models/post";
import knexfile from "../knexfile";
import Logger from "../logger";
import getJob from "../scheduledJobs/delayed_removal";

const logger = new Logger().get(env.get("TEST_LOG_LEVEL").required().asString());
const db = knex(knexfile["test"]);

jest.mock("node-cron", () => {
  return { schedule: jest.fn().mockImplementation(async (_, callback) => await callback()) };
});

beforeEach(async () => { await db("post").del(); });

describe("General tests", () => {
  it("should delete post", async () => {
    const id = (await db<Post>("post").insert({
      author: "dont@matter.com",
      text: "112",
      //                              Days
      //       No need to thank       ↓
      softDeletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    }, "id"))[0].id;

    getJob(db, logger);
    expect(CronJob.schedule).toBeCalledWith("0 0 * * *", expect.any(Function));

    const post = await db<Post>("post").where({ id }).first();
    expect(post).toBeUndefined();
  });

  it("shouldn't delete post", async () => {
    const id = (await db<Post>("post").insert({
      author: "dont@matter.com",
      text: "112",
      //                              Days
      //       No need to thank       ↓
      softDeletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }, "id"))[0].id;

    getJob(db, logger);
    expect(CronJob.schedule).toBeCalledWith("0 0 * * *", expect.any(Function));

    const post = await db<Post>("post").where({ id }).first();
    expect(post).not.toBeUndefined();
  });
});