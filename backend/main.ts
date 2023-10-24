import dotenv from "dotenv";
import { attachPaginate  } from "knex-paginate";

import App from "./app";
import { disableAuthFor, endpoints } from "./common/endpoints";

attachPaginate();

if (!process.env.DONT_USE_ENV_FILE) {
  dotenv.config({ path: "../env/.backend.env" });
}

new App(endpoints, disableAuthFor).listen();
