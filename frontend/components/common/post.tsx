// Ignore SVG lines
/* eslint-disable max-len */

import { MouseEvent } from "react";
import importedStyles from "../../public/styles/common/post.module.sass";
import { Post } from "../../../backend/db/models/post";
import { User } from "../../../backend/db/models/user";
import { Vote } from "../../../backend/db/models/vote";

interface Props {
  key: number
  post: (
    Omit<Post, "id"> &
    Omit<User, "password" | "id" | "tags"> &
    { 
      _cursor_0: number
      score: number
      userVote: null | boolean | Vote
    }
  )
  voteOnClick?: ((event: MouseEvent<HTMLButtonElement>) => void) |
                ((event: MouseEvent<HTMLButtonElement>) => Promise<void>)
  styles?: {
    readonly [key: string]: string;
  }
}

export default function Post(props: Props): React.JSX.Element {
  const styles = props.styles || importedStyles;
  const voteOnClick = props.voteOnClick || (() => {});
  const userCheckmark = props.post.verified ? <span className={styles.checkmark}>✓</span> 
                                            : <></>;
  const postText = props.post.text.split("\n").map(line => <><br/>{line}</>);

  return <div className={styles.post} key={props.key} data-key={props.key}>
    {/* User information */}
    <div className={styles.user}>
      <div className={styles.username_and_checkmark}>
        <span className={styles.username}>{props.post.displayName}</span>
        {userCheckmark}
      </div>
      <span className={styles.email}>@{props.post.username}</span>
    </div>

    {/* Post itself */}
    <div className={styles.post_container}>
      <p className={styles.post_text}>{postText}</p>
      <div className={styles.voting}>
        <button className={styles.voting_button} data-type="dislike" onClick={voteOnClick} data-vote-type="0" data-post-id={props.post._cursor_0}>
          🤌
        </button>
        <span id={"post_" + props.post._cursor_0 + "_score"}>{props.post.score}</span>
        <button className={styles.voting_button} data-type="like" onClick={voteOnClick} data-vote-type="1" data-post-id={props.post._cursor_0}>
          👍
        </button>
      </div>
    </div>
  </div>;
};