import Link from "next/link";

import Header from "../components/common/header";
import PageContent from "../components/home/page_content";
import styles from "../public/styles/home/header.module.sass";
import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";

export default function App(): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const [ account, setAccount ] = useState([
    <Link href="/login"><button>Log In</button></Link>,
    <Link href="/signup"><button>Sign Up</button></Link>
  ])
  const [ email, setEmail ] = useState("");

  useEffect(() => {
    if (token.AUTH_TOKEN) {
      setAccount([<Link href="/logout"><button data-type="logout">Log Out</button></Link>])

      const payload = JSON.parse(atob(token.AUTH_TOKEN.split(".")[1]))
      setEmail(payload.email);
    }
  }, [])

  return <>
    <Header>
      <span className={styles.logo}>✨Beth✨</span>
      <div className={styles.search_bar}>
        <form action="/somewhere" method="GET">
          <input className="search-bar-input" type="search" id="search" placeholder="Search something..." />
        </form>
      </div>
      <p>{email}</p>
      <div className={styles.account_buttons}>
        {...account}
      </div>
    </Header>
    <PageContent token={token.AUTH_TOKEN} />
  </>;
}