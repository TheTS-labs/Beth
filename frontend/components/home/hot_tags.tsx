import useSWR from "swr";

import fetcher from "../../lib/fetcher";
import styles from "../../public/styles/pages/home/hot_tags.module.sass";
import Tag from "../tag";

export default function HotTags(): React.JSX.Element {
  const hotTagsResponse = useSWR("recommendation/getHotTags", fetcher<{ result: { tag: string, post_count: string }[] }>({}));
  const hotTags = hotTagsResponse.data?.result || [
    { tag: "#Hot", post_count: "767027" },
    { tag: "#Tags", post_count: "2756" },
    { tag: "#Unavailable", post_count: "26363" },
    { tag: "#Due", post_count: "901743" },
    { tag: "#To", post_count: "15632" },
    { tag: "#Server", post_count: "19563" },
    { tag: "#Error", post_count: "521421" },
    { tag: "._.", post_count: "82642" },
  ];
  const hotTagsElements: React.JSX.Element[] = [];

  if (hotTagsResponse.error) {
    //? Add `div` with error if needed
    hotTagsElements.push(
      <div className={styles.broken_container} key={-1}>
        <p className={styles.broken_text}>Hot Tags unavailable</p>
      </div>
    )
  }

  hotTagsElements.push(...hotTags.map((value, i) => (
    //? ...And then all tags
    //? `.push` and spread operator is used to make `hotTagsElements` variable constant
    <Tag
      reactKey={i}
      hotTagName={value.tag}
      posts={value.post_count}
      broken={hotTagsResponse.error ? true : false}
      loading={hotTagsResponse.isLoading}
    />
  )))

  return <div className={`${styles.hot_tags_container} ${hotTagsResponse.error ? styles.broken_hot_tags : ""}`}>
    <p className={styles.text}>Hot Tags</p>
    <div className={styles.hot_tags}>
      {...hotTagsElements}
    </div>
  </div>;
}
