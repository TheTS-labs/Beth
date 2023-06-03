import styles from "../../public/styles/home/header.module.sass";

interface Props {
  searchActionURL: string
}

export default function Header(props: Props): JSX.Element {
  return <div className={styles.header}>
    <span className={styles.logo}>✨Beth✨</span>
    <div className={styles.search_bar}>
      <form action={props.searchActionURL} method="GET">
        <input className="search-bar-input" type="search" id="search" placeholder="Search something..." />
      </form>
    </div>
    <div className={styles.account_buttons}>
      <button>Log In</button>
      <button>Sign Up</button>
    </div>
  </div>;
}