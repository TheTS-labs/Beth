/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import axiosConfig from "../axios.config";

export default (config: AxiosRequestConfig) => {
  return async (url): Promise<AxiosResponse<any, any>> => {
    return axios.request({ ...axiosConfig, ...config, url })
                .then((res) => res.data);
  };
};