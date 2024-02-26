import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { Post } from "../models/post";
import { User } from "../models/user";
import { Vote, VoteType } from "../models/vote";

const seedVotes = 1000;

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("vote").del();

  const emails = await knex<User>("user").select("email");
  const postIds = await knex<Post>("post").select("id");
  const votes: Omit<Vote, "createdAt" | "id">[] = [];

  [...Array(seedVotes).keys()].map(async () => {
    const userEmail = emails[Math.floor(Math.random()*emails.length)].email;
    const postId = postIds[Math.floor(Math.random()*postIds.length)].id;

    votes.push({
      userEmail,
      postId,
      voteType: faker.datatype.boolean() as unknown as VoteType
    });
  });

  await knex("vote").insert(votes);
}
