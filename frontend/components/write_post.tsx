import React, { FormEvent, useState } from "react";
import { useCookies } from "react-cookie";

import write from "../lib/write";
import styles from "../public/styles/components/write_reply.module.sass";
import Errors from "./errors";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    text: { value: string }
    submit: { value: string }
  }
}

export function WritePost(): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const [ errors, setErrors ] = useState<string[]>([]);

  const onSubmit = (event: Event): void => {
    event.preventDefault();
    event.target.submit.value = "Sending...";
    write(event.target.text.value, setErrors, token.AUTH_TOKEN).then(result => {
      if (result) {
        event.target.text.value = "";
        event.target.submit.value = "Done!";

        setInterval(() => {
          event.target.submit.value = "Looks good";
        }, 1500);
      }
    });
  };

  return token.AUTH_TOKEN && <>
    <form className={styles.form} onSubmit={onSubmit} style={{ marginRight: "10px" }}>
      <textarea name="text" id="text" rows={2} placeholder="Your definitely important opinion..." required />
      <input type="submit" id="submit" value="Looks good" />
    </form>

    <Errors errors={errors} />
  </>;
}