/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Dispatch, MouseEvent,SetStateAction, useEffect, useRef, useState } from "react";

import { DetailedPost, DetailedPosts } from "../../backend/db/models/post";
import fetchUserPosts from "../lib/home/fetch_user_posts";
import observer from "../lib/home/observer";
import Loader from "./loader";

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
  const [ afterCursor, setAfterCursor ] = useState<string | null>(null);
  const observerTarget = useRef(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(observer(
    observerTarget,
    fetchUserPosts,
    [ afterCursor, props.setErrors, setAfterCursor, posts, props.username ]
  ), [afterCursor]);
  useEffect(() => {
    //? Note: In dev this code will run twice because of React Strict mode
    //? So first 20 posts will be the same 10 posts from this request
    //? But only in dev

    if (!afterCursor) {
      fetchUserPosts(afterCursor, props.setErrors, setAfterCursor, posts, props.username, true);
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