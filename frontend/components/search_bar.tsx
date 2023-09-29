import { useAtom, useSetAtom } from "jotai";
import React, { FormEvent } from "react";

import { afterCursorAtom, postsAtom, queryAtom, tagsAtom } from "../lib/hooks/use_fetch_posts";
import styles from "../public/styles/pages/index.module.sass";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    query: { value: string }
  }
}

const tagsRegex = / tags:\[([a-zA-Z0-9]+(?:,[a-zA-Z0-9]+)*)\]/gm;

export default function SearchBar(): React.JSX.Element {
  const setAfterCursor = useSetAtom(afterCursorAtom);
  const setPosts = useSetAtom(postsAtom);
  const setTags = useSetAtom(tagsAtom);

  const [ query, setQuery ] = useAtom(queryAtom);

  const onSubmit = (event: Event): void => {
    event.preventDefault();

    setPosts([]);
    setAfterCursor(undefined);
    setTags("");
    setQuery("");

    const q = event.target.query.value;

    tagsRegex.lastIndex = 0;
    const regexMatches = tagsRegex.exec(q);
  
    if (regexMatches) {
      setTags(regexMatches[1]);
      setQuery(q.replace(regexMatches[0], ""));
      return;
    }

    setQuery(q);
  };

  return <div className={styles.search_bar}>
    <form onSubmit={onSubmit} method="GET">
      <input type="search" id="query" placeholder={query || "Search something..."} />
    </form>
  </div>;
}