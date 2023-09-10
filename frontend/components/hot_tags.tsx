import React, { Dispatch, MutableRefObject,SetStateAction } from "react";
import useSWR from "swr";

import { DetailedPost } from "../../backend/db/models/post";
import fetcher from "../lib/common/fetcher";
import styles from "../public/styles/pages/hot_tags.module.sass";
import Tag from "./common/tag";

interface Props {
  setSearchAfterCursor: Dispatch<SetStateAction<string | undefined>>
  setTags: Dispatch<SetStateAction<string | undefined>>
  searchResults: MutableRefObject<DetailedPost[]>
  tags: string | undefined
}

export default function HotTags(props: Props): React.JSX.Element {
  const hotTagsResponse = useSWR(
    "recommendation/getHotTags",
    fetcher<{ result: { tag: string, postCount: string }[] }>({})
  );
  const hotTags = hotTagsResponse.data?.result || [
    { tag: "#Hot", postCount: "767027" },
    { tag: "#Tags", postCount: "2756" },
    { tag: "#Unavailable", postCount: "26363" },
    { tag: "#Due", postCount: "901743" },
    { tag: "#To", postCount: "15632" },
    { tag: "#Server", postCount: "19563" },
    { tag: "#Error", postCount: "521421" },
    { tag: "._.", postCount: "82642" },
  ];
  const hotTagsElements: React.JSX.Element[] = [];

  if (hotTagsResponse.error) {
    //? Add `div` with error if needed
    hotTagsElements.push(
      <div className={styles.broken_container} key={-1}>
        <p className={styles.broken_text}>Hot Tags unavailable</p>
      </div>
    );
  }

  hotTagsElements.push(...hotTags.map((value, i) => 
    //? ...And then all tags
    //? `.push` and spread operator is used to make `hotTagsElements` variable constant
    <Tag
      key={i}
      hotTagName={value.tag}
      posts={value.postCount}
      broken={hotTagsResponse.error ? true : false}
      loading={hotTagsResponse.isLoading}
      onClick={(): void => {
        props.searchResults.current = [];
        props.setSearchAfterCursor(undefined);
        props.setTags(value.tag);
      }}
    />
  ));

  return <div className={`${styles.hot_tags_container} ${hotTagsResponse.error ? styles.broken_hot_tags : ""}`}>
    <p className={styles.text}>Hot Tags</p>
    <div className={styles.hot_tags}>
      {...hotTagsElements}
    </div>
  </div>;
}
