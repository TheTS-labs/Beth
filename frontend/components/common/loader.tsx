import styles from "../../public/styles/common/loader.module.sass";

export default function Loader(): JSX.Element {
  return <div className={styles.loader}>
    <div className={styles.loader_bar}></div>
    <div className={styles.loader_bar}></div>
    <div className={styles.loader_bar}></div>
  </div>;
}