import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("action", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("actionType").notNullable();
    table.integer("userId").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.jsonb("context").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("action");
}