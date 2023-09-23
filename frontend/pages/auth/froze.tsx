import axios from "axios";
import Link from "next/link";
import React, { MouseEvent, useState } from "react";

import axiosConfig from "../../axios.config";
import Errors from "../../components/common/errors";
import Header from "../../components/common/header";
import useAuthToken from "../../lib/common/token";
import styles from "../../public/styles/pages/auth/common.module.sass";
import headerStyles from "../../public/styles/pages/auth/header.module.sass";

export default function Froze(): React.JSX.Element {
  const authToken = useAuthToken();
  const [ errors, setErrors ] = useState<string[]>([]);

  const froze = async (_event: MouseEvent<HTMLButtonElement>): Promise<void> => {
    const confirmed = confirm([
      "Are you sure you understand what I'm saying?\n\n",
      "If you freeze the account, there's no way you can unfreeze it yourself"
    ].join(""));

    if (!confirmed) {
      return;
    }
    
    const response = await axios.request({...axiosConfig, ...{
      url: "user/froze",
      headers: { Authorization: `Bearer ${authToken.value}` }
    }}).then(response => response.data).catch(e => {
      setErrors(prevErrors => [...prevErrors, String(e)]);
    });

    if (!response) {
      return;
    }

    if (response.hasOwnProperty("errorMessage")) {
      setErrors(prevErrors => [...prevErrors, response.errorMessage]);
      return;
    }

    if (response.success) {
      authToken.remove();
      window.location.replace("/");
    }
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
      <h1 className={styles.text}><i>froze your account here</i></h1>
      <p><i>Important note: You won&apos;t be able to undo it yourself</i></p>
      <button className={styles.logout} onClick={froze}>Froze account</button>
    </div>

    <Errors errors={errors} />
  </>;
}