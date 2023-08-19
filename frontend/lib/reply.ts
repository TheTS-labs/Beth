import axios from "axios";
import axiosConfig from "../axios.config";
import { Dispatch, SetStateAction } from "react";

export default async (replyTo: number, text: string, setErrors: Dispatch<SetStateAction<string[]>>, token: string) => {
  const response = await axios.request({...axiosConfig, ...{
    url: "post/create",
    data: new URLSearchParams({ replyTo: String(replyTo), text }),
    headers: { "Authorization": `Bearer ${token}` }
  }}).catch(e => {
    setErrors(prevErrors => [...prevErrors, String(e)]);
  });

  if (!response) {
    return false;
  }

  if (response.data.hasOwnProperty("errorMessage")) {
    setErrors(prevErrors => [...prevErrors, response.data.errorMessage]);
    return false;
  }

  return response.data.success;
}