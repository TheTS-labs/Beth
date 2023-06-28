import dotenv from "dotenv";

import App from "./app";
import { disableAuthFor,endpoints } from "./common/endpoints";

dotenv.config();

new App(endpoints, disableAuthFor).listen();

// TODO: Review all log messages and consider adding new/custom levels
// TODO: Enum for Request errors or something like that