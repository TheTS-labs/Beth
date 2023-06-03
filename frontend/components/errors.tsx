import { Dispatch, SetStateAction, useEffect, useRef } from "react"
import styles from "../public/styles/errors.module.sass"
import errorStyles from "../public/styles/errors.module.sass"

interface Props {
  errors: string[]
}

export default function Errors(props: Props) {
  const errorsRef = useRef(null);

  useEffect(() => {
    if (errorsRef.current) {
      const elements = [...errorsRef.current.children]
      let waitFor = 5000;
      elements.forEach((element, i) => {
        element.style.animation = `${errorStyles.error} 5s forwards`;
        element.style["animation-delay"] = `${i*150}ms`;
        waitFor = waitFor + i*150
      })
    }
  })

  return (<div className={styles.errors} ref={errorsRef}>
    {props.errors.map((error, i) => {
      return (<div className={styles.error_message} key={i}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" >
          <g>
            <line x1={7} y1={3.5} x2={7} y2={6.5} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={7} cy={9.5} r={0.5} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
            <rect x={2.09} y={2.09} width={9.82} height={9.82} rx={1.07} transform="translate(-2.9 7) rotate(-45)" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
        <p>{error}</p>
      </div>)
    })}
  </div>)
}