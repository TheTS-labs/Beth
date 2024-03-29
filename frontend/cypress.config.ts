/* eslint-disable @typescript-eslint/no-var-requires */
import { defineConfig } from "cypress";
import dotenv from "dotenv";
import * as env from "env-var";

dotenv.config({ path: "../env/.frontend.env" });

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);

      return config;
    },
    baseUrl: env.get("CYPRESS_URL").required().asUrlString(),
    env: {
      SERVER_URL: env.get("SERVER_URL").required().asString(),
      NODE_ENV: env.get("NODE_ENV").required().asEnum(["development", "production", "test"])
    }
  }
});
