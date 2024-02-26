import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { authTokenAtom } from "./hooks/use_auth_token";

function WaitForAuthToken(): React.JSX.Element {
  const token = useAtomValue(authTokenAtom);

  return token ? <div hidden id="authTokenDefined"></div>: <></>;
}

export default dynamic(async (): Promise<() => React.JSX.Element> => Promise.resolve(WaitForAuthToken), {
  ssr: false
});