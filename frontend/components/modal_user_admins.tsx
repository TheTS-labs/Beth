import { useAtomValue } from "jotai";
import React, { useEffect } from "react";

import useAuthToken from "../lib/common/token";
import { modalUserAtom } from "../lib/hooks/use_fetch_posts";
import useRequest from "../lib/hooks/use_request";
import styles from "../public/styles/components/actions.module.sass";
import { errorsAtom } from "./common/errors";

// TODO: Refactor

export default function ModalUserAdmins(): React.JSX.Element {
  const authToken = useAuthToken();
  const modalUser = useAtomValue(modalUserAtom);

  const userSuperView = useRequest({ url: "user/superView", data: { email: modalUser }, errorsAtom });
  const userVerify = useRequest({ url: "user/verify", data: { email: modalUser }, errorsAtom });
  const userFroze = useRequest({ url: "user/froze", data: { email: modalUser }, errorsAtom });
  const userEditTags = useRequest({ url: "user/editTags", data: { email: modalUser }, errorsAtom });
  const userGrantPermission = useRequest({ url: "permission/grant", data: { grantTo: modalUser }, errorsAtom });
  const userRescindPermission = useRequest({ url: "permission/rescind", data: { rescindFrom: modalUser }, errorsAtom });

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