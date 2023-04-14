import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("post", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("author").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("freezenAt");
    table.text("text").notNullable();
    table.integer("repliesTo");
    table.integer("parent");
    table.text("tags").defaultTo("");
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("post");
}

