import axios from "axios";
import { Dispatch, MutableRefObject, SetStateAction } from "react";

import { DetailedPost } from "../../../backend/db/models/post";
import axiosConfig from "../../axios.config";

export default async function fetchSearchResults(
  query: string | null,
  setErrors: Dispatch<SetStateAction<string[]>>,
  setAfterCursor: Dispatch<SetStateAction<string | null>>,
  posts: MutableRefObject<DetailedPost[]>,
  tags: string | null,
  afterCursor?: string | null
): Promise<void> {
  const body = new URLSearchParams();

  if (afterCursor) {
    body.append("afterCursor", afterCursor);
  }
  if (tags) {
    body.append("tags", tags);
  }
  if (query) {
    body.append("query", query);
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