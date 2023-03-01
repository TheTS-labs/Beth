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
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("permission");
}
