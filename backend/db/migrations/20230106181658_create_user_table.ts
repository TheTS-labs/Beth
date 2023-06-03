import { Knex } from "knex";

import { DBBool } from "../../common/types";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("user", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("displayName").notNullable();
    table.string("username").unique().notNullable();
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.boolean("isFreezen").defaultTo(DBBool.No);
    table.text("tags").defaultTo("");
    table.boolean("verified").defaultTo(DBBool.No);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("user");
}
