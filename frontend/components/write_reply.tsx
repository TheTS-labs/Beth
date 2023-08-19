import { useCookies } from "react-cookie";
import styles from "../public/styles/components/write_reply.module.sass";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import reply from "../lib/reply";
import Errors from "./errors";

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    text: { value: string }
    submit: { value: string }
  }
}

export function WriteReply(props: { postId: number, setDoRequest: Dispatch<SetStateAction<boolean>>}): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const [ errors, setErrors ] = useState<string[]>([]);

  const onSubmit = (event: Event) => {
    event.preventDefault();
    reply(props.postId, event.target.text.value, setErrors, token.AUTH_TOKEN).then(result => {
      if (result) {
        event.target.text.value = "";
        props.setDoRequest(true);
      }
    });
  }

  return token.AUTH_TOKEN && (<>
    <form className={styles.form} onSubmit={onSubmit}>
      <textarea name="text" id="text" rows={2} placeholder="Your comment..." required />
      <input type="submit" id="submit" value="Looks good" />
    </form>

    <Errors errors={errors} />
  </>);
};