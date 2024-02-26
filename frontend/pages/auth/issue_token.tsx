import axios from "axios";
import { useSetAtom } from "jotai";
import Link from "next/link";
import React, { FormEvent, useEffect, useState } from "react";

import axiosConfig from "../../axios.config";
import { errorsAtom } from "../../components/common/errors";
import Header from "../../components/common/header";
import Loader from "../../components/common/loader";
import useAuthToken from "../../lib/hooks/use_auth_token";
import useRequest from "../../lib/hooks/use_request";
import headerStyles from "../../public/styles/pages/auth/header.module.sass";
import styles from "../../public/styles/pages/auth/issue_token.module.sass";

export default function IssueToken(): React.JSX.Element {
  const authToken = useAuthToken();
  const setErrors = useSetAtom(errorsAtom);
  const [ newToken, setNewToken ] = useState<string | undefined>();

  const { result, loading, error, request } = useRequest({
    url: "permission/view",
    data: { email: authToken?.payload?.email },
    errorsAtom
  });

  useEffect(() => {
    if (authToken?.payload?.email) {
      request();
    }
  }, [authToken?.payload?.email]);

  const onsubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const data = new FormData(e.target as HTMLFormElement);
    const scope = Array.from(data.keys());
    scope.splice(scope.indexOf("currentPassword"), 1);
    scope.splice(scope.indexOf("setAsSessionToken"), 1);

    const response = await axios.request({...axiosConfig, ...{
      url: "user/issueToken",
      data: {
        email: authToken?.payload?.email,
        password: data.get("currentPassword"),
        scope
      }
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

    if (data.get("setAsSessionToken")) {
      authToken.update(response.token);
      window.location.replace("/");
    }

    setNewToken(response.token);
  };

  return <>
    <Header>
      <div className={headerStyles.back}>
        <Link href="/auth/update_data">
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
    </Header>

    <div className={styles.text_container}>
      <h1 className={styles.text}><i>issue new token</i></h1>
      <div className={styles.container}>
        <div className={styles.form_wrap}>
          { !newToken ? <>
            <p><i>choose permissions for new token</i></p>
            <form onSubmit={onsubmit}>
              {((): JSX.Element => {
                if (loading) {
                  return <span className={styles.loader_wrapper}><Loader /></span>;
                }

                if (error || result?.hasOwnProperty("errorMessage")) {
                  return <p className={styles.error}>{result?.errorMessage || error}</p>;
                }

                const permissions = Object.entries(result || {}).map(([key, value]) => {
                  if (key == "email" || key == "id" || !value) {
                    return <></>;
                  }

                  return <span className={styles.permission_checkbox} key={key}>
                    <input type="checkbox" name={key} id={key} />
                    <label htmlFor={key}>{key}</label>
                  </span>;
                });

                return <>
                  <div className={styles.scope}>{...permissions}</div>
                  <input 
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
                    placeholder="Current password"
                    required
                  />
                  <span className={styles.permission_checkbox}>
                    <input type="checkbox" name="setAsSessionToken" id="setAsSessionToken" />
                    <label htmlFor="setAsSessionToken">Set as session token</label>
                  </span>
                  <input type="submit" id="submit" value="Looks good" />
                </>;
              })()}
            </form>
          </> : <>
            <p><i>Here&apos;s your new token</i></p>
            <p className={styles.token}>{newToken}</p>
          </> }
        </div>
      </div>
    </div>
  </>;
}