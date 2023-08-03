import dotenv from "dotenv";
import * as env from "env-var";
import { Knex } from "knex";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      database: env.get("POSTGRES_DB").required().asString(),
      user: env.get("POSTGRES_USER").required().asString(),
      password: env.get("POSTGRES_PASSWORD").required().asString(),
    },
    useNullAsDefault: true,
    migrations: {
      tableName: "knex_migrations",
      directory: "./db/migrations"
    },
    seeds: {
      directory: "./db/seeds"
    }
  },

  test: {
    client: "postgresql",
    connection: {
      database: env.get("POSTGRES_DB").required().asString(),
      user: env.get("POSTGRES_USER").required().asString(),
      password: env.get("POSTGRES_PASSWORD").required().asString(),
    },
    useNullAsDefault: true,
    migrations: {
      tableName: "knex_migrations",
      directory: "./db/migrations"
    },
    seeds: {
      directory: "./db/seeds"
    }
  }
};

export default config;
