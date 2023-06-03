// Ignore SVG lines
/* eslint-disable max-len */
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";

import { RequestErrorObject } from "../../../../backend/common/types";
import { GetPostsReturnType } from "../../../../backend/db/models/post";
import styles from "../../../public/styles/home/posts/posts.module.sass";
import Errors from "../../common/errors";
import Loader from "../../common/loader";

interface Props {
  initialData: GetPostsReturnType
}

function fetchPosts(
  afterCursor: string,
  setErrors: Dispatch<SetStateAction<string[]>>,
  setAfterCursor: Dispatch<SetStateAction<string>>,
  setPosts: Dispatch<SetStateAction<GetPostsReturnType["results"]>>,
  showLoader: MutableRefObject<boolean>
): void {
  showLoader.current = true;
  const headers = new Headers({ "Content-Type": "application/x-www-form-urlencoded" });
  const body = new URLSearchParams({ afterCursor });

  fetch("https://localhost:8081/recommendation/getPosts", {
    method: "POST",
    headers: headers,
    body: body,
    redirect: "follow"
  }).then(async res => res.json() as Promise<GetPostsReturnType | RequestErrorObject>)
    .then(value => {
      if ("errorStatus" in value) {
        showLoader.current = false;
        setErrors(prevErrors => [...prevErrors, `${value.errorType}: ${value.errorMessage}`]);
        return;
      }
      
      setAfterCursor(value.endCursor);
      setPosts(prevPosts => [...prevPosts, ...value.results]);
    })
    .catch(() => {
      showLoader.current = false;
      setErrors(prevErrors => [...prevErrors, "Failed to fetch more posts"]);
    });
}

export default function PageContentPosts(props: Props): JSX.Element {
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
    
    {posts.map((post, i) => {
      return <div className={styles.post} key={i} data-key={i}>
        <div className={styles.user}>
          <div className={styles.username_and_checkmark}>
            <span className={styles.username}>{post.displayName}</span>
            {((): JSX.Element => { if (post.verified) return <span className={styles.checkmark}>✓</span>; })()}
          </div>
          <span className={styles.email}>@{post.username}</span>
        </div>

        <div className={styles.post_container}>
          <p className={styles.post_text}>{post.text.split("\n").map(line => { return <><br />{line}</>; })}</p>
          <div className={styles.voting}>
            <button className={styles.voting_button} data-type="dislike">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" onClick={(): void => {
                setErrors(prevErrors => [...prevErrors, "Log In or Sing Up to vote, please"]);
              }}>
                <g>
                  <path d="M3.37,8.15l2.54,4.06a1.09,1.09,0,0,0,.94.52h0A1.11,1.11,0,0,0,8,11.63V8.72h4.39A1.15,1.15,0,0,0,13.49,7.4l-.8-5.16a1.14,1.14,0,0,0-1.13-1H5a2,2,0,0,0-.9.21l-.72.36" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1={3.37} y1={8.15} x2={3.37} y2={1.84} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1,1.84H3.37a0,0,0,0,1,0,0V8.15a0,0,0,0,1,0,0H1a.5.5,0,0,1-.5-.5V2.34A.5.5,0,0,1,1,1.84Z" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </button>
            <span>{post.score}</span>
            <button className={styles.voting_button} data-type="like">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" onClick={(): void => {
                setErrors(prevErrors => [...prevErrors, "Log In or Sing Up to vote, please"]);
              }}>
                <g>
                  <path d="M3.37,5.85,5.91,1.79a1.09,1.09,0,0,1,.94-.52h0A1.11,1.11,0,0,1,8,2.37V5.28h4.39A1.15,1.15,0,0,1,13.49,6.6l-.8,5.16a1.14,1.14,0,0,1-1.13,1H5a2,2,0,0,1-.9-.21l-.72-.36" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1={3.37} y1={5.85} x2={3.37} y2={12.16} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1,5.85H3.37a0,0,0,0,1,0,0v6.31a0,0,0,0,1,0,0H1a.5.5,0,0,1-.5-.5V6.35A.5.5,0,0,1,1,5.85Z" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>;
    })}

    <div className={styles.loader} ref={observerTarget}>
      {((): JSX.Element => {
        if (showLoader.current) {
          return <Loader />;
        }
      })()}
    </div>
    <Errors errors={errors} />
  </div>;
}