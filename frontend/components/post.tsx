import { MouseEvent, useRef, useState } from "react";
import defaultStyles from "../public/styles/components/post.module.sass";
import expandedStyles from "../public/styles/components/expanded_post.module.sass";
import { DetailedPost, Post } from "../../backend/db/models/post";
import Loading from "./loading";

interface Props {
  reactKey: number
  post: DetailedPost
  voteOnClick?: (event: MouseEvent<any, any>) => Promise<void> | void
  broken: boolean
  loading: boolean
  isReply?: boolean
  expanded?: boolean
  onPostClick?: (event: MouseEvent<any, any>) => Promise<void> | void
}

export default function Post(props: Props): React.JSX.Element {
  const styles = props.expanded ? expandedStyles : defaultStyles;
  const userCheckmark = props.post.verified ? <span className={styles.checkmark}>✓</span> : <></>;
  const postText = props.post.text.split("\n").map(line => <><br/>{line}</>);

  return <>
    <div className={styles.post} key={props.reactKey} data-key={props.reactKey} data-broken={props.broken} data-reply={props.isReply}>
      {/* User information */}
      <div className={styles.user}>
        <div className={styles.username_and_checkmark}>
          <span className={styles.username}>{props.loading ? <Loading /> : props.post.displayName}</span>
          {userCheckmark}
        </div>
        <span className={styles.email}>@{props.loading ? <Loading /> : props.post.username}</span>
      </div>

      {/* Post itself */}
      <div className={styles.post_container} data-reply={props.isReply}>
        {(() => {
          if (props.loading) {
            return <>
              <br/>
              <p className={styles.post_text} onClick={props.onPostClick}><Loading length={(Math.random() * (90 - 50) + 50)+"%"}/></p>
              <p className={styles.post_text} onClick={props.onPostClick}><Loading length={(Math.random() * (90 - 20) + 20)+"%"}/></p>
              <p className={styles.post_text} onClick={props.onPostClick}><Loading length={(Math.random() * (90 - 20) + 20)+"%"}/></p>
              <p className={styles.post_text} onClick={props.onPostClick}><Loading length={(Math.random() * (90 - 50) + 50)+"%"}/></p>
              <p className={styles.post_text} onClick={props.onPostClick}><Loading length={(Math.random() * (90 - 20) + 20)+"%"}/></p>
            </>;
          }

          return <p className={styles.post_text} onClick={props.onPostClick}>{postText}</p>;
        })()}
        <div className={styles.voting}>
          <button 
            className={styles.voting_button}
            data-type="dislike"
            onClick={props.voteOnClick}
            data-vote-type="0"
            data-post-id={props.post.id}
            disabled={props.loading || props.broken}
          >🤌</button>

          <span 
            id={`post_${props.post.id}_score`}
            className={styles[`vote_${props.post.userVote}`]}
          >{props.loading ? <Loading length="3ch" /> : props.post.score || 0}</span>

          <button 
            className={styles.voting_button}
            data-type="like"
            onClick={props.voteOnClick}
            data-vote-type="1"
            data-post-id={props.post.id}
            disabled={props.loading || props.broken}
          >👍</button>
        </div>
      </div>
    </div>
  </>;
};