import axios from "axios";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import axiosConfig from "../../axios.config";
import { DetailedPost } from "../../../backend/db/models/post";

export default async function fetchSearchResults(
  query: string,
  setErrors: Dispatch<SetStateAction<string[]>>,
  setAfterCursor: Dispatch<SetStateAction<string>>,
  posts: MutableRefObject<DetailedPost[]>,
  afterCursor?: string
): Promise<void> {
  const body = new URLSearchParams({ query });
  if (afterCursor) {
    body.append("afterCursor", afterCursor);
  }

  const response = await axios.request({...axiosConfig, ...{
    url: "post/search",
    data: body
  }}).catch(() => {
    setErrors(prevErrors => [...prevErrors, "Failed to fetch search results"]);
  });

  if (!response) {
    return;
  }

  if (response.data.hasOwnProperty("errorStatus")) {
    setErrors(prevErrors => [...prevErrors, `${response.data.errorType}: ${response.data.errorMessage}`]);
    return;
  }

  posts.current = [...posts.current, ...response.data.results];
  setAfterCursor(response.data.endCursor);
}