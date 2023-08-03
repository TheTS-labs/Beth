import dotenv from "dotenv";

import App from "./app";
import { disableAuthFor,endpoints } from "./common/endpoints";

dotenv.config();

new App(endpoints, disableAuthFor).listen();
