import React from "react";

import styles from "../public/styles/components/tag.module.sass";
import Loading from "./loading";

type Props = {
  hotTagName: string | number
  posts: number | string
  loading?: boolean
  broken?: boolean
  onClick: () => void
};

export default function Tag(props: Props): React.JSX.Element {
  return <div className={styles.hot_tag} data-broken={props.broken}>
    <div className={styles.hot_tag_name_and_posts_container}>
      <span className={styles.hot_tag_name} onClick={props.onClick}>
        {props.loading ? <Loading /> : props.hotTagName}
      </span><br />
      <span className={styles.hot_tag_posts}>posts: {props.loading ? <Loading /> : props.posts}</span> 
    </div>
  </div>;
}
