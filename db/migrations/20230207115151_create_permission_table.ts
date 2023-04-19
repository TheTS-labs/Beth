import { Knex } from "knex";

import { PermissionStatus } from "../models/permission";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("permission", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("email").unique().notNullable();

    // Permissions
    table.boolean("UserView").defaultTo(PermissionStatus.Has);
    table.boolean("UserEditPassword").defaultTo(PermissionStatus.Has);
    table.boolean("UserFreeze").defaultTo(PermissionStatus.Has);
    table.boolean("PermissionView").defaultTo(PermissionStatus.Has);
    table.boolean("PermissionGrand").defaultTo(PermissionStatus.Hasnt);
    table.boolean("PermissionRescind").defaultTo(PermissionStatus.Hasnt);
    table.boolean("PostCreate").defaultTo(PermissionStatus.Has);
    table.boolean("PostView").defaultTo(PermissionStatus.Has);
    table.boolean("PostEdit").defaultTo(PermissionStatus.Has);
    table.boolean("PostDelete").defaultTo(PermissionStatus.Has);
    table.boolean("PostSuperEdit").defaultTo(PermissionStatus.Hasnt);
    table.boolean("PostSuperDelete").defaultTo(PermissionStatus.Hasnt);
    table.boolean("PostGetList").defaultTo(PermissionStatus.Has);
    table.boolean("PostForceDelete").defaultTo(PermissionStatus.Hasnt);
    table.boolean("PostViewReplies").defaultTo(PermissionStatus.Has);
    table.boolean("PostEditTags").defaultTo(PermissionStatus.Has);
    table.boolean("PostSuperTagsEdit").defaultTo(PermissionStatus.Hasnt);
    table.boolean("VotingVote").defaultTo(PermissionStatus.Has);
    table.boolean("VotingUnvote").defaultTo(PermissionStatus.Has);
    table.boolean("VotingVoteCount").defaultTo(PermissionStatus.Has);
    table.boolean("VotingGetVotes").defaultTo(PermissionStatus.Has);
    table.boolean("ActionSimpleSearch").defaultTo(PermissionStatus.Hasnt);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("permission");
}
