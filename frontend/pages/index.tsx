import Link from "next/link";
import React, { useRef, useState } from "react";

import { DetailedPosts } from "../../backend/db/models/post";
import Header from "../components/common/header";
import HotTags from "../components/hot_tags";
import Posts from "../components/posts";
import SearchBar from "../components/search_bar";
import SearchPosts from "../components/search_posts";
import useAuthToken from "../lib/common/token";
import styles from "../public/styles/pages/index.module.sass";

export default function App(): React.JSX.Element {
  const authToken = useAuthToken();

  // Search
  const [ searchAfterCursor, setSearchAfterCursor ] = useState<string | undefined>();
  const searchResults = useRef<DetailedPosts["results"]>([]);
  const [ query, setQuery ] = useState<string | undefined>();
  const [ tags, setTags ] = useState<string | undefined>();

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
      <Link href={{ pathname: "/auth/update_data", query: { email: authToken.payload?.email } }} key="update_data">
        <p style={{ color: "white", textDecoration: "underline" }}>{authToken.payload?.email}</p>
      </Link>
      <div className={styles.account_buttons}>
        {!authToken.payload?.email && <>
          <Link href="/auth/login" key="login"><button>Log In</button></Link>
          <Link href="/auth/signup" key="signup"><button>Sign Up</button></Link>
        </>}
        {authToken.payload?.email && <>
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
          token={authToken.value} 
          setSearchAfterCursor={setSearchAfterCursor}
          setQuery={setQuery}
          setTags={setTags}
          searchAfterCursor={searchAfterCursor}
          searchResults={searchResults}
          query={query}
          tags={tags}
        /> : 
        <Posts token={authToken.value} />
      }
    </div>
  </>;
}