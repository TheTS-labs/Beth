// eslint-disable-next-line import/named
import { AxiosRequestConfig } from "axios";

const axiosConfig: AxiosRequestConfig = {
  method: "post",
  baseURL: process.env.SERVER_URL,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  // timeout: 5000,
  validateStatus: () => true
};

export default axiosConfig;