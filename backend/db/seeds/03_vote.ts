import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { Post } from "../models/post";
import { User } from "../models/user";
import { Vote, VoteType } from "../models/vote";

const seedVotes = 100;
const batches = 10;

const generateVotes = (
  length: number,
  users: User[],
  posts: Post[]
): Omit<Vote, "createdAt" | "id">[] => Array.from({ length }, () => {
  const userEmail = users[Math.floor(Math.random()*users.length)].email;
  const postId = posts[Math.floor(Math.random()*posts.length)].id;

  return {
    userEmail,
    postId,
    voteType: faker.datatype.boolean() as unknown as VoteType
  };
});

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("vote").del();

  const users = await knex<User>("user").select();
  const posts = await knex<Post>("post").select();
  
  Array.from({ length: batches }).forEach(async () => {
    await knex("vote").insert(generateVotes(seedVotes, users, posts));
  });
}
