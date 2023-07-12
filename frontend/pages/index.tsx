import Link from "next/link";

import Header from "../components/common/header";
import PageContent from "../components/home/page_content";
import styles from "../public/styles/home/header.module.sass";

export default function App(): React.JSX.Element {
  return <>
    <Header>
      <span className={styles.logo}>✨Beth✨</span>
      <div className={styles.search_bar}>
        <form action="/somewhere" method="GET">
          <input className="search-bar-input" type="search" id="search" placeholder="Search something..." />
        </form>
      </div>
      <div className={styles.account_buttons}>
        <Link href="/login"><button>Log In</button></Link>
        <Link href="/signup"><button>Sign Up</button></Link>
      </div>
    </Header>
    <PageContent />
  </>;
}