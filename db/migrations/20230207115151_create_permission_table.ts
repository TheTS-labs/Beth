import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("permission", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("email").unique().notNullable();

    // Permissions
    table.boolean("user_view").defaultTo(1);
    table.boolean("user_editPassword").defaultTo(1);
    table.boolean("user_freeze").defaultTo(1);
    table.boolean("permission_view").defaultTo(1);
    table.boolean("permission_grand").defaultTo(0);
    table.boolean("permission_rescind").defaultTo(0);
    table.boolean("post_create").defaultTo(1);
    table.boolean("post_view").defaultTo(1);
    table.boolean("post_edit").defaultTo(1);
    table.boolean("post_delete").defaultTo(1);
    table.boolean("post_superEdit").defaultTo(0);
    table.boolean("post_superDelete").defaultTo(0);
    table.boolean("post_getList").defaultTo(1);
    table.boolean("post_forceDelete").defaultTo(0);
    table.boolean("post_viewReplies").defaultTo(1);
    table.boolean("post_upvote").defaultTo(1);
    table.boolean("post_downvote").defaultTo(1);
    table.boolean("post_editTags").defaultTo(1);
    table.boolean("post_superTagsEdit").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("permission");
}
