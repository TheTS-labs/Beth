import { PrimitiveAtom, useSetAtom } from "jotai";
import { useEffect } from "react";

import RequestError from "../../../backend/common/request_error";
import { atomWithHash } from "../atomWithHash";
import useRequest from "./use_request";

interface ReturnType {
  request: (newData?: object | undefined) => void
  loading: boolean
  error: boolean | string
}

export const modalUserAtom = atomWithHash<null | string>("modalUser", null);

export default function useFetchPosts<PostType>(options: {
  url: string
  data: object
  afterCursorAtom: PrimitiveAtom<string | undefined>
  postsAtom: PrimitiveAtom<PostType[]>
  errorsAtom: PrimitiveAtom<string[]>
  doSetErrors?: boolean
}): ReturnType {
  const setPosts = useSetAtom(options.postsAtom);
  const setAfterCursor = useSetAtom(options.afterCursorAtom);

  const { request, error, loading, result } = useRequest<{ results: PostType[], endCursor: string } | RequestError>({
    url: options.url,
    data: options.data,
    doSetErrors: options.doSetErrors,
    errorsAtom: options.errorsAtom
  });

  useEffect(() => {
    if (!result || "errorMessage" in result) {
      return;
    }

    setPosts(prev => [...prev, ...result.results]);
    setAfterCursor(result.endCursor);
  }, [result]);

  return { request, loading, error };
}