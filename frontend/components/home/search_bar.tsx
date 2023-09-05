import React, { Dispatch, FormEvent, MutableRefObject, SetStateAction, useEffect, useState } from "react";

import { DetailedPost } from "../../../backend/db/models/post";
import fetchSearchResults from "../../lib/home/search";
import styles from "../../public/styles/pages/home/index.module.sass";
import Errors from "../errors";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    query: { value: string }
  }
}

interface Props {
  setSearchAfterCursor: Dispatch<SetStateAction<string | null>>
  setQuery: Dispatch<SetStateAction<string | null>>
  setTags: Dispatch<SetStateAction<string | null>>
  searchResults: MutableRefObject<DetailedPost[]>
  query: string | null
  tags: string | null
}

const tagsRegex = / tags:\[([a-zA-Z0-9]+(?:,[a-zA-Z0-9]+)*)\]/gm;

export default function SearchBar(props: Props): React.JSX.Element {
  const [ errors, setErrors ] = useState<string[]>([]);

  const onSubmit = (event: Event): void => {
    event.preventDefault();
    if (props.query || props.tags) {
      props.searchResults.current = [];
      props.setTags(null);
      props.setQuery(null);
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
    fetchSearchResults(props.query, setErrors, props.setSearchAfterCursor, props.searchResults, props.tags);
  }, [props.query, props.tags, props.searchResults, props.setSearchAfterCursor]);

  return <div className={styles.search_bar}>
    <form onSubmit={onSubmit} method="GET">
      <input type="search" id="query" placeholder={props.query ? props.query : "Search something..."} />
    </form>
    
    <Errors errors={errors} />
  </div>;
}