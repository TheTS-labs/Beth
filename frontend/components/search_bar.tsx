import React, { Dispatch, FormEvent, MutableRefObject, SetStateAction, useEffect, useState } from "react";

import { DetailedPost } from "../../backend/db/models/post";
import FetchPosts from "../lib/home/fetch_posts";
import styles from "../public/styles/pages/index.module.sass";
import Errors from "./common/errors";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    query: { value: string }
  }
}

interface Props {
  setSearchAfterCursor: Dispatch<SetStateAction<string | undefined>>
  setQuery: Dispatch<SetStateAction<string | undefined>>
  setTags: Dispatch<SetStateAction<string | undefined>>
  searchResults: MutableRefObject<DetailedPost[]>
  query: string | undefined
  tags: string | undefined
}

const tagsRegex = / tags:\[([a-zA-Z0-9]+(?:,[a-zA-Z0-9]+)*)\]/gm;

export default function SearchBar(props: Props): React.JSX.Element {
  const [ errors, setErrors ] = useState<string[]>([]);

  const onSubmit = (event: Event): void => {
    event.preventDefault();
    if (props.query || props.tags) {
      props.searchResults.current = [];
      props.setTags(undefined);
      props.setQuery(undefined);
    }

    const query = event.target.query.value;
    tagsRegex.lastIndex = 0;
    const regexMatches = tagsRegex.exec(query);
    if (regexMatches) {
      props.setTags(regexMatches[1]);
      props.setQuery(query.replace(regexMatches[0], ""));
      return;
    }

    props.setQuery(query);
  };

  useEffect(() => {
    const fetch = new FetchPosts(
      undefined,
      setErrors,
      props.setSearchAfterCursor,
      undefined, undefined,
      props.tags || undefined,
      props.query || undefined
    );

    fetch.request(props.searchResults, true);
  }, [props.query, props.tags, props.searchResults, props.setSearchAfterCursor]);

  return <div className={styles.search_bar}>
    <form onSubmit={onSubmit} method="GET">
      <input type="search" id="query" placeholder={props.query ? props.query : "Search something..."} />
    </form>
    
    <Errors errors={errors} />
  </div>;
}