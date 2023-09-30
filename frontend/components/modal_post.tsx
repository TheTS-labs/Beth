import { faker } from "@faker-js/faker";
import { useAtom } from "jotai";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

import { DetailedPost } from "../../backend/db/models/post";
import useKeyPress from "../lib/hooks/use_key_press";
import useOutside from "../lib/hooks/use_outside";
import useRequest from "../lib/hooks/use_request";
import styles from "../public/styles/components/expanded_post.module.sass";
import modalStyles from "../public/styles/components/modal.module.sass";
import PostComponent, { modalPostAtom } from "./common/post";
import { Write } from "./common/write";

// TODO: Will crash if id not found

function ModalPost(): React.JSX.Element {
  const [ modalPost, setModalPost ] = useAtom(modalPostAtom);
  const fetchPost = useRequest<DetailedPost | {}>("post/view", { id: modalPost }, false);
  const fetchReplies = useRequest<DetailedPost[]>("post/viewReplies", { repliesTo: modalPost }, false);

  useEffect(() => {
    if (modalPost) {
      fetchPost.request();
      fetchReplies.request();
    }
  }, [modalPost]);

  const modal = useRef<HTMLDivElement>(null);
  useOutside(modal, () => setModalPost(null), []);
  useKeyPress("Escape", () => setModalPost(null), []);

  const [ defaultPost ] = useState<DetailedPost>({
    //? I used `any` instead of `DBBool` just because I can't import it
    //? But, interestingly enough, I can import and use types as long as
    //? they don't go into the JS code, which means they can be used in type definitions.
    //? I guess the reason is that the file is located where WebPack doesn't build it
    // TODO: Resolve it
    // Module parse failed: Unexpected token (6:7)
    // You may need an appropriate loader to handle this file type,
    // currently no loaders are configured to process this file.
    // See https://webpack.js.org/concepts#loaders
    id: modalPost || 1,
    text: faker.lorem.text(), 
    score: faker.number.int({ min: -1000, max: 1000 }),
    displayName: faker.internet.displayName(),
    username: faker.internet.userName(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verified: faker.datatype.boolean() as any,
    userVote: faker.datatype.boolean(),
    author: faker.internet.email(),
    repliesTo: null,
    tags: "123,456",
    // eslint-disable-next-line camelcase
    _cursor_0: modalPost || 1
  });

  return <>
    {modalPost && <div className={modalStyles.overlay}>
      <div className={modalStyles.modal} ref={modal}>
        <PostComponent
          post={
            !fetchPost.result || Object.keys(fetchPost.result).length == 0 ?
            defaultPost :
            fetchPost.result as DetailedPost
          }
          loading={fetchPost.loading}
          broken={Boolean(fetchPost.error)}
          expanded={true}
        />
        <p className={styles.tags}>#{(fetchPost.result as DetailedPost)?.tags.replaceAll(",", " #")}</p>
        <hr className={styles.hr}/>
        <Write
          replyTo={(fetchPost.result as DetailedPost)?.id || -1}
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
      </p>
    </div>}
  </>;
}

export default dynamic(async () => Promise.resolve(ModalPost), {
  ssr: false
});