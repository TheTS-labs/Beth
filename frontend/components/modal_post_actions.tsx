import { useSetAtom } from "jotai";
import React from "react";

import { DetailedPost } from "../../backend/db/models/post";
import useAuthToken from "../lib/hooks/use_auth_token";
import useRequest from "../lib/hooks/use_request";
import styles from "../public/styles/components/actions.module.sass";
import { errorsAtom } from "./common/errors";
import { modalPostAtom } from "./common/post";

export default function ModalPostActions(props: { post: DetailedPost }): React.JSX.Element {
  const authToken = useAuthToken();
  const setModalPost = useSetAtom(modalPostAtom);

  const postDelete = useRequest({ url: "post/delete", data: { id: props.post.id }, errorsAtom });
  const postForceDelete = useRequest({ url: "post/forceDelete", data: { id: props.post.id }, errorsAtom });

  return <div className={styles.buttons}>
    {
      props.post.author == authToken?.payload?.email &&
      <button data-type="green" onClick={(): void => { postDelete.request(); setModalPost(null); }}>Delete</button>
    }
    {
      authToken.payload?.scope?.includes("PostSuperDelete") &&
      <button onClick={(): void => { postDelete.request(); setModalPost(null); }}>Soft delete</button>
    }
    {
      authToken.payload?.scope?.includes("PostForceDelete") &&
      <button onClick={(): void => { postForceDelete.request(); setModalPost(null); }}>FORCE DELETE</button>
    }
  </div>;
}