import { useSetAtom } from "jotai";
import React from "react";
import useSWR from "swr";

import fetcher from "../lib/common/fetcher";
import { afterCursorAtom, postsAtom, queryAtom, tagsAtom } from "../lib/hooks/use_fetch_posts";
import styles from "../public/styles/pages/hot_tags.module.sass";
import Tag from "./common/tag";

export default function HotTags(): React.JSX.Element {
  const setAfterCursor = useSetAtom(afterCursorAtom);
  const setPosts = useSetAtom(postsAtom);
  const setQuery = useSetAtom(queryAtom);
  const setTags = useSetAtom(tagsAtom);
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
        setPosts([]);
        setAfterCursor(undefined);
        setTags(value.tag);
        setQuery("");
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
