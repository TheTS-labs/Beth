/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line import/named
import axios, { AxiosRequestConfig } from "axios";

import axiosConfig from "../../axios.config";

export default <DataType=any>(config: AxiosRequestConfig={}): (url: string) => Promise<DataType> => {
  return async (url: string): Promise<DataType> => {
    const { data } = await axios.request({ ...axiosConfig, ...config, url });
    return data;
  };
};