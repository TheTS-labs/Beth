import styles from "../public/styles/components/loader.module.sass";

export default function Loader(): React.JSX.Element {
  return <div className={styles.loader}>
    <div className={styles.loader_bar}></div>
    <div className={styles.loader_bar}></div>
    <div className={styles.loader_bar}></div>
  </div>;
}