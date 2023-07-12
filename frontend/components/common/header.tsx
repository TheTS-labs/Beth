import styles from "../../public/styles/common/header.module.sass";

export default function Header(props: { children: React.ReactNode }): React.JSX.Element {
  return <div className={styles.header}>
    {props.children}
  </div>;
}