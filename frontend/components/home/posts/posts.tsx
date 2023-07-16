// Ignore SVG lines
/* eslint-disable max-len */
import axios from "axios";
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";

import { GetPostsReturnType } from "../../../../backend/db/models/post";
import axiosConfig from "../../../axios.config";
import styles from "../../../public/styles/home/posts/posts.module.sass";
import Errors from "../../common/errors";
import Loader from "../../common/loader";
import Post from "../../common/post";

interface Props {
  initialData: GetPostsReturnType
}

async function fetchPosts(
  afterCursor: string,
  setErrors: Dispatch<SetStateAction<string[]>>,
  setAfterCursor: Dispatch<SetStateAction<string>>,
  setPosts: Dispatch<SetStateAction<GetPostsReturnType["results"]>>,
  showLoader: MutableRefObject<boolean>
): Promise<void> {
  showLoader.current = true;
  const body = new URLSearchParams({ afterCursor });

  const response = await axios.request({...axiosConfig, ...{ url: "recommendation/getPosts", data: body }})
                              .catch(() => {
    showLoader.current = false;
    setErrors(prevErrors => [...prevErrors, "Failed to fetch more posts"]);
  });

  if (!response) {
    return;
  }

  if ("errorStatus" in response.data) {
    showLoader.current = false;
    setErrors(prevErrors => [...prevErrors, `${response.data.errorType}: ${response.data.errorMessage}`]);
    return;
  }

  setAfterCursor(response.data.endCursor);
  setPosts(prevPosts => [...prevPosts, ...response.data.results]);
}

export default function PageContentPosts(props: Props): React.JSX.Element {
  const [ afterCursor, setAfterCursor ] = useState(props.initialData.endCursor);
  const [ errors, setErrors ] = useState<string[]>([]);
  const [ posts, setPosts ] = useState(props.initialData.results);
  const showLoader = useRef(true);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchPosts(afterCursor, setErrors, setAfterCursor, setPosts, showLoader);
        }
      },
      { threshold: 1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [afterCursor]);

  return <div className={styles.posts}>
    <p className={styles.text}>Feed</p>
    
    {posts.map((post, i) => <Post key={i} post={post} voteOnClick={(): void => {
      setErrors(prevErrors => [...prevErrors, "Log In or Sing Up to vote, please"]);
    }} />)}

    <div className={styles.loader} ref={observerTarget}>
      {((): React.JSX.Element => { if (showLoader.current) return <Loader />; })()}
    </div>
    <Errors errors={errors} />
  </div>;
}