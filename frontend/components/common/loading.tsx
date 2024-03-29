import React from "react";

import styles from "../../public/styles/components/common/loading.module.sass";

export default function Loading(props: { length?: string }): React.JSX.Element {
  return <span className={styles.loading} style={{ width: props.length||"10ch" }}></span>;
}