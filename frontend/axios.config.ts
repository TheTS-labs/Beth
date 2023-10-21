// eslint-disable-next-line import/named
import { AxiosRequestConfig } from "axios";
import dotenv from "dotenv";
import * as env from "env-var";

dotenv.config({ path: "../.frontend.env" });

const axiosConfig: AxiosRequestConfig = {
  method: "post",
  baseURL: env.get("SERVER_URL").required().asUrlString(),
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  // timeout: 5000,
  validateStatus: () => true
};

export default axiosConfig;