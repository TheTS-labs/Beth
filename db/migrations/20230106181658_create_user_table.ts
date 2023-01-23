import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("user", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.boolean("is_banned").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("user");
}

