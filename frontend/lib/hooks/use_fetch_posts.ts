import axios from "axios";
import { atom, PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";

import { DetailedPost } from "../../../backend/db/models/post";
import axiosConfig from "../../axios.config";
import { errorsAtom } from "../../components/common/errors";
import { atomWithHash } from "../common/atomWithHash";
import { authTokenAtom } from "../common/token";

interface ReturnType {
  callback: () => Promise<void>
  loading: boolean
  error: boolean | string
}

export const queryAtom = atomWithHash<string | undefined>("q", undefined);
export const tagsAtom = atomWithHash<string | undefined>("tags", undefined);
export const modalUserAtom = atomWithHash<null | string>("modalUser", null);

export const afterCursorAtom = atom<string | undefined>(undefined);
export const postsAtom = atom<DetailedPost[]>([]);

// TODO: When you load a new page with a `modalUser` hash value, it sets the posts in the feed to custom posts

export default function useFetchPosts(options?: {
  customQueryAtom?: PrimitiveAtom<string | undefined>
  customTagsAtom?: PrimitiveAtom<string | undefined>
  customAfterCursorAtom?: PrimitiveAtom<string | undefined>
  customPostsAtom?: PrimitiveAtom<DetailedPost[]>
}): ReturnType {
  const token = useAtomValue(authTokenAtom);
  const query = useAtomValue(options?.customQueryAtom || queryAtom);
  const tags = useAtomValue(options?.customTagsAtom || tagsAtom);
  const username = useAtomValue(modalUserAtom);

  const setErrors = useSetAtom(errorsAtom);
  const setPosts = useSetAtom(options?.customPostsAtom || postsAtom);

  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState<boolean | string>(false);

  const [ afterCursor, setAfterCursor ] = useAtom(options?.customAfterCursorAtom || afterCursorAtom);
  
  let requestUrl = token ? "recommendation/recommend" : "recommendation/globalRecommend";
  const body = new URLSearchParams();

  if (afterCursor) {
    body.append("afterCursor", afterCursor);
  }

  if (tags) {
    requestUrl = "post/search";
    body.append("tags", tags);
  }

  if (query) {
    requestUrl = "post/search";
    body.append("query", query);
  }

  if (username) {
    requestUrl = "post/getUserPosts";
    body.append("username", username);
  }

  return {
    callback: async (): Promise<void> => {
      setLoading(true);
      setError(false);
  
      const response = await axios.request({...axiosConfig, ...{
        url: requestUrl,
        data: body,
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }}).then(response => response.data).catch((e) => {
        setErrors(prevErrors => [...prevErrors, String(e)]);
        setLoading(false);
        setError(true);
      });
    
      if (!response) {
        return;
      }
    
      if (response.hasOwnProperty("errorMessage")) {
        setErrors(prevErrors => [...prevErrors, `${response.errorType}: ${response.errorMessage}`]);
        setLoading(false);
        setError(response.errorMessage);
        return;
      }
    
      setPosts(prev => [...prev, ...response.results]);
      setAfterCursor(response.endCursor);
      setLoading(false);
    },
    loading,
    error
  };
}