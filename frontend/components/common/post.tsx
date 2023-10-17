import { PrimitiveAtom, useSetAtom } from "jotai";
import React from "react";

import { DetailedPost, Post } from "../../../backend/db/models/post";
import { atomWithHash } from "../../lib/common/atomWithHash";
import useAuthToken from "../../lib/common/token";
import { modalUserAtom } from "../../lib/hooks/use_fetch_posts";
import useVote from "../../lib/hooks/use_vote";
import defaultStyles from "../../public/styles/components/common/post.module.sass";
import expandedStyles from "../../public/styles/components/expanded_post.module.sass";
import EditableField from "./editable_field";
import Loading from "./loading";

interface Props {
  post: DetailedPost
  broken: boolean
  loading: boolean
  isReply?: boolean
  expanded?: boolean
  editablePostTextAtom?: PrimitiveAtom<string | undefined>
}

export const modalPostAtom = atomWithHash<null | number>("modalPost", null);

export default function Post(props: Props): React.JSX.Element {
  const authToken = useAuthToken();
  const { callback } = useVote(props.post.id);
  const setModalPost = useSetAtom(modalPostAtom);
  const setModalUser = useSetAtom(modalUserAtom);

  const styles = props.expanded ? expandedStyles : defaultStyles;
  const userCheckmark = props.post.verified ? <span className={styles.checkmark}>✓</span> : <></>;
  const postText = props.post.text.split("\n").map(line => <><br/>{line}</>);

  const openModalPost = (): void => {
    setModalUser(null);
    setModalPost(props.post.id);
  };

  const openModalUser = (): void => {
    setModalPost(null);
    setModalUser(props.post.author);
  };

  return <>
    <div className={styles.post} data-key={props.post.id} data-broken={props.broken} data-reply={props.isReply}>
      {/* User information */}
      <div className={styles.user} onClick={openModalUser}>
        <div className={styles.username_and_checkmark}>
          <span className={styles.username}>{props.loading ? <Loading /> : props.post.displayName}</span>
          {userCheckmark}
        </div>
        <span className={styles.email} onClick={openModalUser}>
          @{props.loading ? <Loading /> : props.post.username}
        </span>
      </div>

      {/* Post itself */}
      <div className={styles.post_container} data-reply={props.isReply}>
        {((): React.JSX.Element => {
          if (props.loading) {
            return <>
              <br/>
              {[...Array(5)].map(i => <p className={styles.post_text} onClick={openModalPost} key={i}>
                <Loading length={Math.random() * (90 - 20) + 20+"%"}/>
              </p>)}
            </>;
          }

          if (props.expanded && props.editablePostTextAtom) {
            if (
              props.post.author == authToken?.payload?.email ||
              authToken?.payload?.scope?.includes("PostSuperEdit")
            ) {
              return <p className={styles.post_text}><EditableField valueAtom={props.editablePostTextAtom} /></p>;
            }
          }

          return <p className={styles.post_text} onClick={openModalPost}>{postText}</p>;
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