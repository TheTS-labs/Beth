import { faker } from "@faker-js/faker";
import { useAtom } from "jotai";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

import { DetailedPosts } from "../../backend/db/models/post";
import observer from "../lib/common/observer";
import { authTokenAtom } from "../lib/common/token";
import useFetchPosts, { afterCursorAtom, postsAtom, queryAtom, tagsAtom } from "../lib/hooks/use_fetch_posts";
import styles from "../public/styles/pages/posts.module.sass";
import Loader from "./common/loader";
import Post from "./common/post";
import { Write } from "./common/write";

function Posts(): React.JSX.Element {
  const [ token ] = useAtom(authTokenAtom);
  const [ defaultPosts ] = useState<DetailedPosts["results"]>([...Array(10)].map((_, i) => ({
    //? I used `any` instead of `DBBool` just because I can't import it
    //? But, interestingly enough, I can import and use types as long as
    //? they don't go into the JS code, which means they can be used in type definitions.
    //? I guess the reason is that the file is located where WebPack doesn't build it
    // TODO: Resolve it
    // Module parse failed: Unexpected token (6:7)
    // You may need an appropriate loader to handle this file type,
    // currently no loaders are configured to process this file.
    // See https://webpack.js.org/concepts#loaders
    id: i,
    text: faker.lorem.text(), 
    score: faker.number.int({ min: -1000, max: 1000 }),
    displayName: faker.internet.displayName(),
    username: faker.internet.userName(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verified: faker.datatype.boolean() as any,
    userVote: faker.datatype.boolean(),
    author: faker.internet.userName(),
    createdAt: new Date(),
    frozenAt: null,
    repliesTo: null,
    parent: null,
    tags: "",
    email: faker.internet.email(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isFrozen: false as any,
    // eslint-disable-next-line camelcase
    _cursor_0: i
  })));
  const [ afterCursor, setAfterCursor ] = useAtom(afterCursorAtom);
  const [ posts, setPosts ] = useAtom(postsAtom);
  const [ query, setQuery ] = useAtom(queryAtom);
  const [ tags, setTags ] = useAtom(tagsAtom);
  const observerTarget = useRef(null);
  const { callback, error } = useFetchPosts();

  const postElements: React.JSX.Element[] = [];
  const reset = (): void => {
    setPosts([]);
    setAfterCursor(undefined);
    setTags("");
    setQuery("");
  };

  useEffect(() => { callback(); }, [query, tags]);

  useEffect(observer(observerTarget, callback, []), [afterCursor, query, tags]);

  const postsSrc = posts.length == 0 ? defaultPosts : posts;

  if (error && posts.length == 0) {
    postElements.push(<div className={styles.posts_broken_container} key={-1}>
      <p className={styles.broken_text}>Feed unavailable</p>
      <p className={styles.broken_explain}>{
        typeof error === "string" ? error : [
          "The feed is not available right now,",
          "maybe the server is overloaded and therefore cannot respond to the request,",
          "try again sometime later"
        ].join(" ")
      }</p>
    </div>);
  }

  postElements.push(...postsSrc.map((post, i) => 
    <Post
      key={i}
      post={post}
      broken={Boolean(error) && posts.length == 0}
      loading={posts.length == 0 && !error}
    />
  ));

  return <div className={styles.posts}>
    {
      query || tags ? 
      <p className={styles.text} key="search" onClick={reset} style={{ cursor: "pointer" }}>⬅ Search results</p> :
      <p className={styles.text} key="feed">Feed</p>
    }
    { token && <Write placeholder="Your definitely important opinion..." /> }
    {...postElements}

    {/* TODO: Add retry */}
    { !error && <div className={styles.loader} ref={observerTarget}><Loader /></div> }
  </div>;
}

export default dynamic(async () => Promise.resolve(Posts), {
  ssr: false
});