import { useAtom } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";
import { useEffect, useState } from "react";

import { Permissions } from "../../../backend/db/models/permission";

interface ReturnType {
  value: string | undefined
  update: (value: string) => void
  remove: () => void
  payload: {
    tokenId: number
    scope: (keyof Permissions)[]
    email: string
  } | undefined
}

export const authTokenAtom = atomWithStorage<string | undefined>("AUTH_TOKEN", undefined, undefined, {
  // eslint-disable-next-line camelcase
  unstable_getOnInit: true
});

export default function useAuthToken(): ReturnType {
  const [ token, setToken ] = useAtom(authTokenAtom);
  const [ payload, setPayload ] = useState<ReturnType["payload"]>();

  useEffect(() => {
    if (token) {
      const base64PayloadFromToken = token.split(".")[1];
      const stringPayload = Buffer.from(base64PayloadFromToken, "base64").toString("utf8");

      setPayload(JSON.parse(stringPayload));
    }
  }, [token]);

  return {
    value: token,
    update: (value: string) => setToken(value),
    remove: () => setToken(RESET),
    payload
  };
}