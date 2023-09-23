import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

import { Permissions } from "../../../backend/db/models/permission";

interface CookieSetOptions {
  path?: string
  expires?: Date
  maxAge?: number
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: boolean | "none" | "lax" | "strict"
  encode?: (value: string) => string
}

interface ReturnType {
  value: string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (value: any, options?: CookieSetOptions | undefined) => void
  remove: () => void
  payload: {
    tokenId: number
    scope: (keyof Permissions)[]
    email: string
  } | undefined
}

export default function useAuthToken(): ReturnType {
  const [ token, updateToken, removeToken ] = useCookies(["AUTH_TOKEN"]);
  const [ payload, setPayload ] = useState<ReturnType["payload"]>();

  useEffect(() => {
    if (token.AUTH_TOKEN) {
      const base64PayloadFromToken = token.AUTH_TOKEN.split(".")[1];
      const stringPayload = Buffer.from(base64PayloadFromToken, "base64").toString("utf8");

      setPayload(JSON.parse(stringPayload));
    }
  }, [token.AUTH_TOKEN]);

  return {
    value: token.AUTH_TOKEN,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (value: any, options?: CookieSetOptions | undefined) => updateToken("AUTH_TOKEN", value, options),
    remove: () => removeToken("AUTH_TOKEN"),
    payload
  };
}