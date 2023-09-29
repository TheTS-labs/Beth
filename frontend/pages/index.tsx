import Link from "next/link";
import React from "react";

import Header from "../components/common/header";
import HotTags from "../components/hot_tags";
import ModalPost from "../components/modal_post";
import Posts from "../components/posts";
import SearchBar from "../components/search_bar";
import useAuthToken from "../lib/common/token";
import styles from "../public/styles/pages/index.module.sass";

export default function App(): React.JSX.Element {
  const authToken = useAuthToken();

  return <>
    <Header>
      <span className={styles.logo}>✨Beth✨</span>
      <SearchBar />
      <Link href="/auth/update_data" key="update_data">
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
      <HotTags />
      <Posts />
      <ModalPost />
    </div>
  </>;
}