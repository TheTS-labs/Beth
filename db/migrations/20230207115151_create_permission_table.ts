import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("permission", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("email").unique().notNullable();
    table.boolean("canFreeze").defaultTo(0);
    table.boolean("canGrant").defaultTo(0);
    table.boolean("canRescind").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("permission");
}
