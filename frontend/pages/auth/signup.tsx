import axios from "axios";
import Link from "next/link";
import React, { FormEvent, useState } from "react";

import axiosConfig from "../../axios.config";
import Errors from "../../components/common/errors";
import Header from "../../components/common/header";
import styles from "../../public/styles/pages/auth/common.module.sass";
import headerStyles from "../../public/styles/pages/auth/header.module.sass";

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

export default function Singup(): React.JSX.Element {
  const [ errors, setErrors ] = useState<string[]>([]);

  const onsubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.target.submit.value = "working, just wait...";

    const passwordsMatch = e.target.password.value === e.target.repeatPassword.value;
    if (!passwordsMatch) {
      setErrors(prevErrors => [...prevErrors, "Passwords don't match"]);
      return;
    }

    const body = new URLSearchParams({
      username: e.target.username.value,
      displayName: e.target.displayName.value,
      email: e.target.email.value,
      password: e.target.password.value,
      repeatPassword: e.target.repeatPassword.value
    });

    const response = await axios.request({...axiosConfig, ...{ url: "user/create", data: body }})
                                .then(response => response.data)
                                .catch(e => {
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
              <path id="Vector_2" stroke="#3e3e3e" strokeLinecap="round" strokeLinejoin="round" d="m3.5 6.5-3 3 3 3" />
            </g>
          </svg>
        </button>
      </Link>
      </div>
    </Header>

    <div className={styles.form_wrap}>
      <h1 className={styles.text}><i>sign up here</i></h1>
      <p><i>Then, don&apos;t forget to Log In</i></p>
      <form onSubmit={onsubmit}>
        <input type="text" name="username" id="username" placeholder="Username" required/>
        <br />

        <input type="text" name="displayName" id="displayName" placeholder="Display name" required/>
        <br />

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

        <input
          type="password" 
          name="repeatPassword" 
          id="repeatPassword" 
          pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$" 
          placeholder="Repeat password" 
          required
        />
        <br />

        <input type="submit" id="submit" value="Looks good" />
      </form>
    </div>

    <Errors errors={errors} />
  </>;
}