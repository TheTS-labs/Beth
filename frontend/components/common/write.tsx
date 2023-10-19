import { useSetAtom } from "jotai";
import React, { Dispatch, FormEvent, SetStateAction, useEffect, useRef } from "react";

import useAuthToken from "../../lib/hooks/use_auth_token";
import useRequest from "../../lib/hooks/use_request";
import styles from "../../public/styles/components/common/write.module.sass";
import { errorsAtom } from "./errors";

interface Props {
  placeholder: string
  setDoRequest?: Dispatch<SetStateAction<boolean>>
  replyTo?: number
}

const tagsRegex = /\b([a-zA-Z0-9])\w+,/gm;

export function Write(props: Props): React.JSX.Element {
  const authToken = useAuthToken();
  const setErrors = useSetAtom(errorsAtom);
  const { request, result } = useRequest({
    url: "post/create",
    data: { replyTo: props.replyTo },
    errorsAtom
  });

  const formRef = useRef<HTMLFormElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const tagsRef = useRef<HTMLTextAreaElement | null>(null);
  const submitRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (result?.success && formRef.current && submitRef.current) {
      formRef.current.reset();
      submitRef.current.value = "Done!";

      if (props.setDoRequest) {
        props.setDoRequest(true);
      }

      setInterval(() => {
        if (submitRef.current) {
          submitRef.current.value = "Looks good";
        }
      }, 1500);
    }
  }, [result]);

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!submitRef.current || !tagsRef.current || !textRef.current) {
      return;
    }

    submitRef.current.value = "Sending...";

    tagsRegex.lastIndex = 0;
    const regexMatches = tagsRegex.exec(tagsRef.current.value || "");
    if (!regexMatches) {
      setErrors(prevErrors => [...prevErrors, "Tags must be written like this example: tag1,tag2"]);
      return;
    }

    request({
      text: textRef.current.value,
      tags: tagsRef.current.value
    });
  };

  return authToken.value ? <>
    <form className={styles.form} onSubmit={onSubmit} ref={formRef}>
      <textarea name="text" id="text" rows={2} placeholder={props.placeholder} ref={textRef} required />
      <textarea name="tags" id="tags" rows={2} placeholder="Tags" ref={tagsRef} required />
      <input type="submit" id="submit" value="Looks good" ref={submitRef} />
    </form>
  </> : <></>;
}