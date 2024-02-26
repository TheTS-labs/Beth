import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("post").del();

  // Inserts seed entries
  await knex("post").insert([
    { id: 1, author: "hikoza@optonline.net", text: "(1)I am hikoza@optonline.net" },
    { id: 2, author: "hikoza@optonline.net", text: "(2)I am hikoza@optonline.net", repliesTo: 1, parent: 1 },
    { id: 3, author: "hikoza@optonline.net", text: "(3)I am hikoza@optonline.net", repliesTo: 2, parent: 1 },
    
    { id: 4, author: "muzzy@optonline.net", text: "(1)I am muzzy@optonline.net" },
    { id: 5, author: "muzzy@optonline.net", text: "(2)I am muzzy@optonline.net", repliesTo: 4, parent: 4 },
    { id: 6, author: "muzzy@optonline.net", text: "(3)I am muzzy@optonline.net", repliesTo: 5, parent: 4 },
    
    { id: 7, author: "gordonjcp@optonline.net", text: "(1)I am gordonjcp@optonline.net" },
    { id: 8, author: "gordonjcp@optonline.net", text: "(2)I am gordonjcp@optonline.net", repliesTo: 4, parent: 4 },
    { id: 9, author: "gordonjcp@optonline.net", text: "(3)I am gordonjcp@optonline.net", repliesTo: 4, parent: 4 }
  ]);
}
