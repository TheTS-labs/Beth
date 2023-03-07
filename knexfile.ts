import dotenv from "dotenv";
import { Knex } from "knex";
import path from "path";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.join(__dirname, "dev.db.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      tableName: "knex_migrations",
    },

    seeds: {
      directory: "./db/seeds"
    }
  }
};

export default config;
