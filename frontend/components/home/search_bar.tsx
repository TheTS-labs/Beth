import { Dispatch, FormEvent, MutableRefObject, SetStateAction, useState } from "react";
import styles from "../../public/styles/pages/home/index.module.sass";
import { DetailedPost } from "../../../backend/db/models/post";
import fetchSearchResults from "../../lib/home/search";
import Errors from "../errors";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    query: { value: string }
  }
}

interface Props {
  setSearchAfterCursor: Dispatch<SetStateAction<string>>
  searchResults: MutableRefObject<DetailedPost[]>
  query: MutableRefObject<string>
}

export default function SearchBar(props: Props): React.JSX.Element {
  const [ errors, setErrors ] = useState<string[]>([]);

  const onSubmit = (event: Event) => {
    event.preventDefault();
    if (props.query.current) {
      props.searchResults.current = [];
    }
    fetchSearchResults(event.target.query.value, setErrors, props.setSearchAfterCursor, props.searchResults);
    props.query.current = event.target.query.value;
  }

  return <div className={styles.search_bar}>
    <form onSubmit={onSubmit} method="GET">
      <input type="search" id="query" placeholder="Search something..." />
    </form>
    
    <Errors errors={errors} />
  </div>;
}