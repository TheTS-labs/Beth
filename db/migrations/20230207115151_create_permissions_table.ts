import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("permissions", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("email").unique().notNullable();
    table.boolean("canFreeze").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("permissions");
}