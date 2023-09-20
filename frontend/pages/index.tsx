import { Buffer } from "buffer";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";

import { DetailedPosts } from "../../backend/db/models/post";
import Header from "../components/common/header";
import HotTags from "../components/hot_tags";
import Posts from "../components/posts";
import SearchBar from "../components/search_bar";
import SearchPosts from "../components/search_posts";
import styles from "../public/styles/pages/index.module.sass";

export default function App(): React.JSX.Element {
  const [ token ] = useCookies(["AUTH_TOKEN"]);
  const [ email, setEmail ] = useState<string | undefined>();

  // Search
  const [ searchAfterCursor, setSearchAfterCursor ] = useState<string | undefined>();
  const searchResults = useRef<DetailedPosts["results"]>([]);
  const [ query, setQuery ] = useState<string | undefined>();
  const [ tags, setTags ] = useState<string | undefined>();

  useEffect(() => {
    if (token.AUTH_TOKEN) {
      const base64PayloadFromToken = token.AUTH_TOKEN.split(".")[1],
            stringPayload = Buffer.from(base64PayloadFromToken, "base64").toString("utf8"),
            payload = JSON.parse(stringPayload);

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
      <Link href={{ pathname: "/auth/update_data", query: { email } }} key="update_data">
        <p style={{ color: "white", textDecoration: "underline" }}>{email}</p>
      </Link>
      <div className={styles.account_buttons}>
        {!email && <>
          <Link href="/auth/login" key="login"><button>Log In</button></Link>
          <Link href="/auth/signup" key="signup"><button>Sign Up</button></Link>
        </>}
        {email && <>
          <Link href="/auth/logout" key="logout"><button data-type="logout">Log Out</button></Link>
        </>}
      </div>
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