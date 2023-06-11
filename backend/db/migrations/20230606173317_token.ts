import { Knex } from "knex";

import { DBBool } from "../../common/types";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("token", function (table: Knex.CreateTableBuilder) {
    table.increments("id");
    table.string("owner").unique().notNullable();
    table.boolean("revoked").defaultTo(DBBool.No);
    table.timestamp("iat").notNullable();
    table.timestamp("exp").notNullable();
    table.string("scope").notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("token");
}

