import axios from "axios";
import { useSetAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FormEvent } from "react";
import useSWR from "swr";

import axiosConfig from "../../axios.config";
import Errors, { errorsAtom } from "../../components/common/errors";
import Header from "../../components/common/header";
import fetcher from "../../lib/common/fetcher";
import useAuthToken from "../../lib/common/token";
import headerStyles from "../../public/styles/pages/auth/header.module.sass";
import styles from "../../public/styles/pages/auth/update_data.module.sass";

interface Entry {
  value: string
}

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    username: Entry
    displayName: Entry
    password: Entry
    currentPassword: Entry
    submit: Entry
  }
}

export default function App(): React.JSX.Element {
  const authToken = useAuthToken();
  const router = useRouter();
  const dataResponse = useSWR(
    "user/view",
    fetcher({
      headers: { "Authorization": `Bearer ${authToken.value}` },
      data: router.query
    })
  );
  const setErrors = useSetAtom(errorsAtom);

  const onsubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.target.submit.value = "working, just wait...";

    const passwordsMatch = e.target.password.value === e.target.currentPassword.value;
    if (passwordsMatch) {
      setErrors(prevErrors => [...prevErrors, "New and Current passwords match"]);
      return;
    }

    const body = new URLSearchParams({
      password: e.target.currentPassword.value
    });

    if (e.target.username.value !== "") {
      body.append("edit[username]", e.target.username.value);
    }
    if (e.target.displayName.value !== "") {
      body.append("edit[displayName]", e.target.displayName.value);
    }
    if (e.target.password.value !== "") {
      body.append("edit[password]", e.target.password.value);
    }

    const response = await axios.request({...axiosConfig, ...{
      url: "user/edit",
      data: body,
      headers: { "Authorization": `Bearer ${authToken.value}` }
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

    e.target.submit.value = "done, redirecting...";
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
                <path
                  id="Vector_2"
                  stroke="#3e3e3e"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3.5 6.5-3 3 3 3"
                />
              </g>
            </svg>
          </button>
        </Link>
      </div>
      <div className={styles.froze_account}>
        <Link href="/auth/froze" className={styles.froze_account}>
          <button>Froze account</button>
        </Link>
        <Link href={{ pathname: "/auth/issue_token", query: router.query }} className={styles.froze_account}>
          <button>Issue new token</button>
        </Link>
      </div>
    </Header>

    <div className={styles.text_container}>
    <h1 className={styles.text}><i>update data here</i></h1>
    <div className={styles.container}>
      <div className={styles.form_wrap}>
        <p><i>You can update your profile data here</i></p>
        <form onSubmit={onsubmit}>
          <input 
            type="password"
            name="currentPassword"
            id="currentPassword"
            pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
            placeholder="Current password"
            required
          />
          <hr />
          <br />

          <input 
            type="password"
            name="password"
            id="password"
            pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
            placeholder="New password"
          />
          <br />

          <input type="text" name="username" id="username" placeholder="New username"/>
          <br />

          <input type="text" name="displayName" id="displayName" placeholder="New display name"/>
          <br />

          <input type="submit" id="submit" value="Looks good" />
        </form>
      </div>
      <div className={styles.form_wrap}>
        <p><i>Current profile data here</i></p>
        <form>
          <input 
            type="text"
            name="password"
            id="password"
            value="Password hidden"
            readOnly
          />
          <br />

          <input
            type="text" 
            name="username" 
            id="username" 
            value={`@${dataResponse.data?.username || "..."}`} 
            readOnly
          />
          <br />

          <input
            type="text"
            name="displayName"
            id="displayName"
            value={dataResponse.data?.displayName || "..."}
            readOnly
          />
          <br />
          <input type="text" className={styles.placeholder} />
          <br />
        </form>
      </div>
    </div>
    </div>

    <Errors />
  </>;
}