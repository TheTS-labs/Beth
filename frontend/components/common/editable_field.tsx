import { PrimitiveAtom, useAtom } from "jotai";
import React, { useEffect, useRef, useState } from "react";

import styles from "../../public/styles/components/common/editable_field.module.sass";

interface Props {
  valueAtom: PrimitiveAtom<string | undefined>
}

export default function EditableField(props: Props): React.JSX.Element {
  const [ value, setValue ] = useAtom(props.valueAtom);
  const [ tempValue, setTempValue ] = useState(value);

  const [ editing, setEditing ] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;

      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, tempValue, editing]);

  return <div className={styles.container}>
    { !editing && <p onClick={(): void => {
      setTempValue(value);
      setEditing(true);
    }}>{(value || "").split("\n").map(line => <>{line}<br/></>)}</p> }
    { editing && <>
      <textarea autoFocus defaultValue={value} ref={textAreaRef} onChange={(e): void => setTempValue(e.target.value)} />
      <button onClick={(): void => {
        setEditing(false);
        setValue(tempValue);
      }}>OK</button>
      <button onClick={(): void => setEditing(false)}>Cancel</button>
    </> }
  </div>;
}