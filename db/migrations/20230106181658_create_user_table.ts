import { Knex } from "knex"

export interface TUser {
  id: number
  email: string
  password_hash: string
  is_banned: boolean
}

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("user", function (table: Knex.CreateTableBuilder) {
    table.increments("id")
    table.string("email").unique().notNullable()
    table.string("password_hash").notNullable()
    table.boolean("is_banned").defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("user")
}

