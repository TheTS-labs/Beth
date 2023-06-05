import { Knex } from "knex";

import { DBBool } from "../../common/types";

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = "$2b$04$nYbKivKTN4593hXpkJC.s.WcJ8lecwMiPcdXsWTUDs7BNN1JxVWl2"; // 12345678

  // Deletes ALL existing entries
  await knex("user").del();

  // Inserts seed entries
  await knex("user").insert([
      {
        displayName: "🅷🅸🅺🅾🆉🅰",
        username: "hikoza",
        email: "hikoza@optonline.net", password: passwordHash
      },
      {
        displayName: "m̳̿͟͞u̳̿͟͞z̳̿͟͞z̳̿͟͞y̳̿͟͞",
        username: "muzzy",
        email: "muzzy@optonline.net", password: passwordHash, verified: DBBool.Yes
      },
      {
        displayName: "♡𝔊𝔬𝔯𝔡𝔬𝔫 𝔍ℭ𝔓♡",
        username: "gordonjcp",
        email: "gordonjcp@optonline.net", password: passwordHash, isFrozen: DBBool.Yes
      }
  ]);
}
