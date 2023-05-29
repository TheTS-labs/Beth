import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("post").del();

  // Inserts seed entries
  await knex("post").insert([
    { author: "hikoza@optonline.net", text: "(1)I am hikoza@optonline.net" },
    { author: "hikoza@optonline.net", text: "(2)I am hikoza@optonline.net", repliesTo: 1, parent: 1 },
    { author: "hikoza@optonline.net", text: "(3)I am hikoza@optonline.net", repliesTo: 2, parent: 1 },
    
    { author: "muzzy@optonline.net", text: "(1)I am muzzy@optonline.net" },
    { author: "muzzy@optonline.net", text: "(2)I am muzzy@optonline.net", repliesTo: 4, parent: 4 },
    { author: "muzzy@optonline.net", text: "(3)I am muzzy@optonline.net", repliesTo: 5, parent: 4 },
    
    { author: "gordonjcp@optonline.net", text: "(1)I am gordonjcp@optonline.net" },
    { author: "gordonjcp@optonline.net", text: "(2)I am gordonjcp@optonline.net", repliesTo: 4, parent: 4 },
    { author: "gordonjcp@optonline.net", text: "(3)I am gordonjcp@optonline.net", repliesTo: 4, parent: 4 }
  ]);
}
