import { useCookies } from "react-cookie";
import Header from "../components/common/header";
import headerStyles from "../public/styles/auth/header.module.sass";
import Link from "next/link";
import Errors from "../components/common/errors";
import { useState, MouseEvent, useEffect } from "react";
import styles from "../public/styles/auth/main.module.sass";

export default function LogOut() {
  const [ errors, setErrors ] = useState<string[]>([]);
  const [token, _setToken, removeToken] = useCookies(["AUTH_TOKEN"]);
  const [ disabled, setDisabled ] = useState(false);

  useEffect(() => {
    console.log(!token.AUTH_TOKEN)
    if (!token.AUTH_TOKEN) {
      setErrors(prevErrors => [...prevErrors, "You can't log out, because you are not logged in"]);
      setDisabled(true);
    }
  }, [])

  const logout = (event: MouseEvent<HTMLButtonElement>) => {
    removeToken("AUTH_TOKEN");
    window.location.replace("/");
  }

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
      <button className={styles.logout} disabled={disabled} onClick={logout}>Log Out</button>
    </div>

    <Errors errors={errors} />
  </>;
}