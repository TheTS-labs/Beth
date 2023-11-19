import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { Post } from "../models/post";
import { User } from "../models/user";
import { Vote, VoteType } from "../models/vote";

const seedVotes = 1000;
const batches = Math.ceil(seedVotes / 100);

const generateVotes = (
  length: number,
  emails: Pick<User, "email">[],
  postIds: Pick<Post, "id">[]
): Omit<Vote, "createdAt" | "id">[] => Array.from({ length }, () => {
  const userEmail = emails[Math.floor(Math.random()*emails.length)].email;
  const postId = postIds[Math.floor(Math.random()*postIds.length)].id;

  return {
    userEmail,
    postId,
    voteType: faker.datatype.boolean() as unknown as VoteType
  };
});

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("vote").del();

  const emails = await knex<User>("user").select("email");
  const postIds = await knex<Post>("post").select("id");

  Array.from({ length: batches }).forEach(async () => {
    await knex("vote").insert(generateVotes(seedVotes, emails, postIds));
  });
}
