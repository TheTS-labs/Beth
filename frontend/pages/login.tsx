import axios from "axios";
import Link from "next/link";
import { FormEvent, useState } from "react";

import axiosConfig from "../axios.config";
import Errors from "../components/common/errors";
import Header from "../components/common/header";
import headerStyles from "../public/styles/auth/header.module.sass";
import styles from "../public/styles/auth/singup.module.sass";
import { useCookies } from "react-cookie";

interface Entry {
  value: string
}

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    username: Entry
    displayName: Entry
    email: Entry
    password: Entry
    repeatPassword: Entry
    submit: Entry
  }
}

export default function LogIn(): React.JSX.Element {
  const [ errors, setErrors ] = useState<string[]>([]);
  const [_token, setToken, _removeToken] = useCookies(["AUTH_TOKEN"]);

  const onsubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.target.submit.value = "working, just wait...";

    const body = new URLSearchParams({
      email: e.target.email.value,
      password: e.target.password.value,
      shorthand: "login"
    });

    const response = await axios.request({...axiosConfig, ...{ url: "user/issueToken", data: body }})
                                .catch(e => {
      setErrors(prevErrors => [...prevErrors, String(e)]);
    });

    if (!response) {
      return;
    }

    if ("errorType" in response.data && "errorMessage" in response.data) {
      setErrors(prevErrors => [...prevErrors, response.data.errorMessage]);
      return;
    }

    setToken("AUTH_TOKEN", response.data.token);

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
              <path id="Vector_2" stroke="#3e3e3e" strokeLinecap="round" strokeLinejoin="round" d="m3.5 6.5-3 3 3 3" />
            </g>
          </svg>
        </button>
      </Link>
      </div>
    </Header>

    <div className={styles.form_wrap}>
      <h1 className={styles.text}><i>log in here</i></h1>
      <p><i>Yeah, right here, don't be scared</i></p>
      <form onSubmit={onsubmit}>
        <input type="email" name="email" id="email" placeholder="Email" required/>
        <br />

        <input 
          type="password"
          name="password"
          id="password"
          pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
          placeholder="Password"
          required
        />
        <br />

        <input type="submit" id="submit" value="Looks good" />
      </form>
    </div>

    <Errors errors={errors} />
  </>;
}