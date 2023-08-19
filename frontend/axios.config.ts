import { AxiosRequestConfig } from "axios";

const axiosConfig: AxiosRequestConfig = {
  method: "post",
  baseURL: "http://192.168.0.7:8081/",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  // timeout: 5000,
  validateStatus: () => true
};

export default axiosConfig;