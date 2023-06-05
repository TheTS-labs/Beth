import useSWR from "swr";

import { GetPostsReturnType } from "../../../backend/db/models/post";
import fetcher from "../../common/fetcher";
import styles from "../../public/styles/home/page_content.module.sass";
import BrokenPosts from "./posts/broken_posts";
import LoadingPosts from "./posts/loading_posts";
import PageContentPosts from "./posts/posts";

export default function PageContent(): React.JSX.Element {
  const hotTags = useSWR("https://localhost:8081/recommendation/getHotTags", fetcher({ method: "POST" }));
  const initialPosts = useSWR<GetPostsReturnType>("https://localhost:8081/recommendation/getPosts", fetcher({
    method: "POST",
    headers: new Headers({ "Content-Type": "application/x-www-form-urlencoded" }),
    redirect: "follow"
  }));

  if (hotTags.error) {
    const failedHotTags = [
      [1, "#Hot", 767027        ],
      [2, "#Tags", 612642       ],
      [3, "#Unavailable", 552924],
      [4, "#Due", 531910        ],
      [5, "#To", 380074         ],
      [6, "#Server", 207100     ],
      [7, "#Error", 131998      ],
      [8, "._.", 120023         ],
    ];

    return <div className={styles.container}>
      <div className={`${styles.hot_tags_container} ${styles.broken_hot_tags}`}>
        <p className={styles.text}>Hot Tags</p>
        <div className={styles.hot_tags}>
          <div className={styles.broken_container} key={0}>
            <p className={styles.broken_text}>Hot Tags unavailable</p>
          </div>
          {failedHotTags.map(value => {
            return <div className={styles.hot_tag} key={value[0]}>
              <div className={styles.hot_tag_name_and_posts_container}>
                <span className={styles.hot_tag_name}>{value[1]}</span><br />
                <span className={styles.hot_tag_posts}>posts: {value[2]}</span>
              </div>
            </div>;
          })}
        </div>
      </div>
  
      {((): React.JSX.Element => {
        if (initialPosts.error) return <BrokenPosts />;
        if (initialPosts.isLoading) return <LoadingPosts numberRecords={10} />;
        return <PageContentPosts initialData={initialPosts.data} />;
      })()}
    </div>;
  }

  if (hotTags.isLoading) {
    return <div className={styles.container}>
      <div className={styles.hot_tags_container}>
        <p className={styles.text}>Hot Tags</p>
        <div className={styles.hot_tags}>
          {[...Array(8)].map((_, i) => {
            return <div className={styles.hot_tag} key={i}>
                <div className={styles.hot_tag_name_and_posts_container}>
                  <span className={styles.loading}></span><br />
                  <div className={styles.loading_hot_tag_posts}>
                    <span className={styles.hot_tag_posts}>posts: </span> <span className={styles.loading}></span>
                  </div>
              </div>
            </div>;
          })}
        </div>
      </div>
  
      {((): React.JSX.Element => {
        if (initialPosts.error) return <BrokenPosts />;
        if (initialPosts.isLoading) return <LoadingPosts numberRecords={10} />;
        return <PageContentPosts initialData={initialPosts.data} />;
      })()}
    </div>;
  }

  return <div className={styles.container}>
    <div className={styles.hot_tags_container}>
      <p className={styles.text}>Hot Tags</p>
      <div className={styles.hot_tags}>
        {hotTags.data.result.map((value: { tag: string, post_count: string }, i) => {
          return <div className={styles.hot_tag} key={i}>
            <div className={styles.hot_tag_name_and_posts_container}>
              <span className={styles.hot_tag_name}>#{value.tag}</span><br />
              <span className={styles.hot_tag_posts}>posts: {value.post_count}</span>
            </div>
          </div>;
        })}
      </div>
    </div>

    {((): React.JSX.Element => {
      if (initialPosts.error) return <BrokenPosts />;
      if (initialPosts.isLoading) return <LoadingPosts numberRecords={10} />;
      return <PageContentPosts initialData={initialPosts.data} />;
    })()}
  </div>;
}