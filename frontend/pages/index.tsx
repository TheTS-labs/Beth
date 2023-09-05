import { Buffer } from "buffer";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";

import { DetailedPosts } from "../../backend/db/models/post";
import Header from "../components/header";
import HotTags from "../components/home/hot_tags";
import Posts from "../components/home/posts";
import SearchBar from "../components/home/search_bar";
import SearchPosts from "../components/home/search_posts";
import styles from "../public/styles/pages/home/index.module.sass";

export default function App(): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const [ email, setEmail ] = useState("");
  const [ account, setAccount ] = useState([
    <Link href="/auth/login" key="login"><button>Log In</button></Link>,
    <Link href="/auth/signup" key="signup"><button>Sign Up</button></Link>
  ]);

  // Search
  const [ searchAfterCursor, setSearchAfterCursor ] = useState<string | null>(null);
  const searchResults = useRef<DetailedPosts["results"]>([]);
  const [ query, setQuery ] = useState<string | null>(null);
  const [ tags, setTags ] = useState<string | null>(null);

  useEffect(() => {
    if (token.AUTH_TOKEN) {
      const base64PayloadFromToken = token.AUTH_TOKEN.split(".")[1],
            stringPayload = Buffer.from(base64PayloadFromToken, "base64").toString("utf8"),
            payload = JSON.parse(stringPayload);

      setAccount([<Link href="/auth/logout" key="logout"><button data-type="logout">Log Out</button></Link>]);
      setEmail(payload.email);
    }
  }, [token.AUTH_TOKEN]);

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
      <Link href={{ pathname: "/updateData", query: { email } }} key="updateData">
        <p style={{ color: "white", textDecoration: "underline" }}>{email}</p>
      </Link>
      <div className={styles.account_buttons}>{...account}</div>
    </Header>
    
    <div className={styles.container}>
      <HotTags
        setSearchAfterCursor={setSearchAfterCursor}
        setTags={setTags}
        searchResults={searchResults}
        tags={tags}
      />
      {searchAfterCursor && (tags || query) ? 
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