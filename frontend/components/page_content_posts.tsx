import styles from "../public/styles/page_content_posts.module.sass"

interface Props {
  posts: {
    username: string;
    checkmark: boolean;
    email: string;
    text: string;
    score: number;
  }[]
}

export default function PageContentPosts(props: Props): JSX.Element {
  return (<div className={styles.posts}>
    <p className={styles.text}>Feed</p>
    {props.posts.map((post, i) => {
      return (<div className={styles.post} key={i}>
        <div className={styles.user}>
          <div className={styles.username_and_checkmark}>
            <span className={styles.username}>{post.username}</span>
            {(() => { if (post.checkmark) return (<span className={styles.checkmark}>✓</span>) })()}
          </div>
          <span className={styles.email}>{post.email}</span>
        </div>

        <div className={styles.post_container}>
          <p className={styles.post_text}>{post.text.split("\n").map(line => { return (<><br />{line}</>) })}</p>
          <div className={styles.voting}>
            <button className={styles.voting_button}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" >
                <g>
                  <path d="M3.37,8.15l2.54,4.06a1.09,1.09,0,0,0,.94.52h0A1.11,1.11,0,0,0,8,11.63V8.72h4.39A1.15,1.15,0,0,0,13.49,7.4l-.8-5.16a1.14,1.14,0,0,0-1.13-1H5a2,2,0,0,0-.9.21l-.72.36" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1={3.37} y1={8.15} x2={3.37} y2={1.84} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1,1.84H3.37a0,0,0,0,1,0,0V8.15a0,0,0,0,1,0,0H1a.5.5,0,0,1-.5-.5V2.34A.5.5,0,0,1,1,1.84Z" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </button>
            <span>{post.score}</span>
            <button className={styles.voting_button}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" >
                <g>
                  <path d="M3.37,5.85,5.91,1.79a1.09,1.09,0,0,1,.94-.52h0A1.11,1.11,0,0,1,8,2.37V5.28h4.39A1.15,1.15,0,0,1,13.49,6.6l-.8,5.16a1.14,1.14,0,0,1-1.13,1H5a2,2,0,0,1-.9-.21l-.72-.36" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1={3.37} y1={5.85} x2={3.37} y2={12.16} fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1,5.85H3.37a0,0,0,0,1,0,0v6.31a0,0,0,0,1,0,0H1a.5.5,0,0,1-.5-.5V6.35A.5.5,0,0,1,1,5.85Z" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>)
    })}
  </div>)
}