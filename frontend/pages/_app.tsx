import "../public/styles/global.sass";

import { Provider } from "jotai";
import React from "react";

import Errors from "../components/common/errors";
import WaitForAuthToken from "../lib/wait_for_auth_token";

interface Props {
  Component: () => React.JSX.Element
  pageProps: object
}

export default function App({ Component, pageProps }: Props): React.JSX.Element {
  return <Provider>
    <Component {...pageProps} />
    <Errors />
    <WaitForAuthToken />
  </Provider>;
}