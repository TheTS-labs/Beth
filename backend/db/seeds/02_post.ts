import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { Post } from "../models/post";
import { User } from "../models/user";

const seedPosts = 100;

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("post").del();

  const emails = await knex<User>("user").select("email");
  const posts: Pick<Post, "author" | "text" | "tags">[] = [];

  [...Array(seedPosts).keys()].map(async () => {
    const author = emails[Math.floor(Math.random()*emails.length)].email;

    posts.push({
      author,
      text: faker.lorem.sentences(),
      tags: faker.word.words({ count: { min: 5, max: 10 } }).replaceAll(" ", ",")
    });
  });

  await knex("post").insert(posts);
}
