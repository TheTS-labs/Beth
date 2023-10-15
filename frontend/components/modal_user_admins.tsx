import { useAtomValue } from "jotai";
import React, { useEffect } from "react";

import useAuthToken from "../lib/common/token";
import { modalUserAtom } from "../lib/hooks/use_fetch_posts";
import useRequest from "../lib/hooks/use_request";
import styles from "../public/styles/components/actions.module.sass";

// TODO: Refactor

export default function ModalUserAdmins(): React.JSX.Element {
  const authToken = useAuthToken();
  const modalUser = useAtomValue(modalUserAtom);

  const userSuperView = useRequest("user/superView", { email: modalUser });
  const userVerify = useRequest("user/verify", { email: modalUser });
  const userFroze = useRequest("user/froze", { email: modalUser });
  const userEditTags = useRequest("user/editTags", { email: modalUser });
  const userGrantPermission = useRequest("permission/grant", { grantTo: modalUser });
  const userRescindPermission = useRequest("permission/rescind", { rescindFrom: modalUser });

  useEffect(() => userSuperView.request(), [modalUser]);

  const editTags = (): void => {
    const tags = prompt("Type new tags separating them by comma \n\n Example: tag1,tag2,tag3");

    if (tags === null) {
      return;
    }

    userEditTags.request({ newTags: tags });
  };

  const grandPermission = (): void => {
    const permission = prompt("Type permission name you want to grant \n\nExample: UserView");

    if (permission === null) {
      return;
    }

    userGrantPermission.request({ grantPermission: permission });
  };

  const rescindPermission = (): void => {
    const permission = prompt("Type permission name you want to rescind \n\nExample: UserView");

    if (permission === null) {
      return;
    }

    userRescindPermission.request({ rescindPermission: permission });
  };

  return <div className={styles.buttons}>
    {
      authToken.payload?.scope?.includes("UserSuperView") && <div>
        {Object.entries(userSuperView.result || {}).map(([key, value]) => <p key={key}>
          {key}: {value as string | number}
        </p>)}
      </div>
    }
    {
      authToken.payload?.scope?.includes("UserVerify") && <>
        <button onClick={(): void => userVerify.request({ verify: 1 })}>Verify</button>
        <button onClick={(): void => userVerify.request({ verify: 0 })}>Unverify</button>
      </>
    }
    {
      authToken.payload?.scope?.includes("UserSuperFroze") && <>
        <button onClick={(): void => userFroze.request({ froze: 1 })}>Froze</button>
        <button onClick={(): void => userFroze.request({ froze: 0 })}>Unfroze</button>
      </>
    }
    {
      authToken.payload?.scope?.includes("UserEditTags") &&
      <button onClick={editTags}>Edit tags</button>
    }
    {
      authToken.payload?.scope?.includes("PermissionGrand") &&
      <button onClick={grandPermission}>Grand permission</button>
    }
    {
      authToken.payload?.scope?.includes("PermissionRescind") &&
      <button onClick={rescindPermission}>Rescind permission</button>
    }
  </div>;
}