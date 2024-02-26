import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("vote", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.integer("userId").notNullable();
    table.integer("postId").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.boolean("voteType").notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("vote");
}

