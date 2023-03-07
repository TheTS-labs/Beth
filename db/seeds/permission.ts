import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("permission").del();

  // Inserts seed entries
  await knex("permission").insert([
    { id: 1, email: "hikoza@optonline.net" },
    { id: 2, email: "muzzy@optonline.net" },
    { id: 3, email: "gordonjcp@optonline.net" }
  ]);
}
