import dotenv from "dotenv";
import * as env from "env-var";
import fs from "fs";
import { Knex } from "knex";

dotenv.config({ path: "../env/.backend.env" });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      host: env.get("POSTGRES_HOST").required().asString(),
      port: env.get("POSTGRES_PORT").required().asPortNumber(),
      database: env.get("POSTGRES_DB").required().asString(),
      user: env.get("POSTGRES_USER").required().asString(),
      password: env.get("POSTGRES_PASSWORD").required().asString(),
      ssl: env.get("POSTGRES_CA").required().asString() ? {
        ca: fs.readFileSync(env.get("POSTGRES_CA").required().asString()).toString()
      } : false,
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

  production: {
    client: "postgresql",
    connection: {
      host: env.get("POSTGRES_HOST").required().asString(),
      port: env.get("POSTGRES_PORT").required().asPortNumber(),
      database: env.get("POSTGRES_DB").required().asString(),
      user: env.get("POSTGRES_USER").required().asString(),
      password: env.get("POSTGRES_PASSWORD").required().asString(),
      ssl: env.get("POSTGRES_CA").required().asString() ? {
        ca: fs.readFileSync(env.get("POSTGRES_CA").required().asString()).toString()
      } : false,
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
      host: env.get("POSTGRES_HOST").required().asString(),
      port: env.get("POSTGRES_PORT").required().asPortNumber(),
      database: env.get("POSTGRES_DB").required().asString(),
      user: env.get("POSTGRES_USER").required().asString(),
      password: env.get("POSTGRES_PASSWORD").required().asString(),
      ssl: env.get("POSTGRES_CA").required().asString() ? {
        ca: fs.readFileSync(env.get("POSTGRES_CA").required().asString()).toString()
      } : false,
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
};

export default config;
