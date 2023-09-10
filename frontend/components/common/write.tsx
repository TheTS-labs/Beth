import React, { Dispatch, FormEvent, SetStateAction } from "react";
import { useCookies } from "react-cookie";

import WritePost from "../../lib/home/write_post";
import styles from "../../public/styles/components/common/write.module.sass";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    text: { value: string }
    submit: { value: string }
  }
}

interface Props {
  setErrors: Dispatch<SetStateAction<string[]>>
  placeholder: string
  setDoRequest?: Dispatch<SetStateAction<boolean>>
  replyTo?: number
}

export function Write(props: Props): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const write = new WritePost(props.setErrors, token.AUTH_TOKEN, props.replyTo);

  const onSubmit = (event: Event): void => {
    event.preventDefault();
    event.target.submit.value = "Sending...";
  
    write.request(event.target.text.value).then(result => {
      if (result) {
        event.target.text.value = "";
        event.target.submit.value = "Done!";

        if (props.setDoRequest) {
          props.setDoRequest(true);
        }

        setInterval(() => {
          event.target.submit.value = "Looks good";
        }, 1500);
      }
    });
  };

  return token.AUTH_TOKEN && <>
    <form className={styles.form} onSubmit={onSubmit}>
      <textarea name="text" id="text" rows={2} placeholder={props.placeholder} required />
      <input type="submit" id="submit" value="Looks good" />
    </form>
  </>;
}