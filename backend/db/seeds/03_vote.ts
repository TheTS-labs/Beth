import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { TPost } from "../models/post";
import { TUser } from "../models/user";
import { TVote, Vote } from "../models/vote";

const seedVotes = 100;

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("vote").del();

  const emails = await knex<TUser>("user").select("email");
  const postIds = await knex<TPost>("post").select("id");
  const votes: Omit<TVote, "createdAt" | "id">[] = [];

  [...Array(seedVotes).keys()].map(async () => {
    const userEmail = emails[Math.floor(Math.random()*emails.length)].email;
    const postId = postIds[Math.floor(Math.random()*postIds.length)].id;

    votes.push({
      userEmail,
      postId,
      voteType: faker.datatype.boolean() as unknown as Vote
    });
  });

  await knex("vote").insert(votes);
}
