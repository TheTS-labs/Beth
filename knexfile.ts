import dotenv from "dotenv";
import * as env from "env-var";
import { Knex } from "knex";
import path from "path";

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

  developmentSQLite: {
    client: "sqlite3",
    connection: {
      filename: path.join(__dirname, "dev.db.sqlite3"),
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
