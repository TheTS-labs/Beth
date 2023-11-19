import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { Post } from "../models/post";
import { User } from "../models/user";

const seedPosts = 100;
const batches = Math.ceil(seedPosts / 100);

const generatePosts = (
  length: number,
  emails: Pick<User, "email">[]
): Pick<Post, "author" | "text" | "tags">[] => Array.from({ length }, () => {
  const author = emails[Math.floor(Math.random()*emails.length)].email;

  return {
    author,
    text: faker.lorem.sentences(),
    tags: faker.word.words({ count: { min: 5, max: 10 } }).replaceAll(" ", ",")
  };
});

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("post").del();

  const emails = await knex<User>("user").select("email");

  Array.from({ length: batches }).forEach(async () => {
    await knex("post").insert(generatePosts(seedPosts, emails));
  });
}
