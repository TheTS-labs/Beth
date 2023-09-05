import "../public/styles/global.sass";

import React from "react";

interface Props {
  Component: () => React.JSX.Element
  pageProps: object
}

export default function App({ Component, pageProps }: Props): React.JSX.Element {
  return <Component {...pageProps} />;
}