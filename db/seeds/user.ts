import { Knex } from "knex";

import { DBBool } from "../../common/types";

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = "$2b$04$nYbKivKTN4593hXpkJC.s.WcJ8lecwMiPcdXsWTUDs7BNN1JxVWl2";

  // Deletes ALL existing entries
  await knex("user").del();

  // Inserts seed entries
  await knex("user").insert([
      { email: "hikoza@optonline.net", password: passwordHash },
      { email: "muzzy@optonline.net", password: passwordHash },
      { email: "gordonjcp@optonline.net", password: passwordHash, isFreezen: DBBool.Yes }
  ]);
}
