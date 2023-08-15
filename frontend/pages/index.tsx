import Link from "next/link";

import Header from "../components/header";
import styles from "../public/styles/pages/home/index.module.sass";
import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";
import { Buffer } from "buffer";
import Posts from "../components/home/posts";
import HotTags from "../components/home/hot_tags";

export default function App(): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const [ email, setEmail ] = useState("");
  const [ account, setAccount ] = useState([
    <Link href="/auth/login"><button>Log In</button></Link>,
    <Link href="/auth/signup"><button>Sign Up</button></Link>
  ])

  useEffect(() => {
    if (token.AUTH_TOKEN) {
      const base64PayloadFromToken = token.AUTH_TOKEN.split(".")[1],
            stringPayload = Buffer.from(base64PayloadFromToken, 'base64').toString('utf8'),
            payload = JSON.parse(stringPayload);

      setAccount([<Link href="/auth/logout"><button data-type="logout">Log Out</button></Link>])
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
      <div className={styles.account_buttons}>{...account}</div>
    </Header>
    
    <div className={styles.container}>
      <HotTags />
      <Posts token={token.AUTH_TOKEN} />
    </div>
  </>;
}