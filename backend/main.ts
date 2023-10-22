import dotenv from "dotenv";
import { attachPaginate  } from "knex-paginate";

import App from "./app";
import { disableAuthFor, endpoints } from "./common/endpoints";

attachPaginate();
dotenv.config({ path: "../env/.backend.env" });

new App(endpoints, disableAuthFor).listen();
