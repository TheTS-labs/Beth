import { faker } from "@faker-js/faker";
import { UniqueEnforcer } from "enforce-unique";
import { Knex } from "knex";

import { DBBool } from "../../common/types";
import { Permissions, PermissionStatus } from "../models/permission";
import { User } from "../models/user";

const seedUsers = 100;
const batches = Math.ceil(seedUsers / 100);
const passwordHash = "$2b$04$LL.nTjsYZY6V.LuBAlVikOgBt/gYiEHu3XtvHvMGwwByqBOgFqZoC"; // Pa$$w0rd!
const uniqueEnforcerEmail = new UniqueEnforcer();
const uniqueEnforcerUsername = new UniqueEnforcer();

const generateUsers = (length: number): Omit<User, "id">[] => Array.from({ length }, () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    email: uniqueEnforcerEmail.enforce(() => faker.internet.email({firstName, lastName})),
    username: uniqueEnforcerUsername.enforce(() => faker.internet.userName({firstName, lastName})),
    displayName: `${firstName} ${lastName}`,
    password: passwordHash,
    verified: faker.datatype.boolean(0.3) as unknown as DBBool,
    isFrozen: faker.datatype.boolean(0.05) as unknown as DBBool,
    tags: faker.word.words({ count: { min: 0, max: 10 } }).replaceAll(" ", ",")
  };
});

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("user").del();
  await knex("permission").del();

  Array.from({ length: batches }).forEach(async () => {
    const users = generateUsers(seedUsers);
    
    await knex("user").insert(users);
    await knex("permission").insert(users.map(({ email }) => ({ email })));
  });

  await knex<User>("user").insert({
    email: "admin@example.com",
    username: "admin",
    displayName: "Admin",
    verified: DBBool.Yes,
    password: passwordHash
  });
  await knex<Permissions>("permission").insert({
    email: "admin@example.com",
    UserView: PermissionStatus.Has,
    UserSuperView: PermissionStatus.Has,
    UserEditPassword: PermissionStatus.Has,
    UserFroze: PermissionStatus.Has,
    UserSuperFroze: PermissionStatus.Has,
    UserEditTags: PermissionStatus.Has,
    UserVerify: PermissionStatus.Has,
    PermissionView: PermissionStatus.Has,
    PermissionGrand: PermissionStatus.Has,
    PermissionRescind: PermissionStatus.Has,
    PostCreate: PermissionStatus.Has,
    PostView: PermissionStatus.Has,
    PostEdit: PermissionStatus.Has,
    PostDelete: PermissionStatus.Has,
    PostSuperEdit: PermissionStatus.Has,
    PostSuperDelete: PermissionStatus.Has,
    PostGetList: PermissionStatus.Has,
    PostForceDelete: PermissionStatus.Has,
    PostViewReplies: PermissionStatus.Has,
    PostEditTags: PermissionStatus.Has,
    PostSuperTagsEdit: PermissionStatus.Has,
    VotingVote: PermissionStatus.Has,
    VotingUnvote: PermissionStatus.Has,
    VotingVoteCount: PermissionStatus.Has,
    VotingGetVotes: PermissionStatus.Has,
    ActionSimpleSearch: PermissionStatus.Has,
    ActionChainWhereSearch: PermissionStatus.Has,
    RecommendationRecommend: PermissionStatus.Has
  });
}
