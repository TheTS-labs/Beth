import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("post", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("author").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.text("text").notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("post");
}

