import { defineConfig } from "cypress";
import dotenv from "dotenv";
import * as env from "env-var";

dotenv.config({ path: "../env/.frontend.env" });

export default defineConfig({
  e2e: {
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    baseUrl: env.get("CYPRESS_URL").required().asUrlString(),
    env: env.get()
  },
});
