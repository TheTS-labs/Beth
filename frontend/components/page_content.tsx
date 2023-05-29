import styles from "../public/styles/page_content.module.sass"
import PageContentPosts from "./page_content_posts"
import useSWR from 'swr';
import { useEffect, useState } from "react";

interface Props {
  posts: {
    username: string;
    checkmark: boolean;
    email: string;
    text: string;
    score: number;
  }[]
}

const fetcher = (params: RequestInit) => (url: RequestInfo | URL) => fetch(url, params).then((res) => res.json());

export default function PageContent(props: Props): JSX.Element {
  const { data, error, isLoading } = useSWR("https://localhost:8081/recommendation/getHotTags", fetcher({ method: "POST" }))

  if (error) {
    const failedHotTags = [
      [1, "#Hot", 767027        ],
      [2, "#Tags", 612642       ],
      [3, "#Unavailable", 552924],
      [4, "#Due", 531910        ],
      [5, "#To", 380074         ],
      [6, "#Server", 207100     ],
      [7, "#Error", 131998      ],
      [8, "._.", 120023         ],
    ]

    return (<div className={styles.container}>
      <div className={`${styles.hot_tags_container} ${styles.broken_hot_tags}`}>
        <p className={styles.text}>Hot Tags</p>
        <div className={styles.hot_tags}>
          <div className={styles.broken_container} key={0}>
            <p className={styles.broken_text}>Hot Tags unavailable</p>
          </div>
          {failedHotTags.map(value => {
            return (<div className={styles.hot_tag} key={value[0]}>
              <div className={styles.hot_tag_name_and_posts_container}>
                <span className={styles.hot_tag_name}>{value[1]}</span><br />
                <span className={styles.hot_tag_posts}>posts: {value[2]}</span>
              </div>
            </div>)
          })}
        </div>
      </div>
  
      <PageContentPosts posts={props.posts} />
    </div>)
  }

  if (isLoading) {
    return (<div className={styles.container}>
      <div className={styles.hot_tags_container}>
        <p className={styles.text}>Hot Tags</p>
        <div className={styles.hot_tags}>
          {[...Array(8)].map((_, i) => {
            return (<div className={styles.hot_tag} key={i}>
                <div className={styles.hot_tag_name_and_posts_container}>
                  <span className={styles.loading}></span><br />
                  <div className={styles.loading_hot_tag_posts}>
                  <span className={styles.hot_tag_posts}>posts: </span> <span className={styles.loading}></span>
                </div>
              </div>
            </div>)
          })}
        </div>
      </div>
  
      <PageContentPosts posts={props.posts} />
    </div>)
  }

  return (<div className={styles.container}>
    <div className={styles.hot_tags_container}>
      <p className={styles.text}>Hot Tags</p>
      <div className={styles.hot_tags}>
        {data.result.map((value: { tag: string, post_count: string }, i) => {
          return (<div className={styles.hot_tag} key={i}>
            <div className={styles.hot_tag_name_and_posts_container}>
              <span className={styles.hot_tag_name}>{value.tag}</span><br />
              <span className={styles.hot_tag_posts}>posts: {value.post_count}</span>
            </div>
          </div>)
        })}
      </div>
    </div>

    <PageContentPosts posts={props.posts} />
  </div>)
}