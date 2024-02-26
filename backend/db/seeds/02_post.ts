import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { Post } from "../models/post";
import { User } from "../models/user";

const seedPosts = 100;
const batches = 2;

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

  // Used for testing purposes
  await knex<Pick<Post, "author" | "text" | "tags">>("post").insert({
    author: "admin@example.com",
    //               This is used to find this post on the page. It should be unique     
    //                                     ↓↓↓↓↓↓↓↓
    text: "Text used for testing purposes. 953ea058",
    tags: "testingonly,testingtag"
  });

  const emails = await knex<User>("user").select("email");

  Array.from({ length: batches }).forEach(async () => {
    await knex("post").insert(generatePosts(seedPosts, emails));
  });
}
