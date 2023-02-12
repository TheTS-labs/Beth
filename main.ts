import dotenv from "dotenv";

import App, { TEndpointTypes } from "./app";
import PermissionEndpoint from "./endpoints/permission/permission_endpoint";
import UserEndpoint from "./endpoints/user/user_endpoint";

dotenv.config();

const endpoints: TEndpointTypes = {
  "/user": UserEndpoint,
  "/permission": PermissionEndpoint
};

const disableAuthFor = ["/user/create"];

new App(endpoints, disableAuthFor).registerRouters().listen();