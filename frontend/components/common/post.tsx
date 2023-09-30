import { useSetAtom } from "jotai";
import React, { MouseEvent } from "react";

import { DetailedPost, Post } from "../../../backend/db/models/post";
import { atomWithHash } from "../../lib/common/atomWithHash";
import useVote from "../../lib/hooks/use_vote";
import defaultStyles from "../../public/styles/components/common/post.module.sass";
import expandedStyles from "../../public/styles/components/expanded_post.module.sass";
import Loading from "./loading";

interface Props {
  post: DetailedPost
  broken: boolean
  loading: boolean
  isReply?: boolean
  expanded?: boolean
  onUsernameClick?: (event: MouseEvent<unknown, unknown>) => Promise<void> | void
}

export const modalPostAtom = atomWithHash<null | number>("modalPost", null);

export default function Post(props: Props): React.JSX.Element {
  const { callback } = useVote(props.post.id);
  const setModalPost = useSetAtom(modalPostAtom);

  const styles = props.expanded ? expandedStyles : defaultStyles;
  const userCheckmark = props.post.verified ? <span className={styles.checkmark}>✓</span> : <></>;
  const postText = props.post.text.split("\n").map(line => <><br/>{line}</>);

  return <>
    <div className={styles.post} data-key={props.post.id} data-broken={props.broken} data-reply={props.isReply}>
      {/* User information */}
      <div className={styles.user}>
        <div className={styles.username_and_checkmark}>
          <span className={styles.username}>{props.loading ? <Loading /> : props.post.displayName}</span>
          {userCheckmark}
        </div>
        <span className={styles.email} onClick={props.onUsernameClick}>
          @{props.loading ? <Loading /> : props.post.username}
        </span>
      </div>

      {/* Post itself */}
      <div className={styles.post_container} data-reply={props.isReply}>
        {((): React.JSX.Element => {
          if (props.loading) {
            return <>
              <br/>
              <p className={styles.post_text} onClick={(): void => setModalPost(props.post.id)}>
                <Loading length={Math.random() * (90 - 20) + 20+"%"}/>
              </p>
              <p className={styles.post_text} onClick={(): void => setModalPost(props.post.id)}>
                <Loading length={Math.random() * (90 - 20) + 20+"%"}/>
              </p>
              <p className={styles.post_text} onClick={(): void => setModalPost(props.post.id)}>
                <Loading length={Math.random() * (90 - 20) + 20+"%"}/>
              </p>
              <p className={styles.post_text} onClick={(): void => setModalPost(props.post.id)}>
                <Loading length={Math.random() * (90 - 20) + 20+"%"}/>
              </p>
              <p className={styles.post_text} onClick={(): void => setModalPost(props.post.id)}>
                <Loading length={Math.random() * (90 - 20) + 20+"%"}/>
              </p>
            </>;
          }

          return <p className={styles.post_text} onClick={(): void => setModalPost(props.post.id)}>{postText}</p>;
        })()}
        <div className={styles.voting}>
          <button 
            className={styles.voting_button}
            data-type="dislike"
            onClick={callback}
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
            onClick={callback}
            data-vote-type="1"
            data-post-id={props.post.id}
            disabled={props.loading || props.broken}
          >👍</button>
        </div>
      </div>
    </div>
  </>;
}