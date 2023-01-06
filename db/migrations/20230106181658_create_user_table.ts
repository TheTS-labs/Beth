import { Knex } from "knex"


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("User", function (table: Knex.CreateTableBuilder) {
    table.increments("id")
    table.string("email")
    table.string("password_hash")
    table.boolean("is_banned")
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("User")
}

