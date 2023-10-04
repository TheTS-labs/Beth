import React from "react";

import { DetailedPost } from "../../backend/db/models/post";
import useAuthToken from "../lib/common/token";
import useRequest from "../lib/hooks/use_request";
import styles from "../public/styles/components/admins.module.sass";

// TODO: Refactor

export default function ModalPostAdmins(props: { post: DetailedPost }): React.JSX.Element {
  const authToken = useAuthToken();

  const postDelete = useRequest("post/delete", { id: props.post.id }, false);
  const postForceDelete = useRequest("post/forceDelete", { id: props.post.id }, false);

  return <div className={styles.buttons}>
    {
      authToken.payload?.scope?.includes("PostSuperDelete") &&
      <button onClick={(): void => postDelete.request()}>Soft delete</button>
    }
    {
      authToken.payload?.scope?.includes("PostForceDelete") &&
      <button onClick={(): void => postForceDelete.request()}>FORCE DELETE</button>
    }
  </div>;
}