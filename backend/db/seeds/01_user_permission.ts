import { faker } from "@faker-js/faker";
import { Knex } from "knex";

import { DBBool } from "../../common/types";
import { User } from "../models/user";

const seedUsers = 100;
export async function seed(knex: Knex): Promise<void> {
  const passwordHash = "$2b$04$LL.nTjsYZY6V.LuBAlVikOgBt/gYiEHu3XtvHvMGwwByqBOgFqZoC"; // Pa$$w0rd!

  // Deletes ALL existing entries
  await knex("user").del();
  await knex("permission").del();
  const users: Omit<User, "id">[] = [];

  [...Array(seedUsers).keys()].map(async () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    users.push({
      email: faker.internet.email(),
      username: faker.internet.userName({ firstName: firstName, lastName: lastName}),
      displayName: `${firstName} ${lastName}`,
      password: passwordHash,
      verified: faker.datatype.boolean(0.3) as unknown as DBBool,
      isFrozen: faker.datatype.boolean(0.05) as unknown as DBBool,
      tags: faker.word.words({ count: { min: 0, max: 10 } }).replaceAll(" ", ",")
    });
  });

  await knex("user").insert(users);
  await knex("permission").insert(users.map(value => {
    return { email: value.email };
  }));
}
