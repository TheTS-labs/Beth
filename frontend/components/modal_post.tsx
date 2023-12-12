import { atom, useAtom, useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef } from "react";

import { DetailedPost } from "../../backend/db/models/post";
import useAuthToken from "../lib/hooks/use_auth_token";
import useKeyPress from "../lib/hooks/use_key_press";
import useOutside from "../lib/hooks/use_outside";
import useRequest from "../lib/hooks/use_request";
import styles from "../public/styles/components/expanded_post.module.sass";
import modalStyles from "../public/styles/components/modal.module.sass";
import EditableField from "./common/editable_field";
import { errorsAtom } from "./common/errors";
import PostComponent, { modalPostAtom } from "./common/post";
import { Write } from "./common/write";
import ModalPostActions from "./modal_post_actions";

function ModalPost(): React.JSX.Element {
  const authToken = useAuthToken();
  const [ modalPost, setModalPost ] = useAtom(modalPostAtom);
  const fetchPost = useRequest<DetailedPost>({ url: "post/view", data: { id: modalPost }, errorsAtom });
  const editPost = useRequest<DetailedPost>({ url: "post/edit", data: { id: modalPost }, errorsAtom });
  const editPostTags = useRequest<DetailedPost>({ url: "post/editTags", data: { id: modalPost }, errorsAtom });
  const fetchReplies = useRequest<DetailedPost[]>({
    url: "post/viewReplies",
    data: { repliesTo: modalPost },
    errorsAtom
  });
  const editablePostTextAtom = useMemo(() => atom(fetchPost.result?.text), [fetchPost.result?.text]);
  const editablePostText = useAtomValue(editablePostTextAtom);

  const editablePostTagsAtom = useMemo(() => 
    atom<string | undefined>(`#${(fetchPost.result?.tags || "").replaceAll(",", " #")}`
  ), [fetchPost.result?.tags]);
  const editablePostTags = useAtomValue(editablePostTagsAtom);

  useEffect(() => {
    if (!fetchPost.result || !editablePostText) {
      return;
    }

    if (Object.keys(fetchPost.result).length == 0) {
      return;
    }

    if (editablePostText == fetchPost.result?.text) {
      return;
    }

    editPost.request({ newText: editablePostText });
  }, [editablePostText]);

  useEffect(() => {
    if (!fetchPost.result || !editablePostTags) {
      return;
    }

    if (Object.keys(fetchPost.result).length == 0) {
      return;
    }

    if (editablePostTags == fetchPost.result?.tags) {
      return;
    }

    const newTags = editablePostTags.replaceAll(" #", ",").slice(1);

    editPostTags.request({ newTags });
  }, [editablePostTags]);

  useEffect(() => {
    if (modalPost) {
      fetchPost.request();
      fetchReplies.request();
    }
  }, [modalPost]);

  const modal = useRef<HTMLDivElement>(null);
  useOutside(modal, () => setModalPost(null), []);
  useKeyPress("Escape", () => setModalPost(null), []);

  return <>
    {modalPost && <div className={modalStyles.overlay}>
      <div className={modalStyles.modal} ref={modal}>
        {
          !fetchPost.result || Object.keys(fetchPost.result).length == 0 ?
          <p>An error occurred =(</p> :
          <>
            <PostComponent
              post={fetchPost.result}
              loading={fetchPost.loading}
              broken={Boolean(fetchPost.error)}
              expanded={true}
              editablePostTextAtom={editablePostTextAtom}
            />

            <ModalPostActions post={fetchPost.result } />
          </>
        }

        {((): React.JSX.Element => {
          if (
            fetchPost?.result &&
            authToken?.payload?.email == fetchPost?.result?.author ||
            authToken?.payload?.scope?.includes("PostSuperTagsEdit")
          ) {
            return <p className={styles.tags}><EditableField valueAtom={editablePostTagsAtom}/></p>;
          }
          return <p className={styles.tags}>{(fetchPost.result as DetailedPost)?.tags.replaceAll(",", " #")}</p>;
        })()}
        <hr className={styles.hr}/>
        <Write
          replyTo={(fetchPost?.result as DetailedPost)?.id || -1}
          setDoRequest={(): void => { fetchReplies.setResult([]); fetchReplies.request(); }}
          placeholder="Your comment..."
        />
        {(fetchReplies.result || []).map(post => <PostComponent 
          key={post.id}
          broken={false}
          loading={false}
          post={post}
          isReply={true}
        />)}
        <h3 className={styles.end}>
          That seems to be all there is, cutie~ <br/>
          <p
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={(): void => { fetchReplies.setResult([]); fetchReplies.request(); }}
          >Retry</p>
        </h3>
      </div>
      <p className={modalStyles.hint}>
        Click anywhere or press Esc to close. Of course, you can scroll this window
        <br />
        Click on post text or tags to edit
      </p>
    </div>}
  </>;
}

export default dynamic(async () => Promise.resolve(ModalPost), {
  ssr: false
});