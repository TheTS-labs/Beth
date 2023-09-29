/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Dispatch, MouseEvent,SetStateAction, useEffect, useRef, useState } from "react";

import { DetailedPost, DetailedPosts } from "../../backend/db/models/post";
import observer from "../lib/common/observer";
import FetchPosts from "../lib/home/fetch_posts_";
import Loader from "./common/loader";

interface SelfProps {
  post: DetailedPost
  voteOnClick?: (event: MouseEvent<any, any>) => Promise<void> | void
  broken: boolean
  loading: boolean
  isReply?: boolean
}

interface Props {
  username: string
  setErrors: Dispatch<SetStateAction<string[]>>
  Self: (props: SelfProps) => React.JSX.Element
  voteOnClick?: (event: MouseEvent<any, any>) => Promise<void> | void
}

export function ExpandedUser(props: Props): React.JSX.Element {
  const posts = useRef<DetailedPosts["results"]>([]);
  const [ afterCursor, setAfterCursor ] = useState<string | undefined>();
  const observerTarget = useRef(null);
  const fetch = new FetchPosts(afterCursor, props.setErrors, setAfterCursor, undefined, props.username);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(observer(
    observerTarget,
    async (posts) => fetch.request(posts),
    [ posts ]
  ), [afterCursor]);
  useEffect(() => {
    //? Note: In dev this code will run twice because of React Strict mode
    //? So first 20 posts will be the same 10 posts from this request
    //? But only in dev

    if (!afterCursor) {
      fetch.request(posts, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postElements: React.JSX.Element[] = posts.current.map((post, i) => 
    <props.Self 
      key={i}
      post={post}
      broken={false}
      loading={false}
      voteOnClick={props.voteOnClick}
      isReply={true}
    />
  );

  return <>
    <h1>The posts of @{props.username}, enjoy</h1>
    {...postElements}
    <div ref={observerTarget}><Loader /></div>
  </>;
}