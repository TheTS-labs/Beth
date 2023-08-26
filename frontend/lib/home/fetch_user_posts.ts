import axios from "axios";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import axiosConfig from "../../axios.config";
import { DetailedPost } from "../../../backend/db/models/post";

export default async function fetchUserPosts(
  afterCursor: string | null,
  setErrors: Dispatch<SetStateAction<string[]>>,
  setAfterCursor: Dispatch<SetStateAction<string>>,
  posts: MutableRefObject<DetailedPost[]>,
  username: string,
  ignoreAfterCursor?: boolean
): Promise<void> {
  const body = new URLSearchParams({ username });

  if (afterCursor) {
    body.append("afterCursor", afterCursor);
  }

  if (!afterCursor && !ignoreAfterCursor) {
    return;
  }
  
  const response = await axios.request({...axiosConfig, ...{
    url: "post/getUserPosts",
    data: body
  }}).catch(() => {
    setErrors(prevErrors => [...prevErrors, "Failed to fetch user posts"]);
  });

  if (!response) {
    return;
  }

  if (response.data.hasOwnProperty("errorMessage")) {
    setErrors(prevErrors => [...prevErrors, `${response.data.errorType}: ${response.data.errorMessage}`]);
    return;
  }

  posts.current = [...posts.current, ...response.data.results];
  setAfterCursor(response.data.endCursor);
}