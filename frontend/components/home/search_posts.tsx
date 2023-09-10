import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";

import { DetailedPost } from "../../../backend/db/models/post";
import FetchPosts from "../../lib/home/fetch_posts";
import observer from "../../lib/home/observer";
import voteOnClick from "../../lib/vote_on_click";
import styles from "../../public/styles/pages/home/posts.module.sass";
import Errors from "../errors";
import { ExpandedPost } from "../expanded_post";
import Loader from "../loader";

interface Props {
  token: string | undefined
  setSearchAfterCursor: Dispatch<SetStateAction<string | null>>
  setQuery: Dispatch<SetStateAction<string | null>>
  setTags: Dispatch<SetStateAction<string | null>>
  searchResults: MutableRefObject<DetailedPost[]>
  searchAfterCursor: string | null
  query: string | null
  tags: string | null
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
    props.setTags(null);
    props.setSearchAfterCursor(null);
    props.setQuery(null);
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
