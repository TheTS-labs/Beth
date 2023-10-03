import React from "react";

import { DetailedPost } from "../../backend/db/models/post";
import useAuthToken from "../lib/common/token";
import useRequest from "../lib/hooks/use_request";
import styles from "../public/styles/components/admins.module.sass";

// TODO: Refactor

export default function ModalPostAdmins(props: { post: DetailedPost }): React.JSX.Element {
  const authToken = useAuthToken();

  const postEdit = useRequest("post/edit", { id: props.post.id }, false);
  const postDelete = useRequest("post/delete", { id: props.post.id }, false);
  const postEditTags = useRequest("post/editTags", { id: props.post.id }, false);
  const postForceDelete = useRequest("post/forceDelete", { id: props.post.id }, false);

  return <div className={styles.buttons}>
    {
      authToken.payload?.scope?.includes("PostSuperEdit") &&
      <button onClick={(): void => {
        const newText = prompt("type new text for this post", props.post.text);

        if (newText === null) {
          return;
        }

        postEdit.request({ newText });
      }}>Edit</button>
    }
    {
      authToken.payload?.scope?.includes("PostSuperDelete") &&
      <button onClick={(): void => postDelete.request()}>Soft delete</button>
    }
    {
      authToken.payload?.scope?.includes("PostSuperTagsEdit") &&
      <button onClick={(): void => {
        const newTags = prompt("Type new tags separating them by comma \n\n Example: tag1,tag2,tag3", props.post.tags);
    
        if (newTags === null) {
          return;
        }
    
        postEditTags.request({ newTags });
      }}>Edit tags</button>
    }
    {
      authToken.payload?.scope?.includes("PostForceDelete") &&
      <button onClick={(): void => postForceDelete.request()}>FORCE DELETE</button>
    }
  </div>;
}