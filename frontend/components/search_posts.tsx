import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";

import { DetailedPost } from "../../backend/db/models/post";
import observer from "../lib/common/observer";
import FetchPosts from "../lib/home/fetch_posts";
import voteOnClick from "../lib/home/vote_on_click";
import styles from "../public/styles/pages/posts.module.sass";
import Errors from "./common/errors";
import Loader from "./common/loader";
import { ExpandedPost } from "./expanded_post";

interface Props {
  token: string | undefined
  setSearchAfterCursor: Dispatch<SetStateAction<string | undefined>>
  setQuery: Dispatch<SetStateAction<string | undefined>>
  setTags: Dispatch<SetStateAction<string | undefined>>
  searchResults: MutableRefObject<DetailedPost[]>
  searchAfterCursor: string | undefined
  query: string | undefined
  tags: string | undefined
}

export default function SearchPosts(props: Props): React.JSX.Element {
  const [ errors, setErrors ] = useState<string[]>([]);
  const observerTarget = useRef(null);
  const postElements: React.JSX.Element[] = [];

  const fetch = new FetchPosts(
    props.searchAfterCursor,
    setErrors,
    props.setSearchAfterCursor,
    undefined, undefined,
    props.tags || undefined,
    props.query || undefined
  );

  const clearResults = (): void => {
    props.searchResults.current = [];
    props.setTags(undefined);
    props.setSearchAfterCursor(undefined);
    props.setQuery(undefined);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(observer(
    observerTarget,
    async (searchResults) => fetch.request(searchResults),
    [ props.searchResults ]
  ), [props.searchAfterCursor]);

  postElements.push(...props.searchResults.current.map((post, i) => 
    <ExpandedPost 
      key={i}
      post={post}
      broken={false}
      loading={false}
      voteOnClick={voteOnClick(props.token, setErrors)}
    />
  ));

  return <div className={styles.posts}>
    <p className={styles.text} onClick={clearResults} style={{ cursor: "pointer" }}>⬅ Search results</p>
    {...postElements}

    <div className={styles.loader} ref={observerTarget}><Loader /></div>
    <Errors errors={errors} />
  </div>;
}
