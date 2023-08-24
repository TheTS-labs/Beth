import { DetailedPost } from "../../backend/db/models/post";
import { MouseEvent, useRef, useState } from "react";
import styles from "../public/styles/components/expanded_post.module.sass";
import Post from "./post";
import useKeyPress from "../lib/hooks/use_key_press";
import useOutside from "../lib/hooks/use_outside";
import modalStyles from "../public/styles/components/modal.module.sass";
import axios from "axios";
import axiosConfig from "../axios.config";
import Errors from "./errors";
import { RequestErrorObject } from "../../backend/common/types";
import { WriteReply } from "./write_reply";

interface Props {
  reactKey: number
  post: DetailedPost
  voteOnClick?: (event: MouseEvent<any, any>) => Promise<void> | void
  broken: boolean
  loading: boolean
  isReply?: boolean
}

export function ExpandedPost(props: Props): React.JSX.Element {
  const [ isOpen, setIsOpen ] = useState(false);
  const [ doRequest, setDoRequest ] = useState(true);
  const modal = useRef(null);
  useOutside(modal, () => setIsOpen(false), []);
  useKeyPress("Escape", () => setIsOpen(false), []);
  const [ replies, setReplies ] = useState<React.JSX.Element[]>([]);
  const [ errors, setErrors ] = useState<string[]>([]);

  if (isOpen && doRequest) {
    (async () => {
      const response = await axios.request<Partial<DetailedPost[]&RequestErrorObject>>({...axiosConfig, ...{
        url: "post/viewReplies", 
        data: new URLSearchParams({ repliesTo: String(props.post.id) })
      }}).then(response => response.data).catch(e => {
        setDoRequest(false);
        setErrors(prevErrors => [...prevErrors, String(e)]);
      });

      if (!response) {
        return;
      }

      if (response.hasOwnProperty("errorMessage")) {
        setDoRequest(false);
        setErrors(prevErrors => [...prevErrors, response.errorMessage]);
        return;
      }

      setDoRequest(false);
      setReplies(response.map(post => (<ExpandedPost 
        reactKey={post.id}
        broken={false}
        loading={false}
        post={post}
        isReply={true}
        voteOnClick={props.voteOnClick}
      />)));
    })()
  }

  return <>
    <Post {...props} onPostClick={() => !props.broken && setIsOpen(true)} />
    {isOpen && <div className={modalStyles.overlay}>
      <div className={modalStyles.modal} ref={modal}>
        <Post {...props} expanded={true} />
        <p className={styles.tags}>#{props.post.tags.replaceAll(",", " #")}</p>
        <hr className={styles.hr}/>
        <WriteReply postId={props.post.id} setDoRequest={setDoRequest} />
        {...replies}
        <h3 className={styles.end}>
          That seems to be all there is, cutie~ <br/>
          <a href="#" onClick={() => setDoRequest(true)}>Retry</a>
        </h3>
      </div>
      <p className={modalStyles.hint}>
        Click anywhere or press Esc to close. Press Esc to close all <br/>
        Of course, you can scroll this window
      </p>
    </div>}

    <Errors errors={errors} />
  </>;
};