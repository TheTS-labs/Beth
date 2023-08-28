import axios from "axios";
import { Dispatch, SetStateAction } from "react";

import axiosConfig from "../../axios.config";

export default async function fetchPosts(
  afterCursor: string,
  setErrors: Dispatch<SetStateAction<string[]>>,
  setAfterCursor: Dispatch<SetStateAction<string>>,
  posts: any,
  token: string | undefined
): Promise<void> {
  if (!afterCursor) {
    return;
  }
  const body = new URLSearchParams({ afterCursor });

  const response = await axios.request({...axiosConfig, ...{
    url: token ? "recommendation/recommend" : "recommendation/globalRecommend",
    data: body,
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  }}).catch(() => {
    setErrors(prevErrors => [...prevErrors, "Failed to fetch more posts"]);
  });

  if (!response) {
    return;
  }

  if ("errorStatus" in response.data) {
    setErrors(prevErrors => [...prevErrors, `${response.data.errorType}: ${response.data.errorMessage}`]);
    return;
  }

  posts.current = [...posts.current, ...response.data.results];
  setAfterCursor(response.data.endCursor);
}