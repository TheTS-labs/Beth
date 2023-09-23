import Link from "next/link";
import React, { MouseEvent } from "react";

import Header from "../../components/common/header";
import useAuthToken from "../../lib/common/token";
import styles from "../../public/styles/pages/auth/common.module.sass";
import headerStyles from "../../public/styles/pages/auth/header.module.sass";

export default function LogOut(): React.JSX.Element {
  const authToken = useAuthToken();

  const logout = (_event: MouseEvent<HTMLButtonElement>): void => {
    authToken.remove();
    window.location.replace("/");
  };

  return <>
    <Header>
      <div className={headerStyles.back}>
      <Link href="/">
        <button>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" >
            <g id="return-2--arrow-return-enter-keyboard">
              <path 
                id="Vector" 
                stroke="#3e3e3e" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M.5 9.5h9a4 4 0 1 0 0-8h-3" 
              />
              <path id="Vector_2" stroke="#3e3e3e" strokeLinecap="round" strokeLinejoin="round" d="m3.5 6.5-3 3 3 3" />
            </g>
          </svg>
        </button>
      </Link>
      </div>
    </Header>

    <div className={styles.form_wrap}>
      <h1 className={styles.text}><i>log out here</i></h1>
      <p><i>Do it if you want</i></p>
      <button className={styles.logout} onClick={logout}>Log Out</button>
    </div>
  </>;
}