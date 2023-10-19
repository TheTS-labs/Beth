import { atom, useAtom } from "jotai";
import dynamic from "next/dynamic";
import React, { useEffect, useRef } from "react";

import { DetailedPost } from "../../backend/db/models/post";
import observer from "../lib/common/observer";
import useFetchPosts, { modalUserAtom } from "../lib/hooks/use_fetch_posts";
import useKeyPress from "../lib/hooks/use_key_press";
import useOutside from "../lib/hooks/use_outside";
import styles from "../public/styles/components/expanded_post.module.sass";
import modalStyles from "../public/styles/components/modal.module.sass";
import { errorsAtom } from "./common/errors";
import Loader from "./common/loader";
import PostComponent from "./common/post";
import ModalUserAdmins from "./modal_user_admins";

const afterCursorAtom = atom<string | undefined>(undefined);
const postsAtom = atom<DetailedPost[]>([]);

function ModalUser(): React.JSX.Element {
  const [ modalUser, setModalUser ] = useAtom(modalUserAtom);
  const modal = useRef<HTMLDivElement>(null);
  useOutside(modal, () => setModalUser(null), []);
  useKeyPress("Escape", () => setModalUser(null), []);

  const observerTarget = useRef(null);
  const [ afterCursor, setAfterCursor ] = useAtom(afterCursorAtom);
  const [ posts, setPosts ] = useAtom(postsAtom);

  const { request, error } = useFetchPosts({
    url: "post/getUserPosts",
    data: Object.assign({},
      afterCursor ? { afterCursor } : {},
      modalUser ? { email: modalUser } : {},
    ),
    postsAtom,
    afterCursorAtom,
    errorsAtom
  });

  useEffect(() => {
    setPosts([]);
    setAfterCursor(undefined);
  }, [modalUser]);
  useEffect(observer(observerTarget, request, []), [afterCursor, modalUser]);

  return <>
    {modalUser && <div className={modalStyles.overlay}>
      <div className={modalStyles.modal} ref={modal}>
        <ModalUserAdmins />
        {posts.map(post => <PostComponent
          key={post.id}
          post={post}
          broken={false}
          loading={false}
        />)}
        { !error && <div className={styles.loader} ref={observerTarget}><Loader /></div> }
        <h3 className={styles.end}>
          That seems to be all there is, cutie~ <br/>
          <p
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={(): void => { setPosts([]); setAfterCursor(undefined); request(); }}
          >Retry</p>
        </h3>
      </div>
      <p className={modalStyles.hint}>
        Click anywhere or press Esc to close. Of course, you can scroll this window
      </p>
    </div>}
  </>;
}

export default dynamic(async () => Promise.resolve(ModalUser), {
  ssr: false
});