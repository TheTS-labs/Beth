import { DetailedPost } from "../../../backend/db/models/post";
import styles from "../../public/styles/pages/home/posts.module.sass";
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";
import Loader from "../loader";
import Errors from "../errors";
import voteOnClick from "../../lib/vote_on_click";
import observer from "../../lib/home/observer";
import { ExpandedPost } from "../expanded_post";
import fetchSearchResults from "../../lib/home/search";

interface Props {
  token: string | undefined
  setSearchAfterCursor: Dispatch<SetStateAction<string>>
  setQuery: Dispatch<SetStateAction<string>>
  setTags: Dispatch<SetStateAction<string>>
  searchResults: MutableRefObject<DetailedPost[]>
  searchAfterCursor: string
  query: string
  tags: string
}

export default function SearchPosts(props: Props): React.JSX.Element {
  const [ errors, setErrors ] = useState<string[]>([]);
  const observerTarget = useRef(null);
  const postElements: React.JSX.Element[] = [];

  const clearResults = () => {
    props.searchResults.current = [];
    props.setTags(null);
    props.setSearchAfterCursor(null);
    props.setQuery(null);
  };

  useEffect(observer(observerTarget, fetchSearchResults, [
    props.query,
    setErrors,
    props.setSearchAfterCursor,
    props.searchResults,
    props.tags,
    props.searchAfterCursor
  ]), [props.searchAfterCursor]);

  postElements.push(...props.searchResults.current.map((post, i) => (
    <ExpandedPost 
      reactKey={i}
      post={post}
      broken={false}
      loading={false}
      voteOnClick={voteOnClick(props.token, setErrors)}
    />
  )))

  return <div className={styles.posts}>
    <p className={styles.text} onClick={clearResults} style={{ cursor: "pointer" }}>⬅ Search results</p>
    {...postElements}

    <div className={styles.loader} ref={observerTarget}><Loader /></div>
    <Errors errors={errors} />
  </div>;
}
