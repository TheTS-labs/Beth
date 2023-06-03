import styles from "../public/styles/loader.module.sass"

export default function Loader() {
  return (<div className={styles.loader}>
    <div className={styles.loader_bar}></div>
    <div className={styles.loader_bar}></div>
    <div className={styles.loader_bar}></div>
  </div>)
}