import { useSetAtom } from "jotai";
import React, { Dispatch, FormEvent, SetStateAction } from "react";

import useAuthToken from "../../lib/common/token";
import WritePost from "../../lib/home/write_post";
import styles from "../../public/styles/components/common/write.module.sass";
import { errorsAtom } from "./errors";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    text: { value: string }
    tags: { value: string }
    submit: { value: string }
  }
}

interface Props {
  placeholder: string
  setDoRequest?: Dispatch<SetStateAction<boolean>>
  replyTo?: number
}

const tagsRegex = /\b([a-zA-Z0-9])\w+,/gm;

export function Write(props: Props): React.JSX.Element {
  const authToken = useAuthToken();
  const setErrors = useSetAtom(errorsAtom);
  const write = new WritePost(setErrors, authToken.value || "", props.replyTo);

  const onSubmit = (event: Event): void => {
    event.preventDefault();
    event.target.submit.value = "Sending...";

    tagsRegex.lastIndex = 0;
    const regexMatches = tagsRegex.exec(event.target.tags.value);
    if (!regexMatches) {
      setErrors(prevErrors => [...prevErrors, "Tags must be written like this example: tag1,tag2"]);
      return;
    }
  
    write.request(event.target.text.value, event.target.tags.value).then(result => {
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

  return authToken.value ? <>
    <form className={styles.form} onSubmit={onSubmit}>
      <textarea name="text" id="text" rows={2} placeholder={props.placeholder} required />
      <textarea name="tags" id="tags" rows={2} placeholder="Tags" />
      <input type="submit" id="submit" value="Looks good" />
    </form>
  </> : <></>;
}