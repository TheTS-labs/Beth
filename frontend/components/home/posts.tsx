import { faker } from "@faker-js/faker";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { DBBool, RequestErrorObject } from "../../../backend/common/types";
import { DetailedPosts } from "../../../backend/db/models/post";
import fetcher from "../../lib/fetcher";
import fetchPosts from "../../lib/home/fetch_posts";
import observer from "../../lib/home/observer";
import voteOnClick from "../../lib/vote_on_click";
import styles from "../../public/styles/pages/home/posts.module.sass";
import Errors from "../errors";
import { ExpandedPost } from "../expanded_post";
import Loader from "../loader";

export default function Posts(props: { token: string | undefined }): React.JSX.Element {
  const postsResponse = useSWR(
    props.token ? "recommendation/recommend" : "recommendation/globalRecommend",
    //? If I leave the type definition as `DetailedPosts|RequestErrorObject`,
    //? I put myself in a position where I first need to be sure of the type
    //? before I start working, because there is no overlap between the types.
    //? On the other hand, if I set the type to `Partial<DetailedPosts&RequestErrorObject>`,
    //? it will allow me to use errorMessage on the assumption that both non-required variants
    //? can exist and if one doesn't exist, the other does, without having to prove it directly.
    // I hope I've made myself clear
    // Big brain move, I know
    fetcher<Partial<DetailedPosts&RequestErrorObject>>(
      props.token ? { headers: { "Authorization": `Bearer ${props.token}` } } : {}
    )
  );
  const [defaultPosts] = useState<DetailedPosts["results"]>([...Array(10)].map((_, i) => ({
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
    verified: faker.datatype.boolean() as unknown as DBBool,
    userVote: faker.datatype.boolean(),
    author: faker.internet.userName(),
    createdAt: new Date(),
    frozenAt: null,
    repliesTo: null,
    parent: null,
    tags: "",
    email: faker.internet.email(),
    isFrozen: DBBool.No,
    // eslint-disable-next-line camelcase
    _cursor_0: i
  })));
  const [ afterCursor, setAfterCursor ] = useState<string | null>(null);
  const [ errors, setErrors ] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const posts = useRef<DetailedPosts["results"]>(defaultPosts);
  const observerTarget = useRef(null);
  const postElements: React.JSX.Element[] = [];

  useEffect(() => setIsClient(true), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(observer(
    observerTarget,
    fetchPosts,
    [ afterCursor, setErrors, setAfterCursor, posts, props.token ]
  ), [afterCursor]);

  if (isClient) {
    if (postsResponse.data?.results && posts.current == defaultPosts) {
      posts.current = postsResponse.data?.results;
    }
    if (!afterCursor && postsResponse.data?.endCursor) {
      setAfterCursor(postsResponse.data?.endCursor);
    }

    if (postsResponse.error || postsResponse.data?.hasOwnProperty("errorMessage")) {
      postElements.push(<div className={styles.posts_broken_container} key={-1}>
        <p className={styles.broken_text}>Feed unavailable</p>
        <p className={styles.broken_explain}>{
          postsResponse.data?.errorMessage||[
            "The feed is not available right now,",
            "maybe the server is overloaded and therefore cannot respond to the request,",
            "try again sometime later"
          ].join(" ")
        }</p>
      </div>);
    }
  
    postElements.push(...posts.current.map((post, i) => 
      <ExpandedPost
        key={i}
        post={post}
        broken={Boolean(postsResponse.error || postsResponse.data?.hasOwnProperty("errorMessage"))}
        loading={postsResponse.isLoading}
        voteOnClick={voteOnClick(props.token, setErrors)}
      />
    ));
  }

  return <div className={styles.posts}>
    <p className={styles.text}>Feed</p>
    {...postElements}

    <div className={styles.loader} ref={observerTarget}><Loader /></div>
    <Errors errors={errors} />
  </div>;
}
