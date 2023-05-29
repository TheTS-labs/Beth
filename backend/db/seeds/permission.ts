import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("permission").del();

  // Inserts seed entries
  await knex("permission").insert([
    { email: "hikoza@optonline.net" },
    { email: "muzzy@optonline.net" },
    { email: "gordonjcp@optonline.net" }
  ]);
}
