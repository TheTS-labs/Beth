import Link from "next/link";

import Header from "../components/header";
import styles from "../public/styles/pages/home/index.module.sass";
import { useCookies } from "react-cookie";
import { useEffect, useRef, useState } from "react";
import { Buffer } from "buffer";
import Posts from "../components/home/posts";
import HotTags from "../components/home/hot_tags";
import SearchBar from "../components/home/search_bar";
import { DetailedPosts } from "../../backend/db/models/post";
import SearchPosts from "../components/home/search_posts";

export default function App(): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const [ email, setEmail ] = useState("");
  const [ account, setAccount ] = useState([
    <Link href="/auth/login"><button>Log In</button></Link>,
    <Link href="/auth/signup"><button>Sign Up</button></Link>
  ])

  // Search
  const [ searchAfterCursor, setSearchAfterCursor ] = useState<string>(null);
  const searchResults = useRef<DetailedPosts["results"]>([]);
  const [ query, setQuery ] = useState<string>(null);
  const [ tags, setTags ] = useState<string>(null);

  useEffect(() => {
    if (token.AUTH_TOKEN) {
      const base64PayloadFromToken = token.AUTH_TOKEN.split(".")[1],
            stringPayload = Buffer.from(base64PayloadFromToken, 'base64').toString('utf8'),
            payload = JSON.parse(stringPayload);

      setAccount([<Link href="/auth/logout"><button data-type="logout">Log Out</button></Link>])
      setEmail(payload.email);
    }
  }, []);

  return <>
    <Header>
      <span className={styles.logo}>✨Beth✨</span>
      <SearchBar 
        setSearchAfterCursor={setSearchAfterCursor}
        setQuery={setQuery}
        setTags={setTags}
        searchResults={searchResults}
        query={query}
        tags={tags}
      />
      <p>{email}</p>
      <div className={styles.account_buttons}>{...account}</div>
    </Header>
    
    <div className={styles.container}>
      <HotTags
        setSearchAfterCursor={setSearchAfterCursor}
        setTags={setTags}
        searchResults={searchResults}
        tags={tags}
      />
      {(searchAfterCursor && (tags || query)) ? 
        <SearchPosts 
          token={token.AUTH_TOKEN} 
          setSearchAfterCursor={setSearchAfterCursor}
          setQuery={setQuery}
          setTags={setTags}
          searchAfterCursor={searchAfterCursor}
          searchResults={searchResults}
          query={query}
          tags={tags}
        /> : 
        <Posts token={token.AUTH_TOKEN} />
      }
    </div>
  </>;
}