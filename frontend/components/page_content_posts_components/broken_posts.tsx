import styles from "../../public/styles/broken_posts.module.sass"

export default function BrokenPosts(): JSX.Element {
  const posts = [
    { text: "The purple elephant danced gracefully on the flying toaster.\nButterflies sang in harmony while eating spicy marshmallows.\nThe moon turned green and started playing basketball with jellyfish.\nA talking cactus wore a polka-dot tuxedo and juggling pineapples.\nRainbows giggled as they rode bicycles made of bubblegum.\nThe toothbrushes formed a rock band and performed on the kitchen counter.\nThe clouds had a party with disco ball-shaped watermelons.\nSquirrels wore sunglasses and tap-danced on top of the water fountain.\nThe library shelves transformed into a roller coaster ride for unicorns.\nThe teapot grew legs and took a walk with the flying spaghetti monster.", 
      score: "-865", displayName: "🌟𝕊𝕥𝕒𝕣𝕘𝕚𝕣𝕝𝕖𝕪𝕖𝕤𝕥𝕖𝕣🌟", username: "StarGirl2023", verified: false },
    { text: "The purple elephant danced on the moon while juggling hamburgers.\nA teapot played chess with a talking pineapple in the middle of a thunderstorm.\nThe flying toaster sang opera while balancing on a unicycle.\nAn invisible giraffe wore a top hat and tap-danced in the rain.\nThe toaster oven recited Shakespearean sonnets to a group of startled penguins.\nA polka-dotted kangaroo rode a skateboard through a field of marshmallows.\nThe disco ball serenaded a group of singing tomatoes under a neon rainbow.\nA sock puppet named Fred led a synchronized swimming team of rubber ducks.\nThe dancing banana challenged a trapeze artist chicken to a game of hopscotch.\nA group of penguins in tuxedos performed a synchronized swimming routine in a bathtub filled with jellybeans.", 
      score: "936", displayName: "⚡️ＥｌｅｃｔｒｏＮｉｎｊａ⚡️", username: "ElectroNinja23", verified: false },
    { text: "The purple elephant danced wildly on the moonlight sandwich.\nJellyfish harmonized with the polka dot rainbows in the bathtub.\nSparkling unicorns frolicked through the marshmallow castle.\nThe grumpy pineapple sang opera while juggling rubber ducks.\nA fleet of flying sausages invaded the chocolate volcano.\nMoonwalking dinosaurs twirled in synchronized confusion.\nThe enchanted typewriter whispered secrets to the floating teacups.\nIn the upside-down universe, socks played hopscotch on the clouds.\nBubblegum clouds rained down glittery penguins wearing top hats.\nDandelion whispers tickled the rainbow-spotted hedgehog's dreams.", 
      score: "730", displayName: "🌸༺𝒮𝓌ℯℯ𝓉 𝒫𝓇𝒾𝓃𝒸ℯ𝓈𝓈༻🌸", username: "SweetPrincess22", verified: true },
    { text: "The purple elephant danced wildly on the moonlight sandwich.\nJellyfish harmonized with the polka dot rainbows in the bathtub.\nSparkling unicorns frolicked through the marshmallow castle.\nThe grumpy pineapple sang opera while juggling rubber ducks.\nA fleet of flying sausages invaded the chocolate volcano.\nMoonwalking dinosaurs twirled in synchronized confusion.\nThe enchanted typewriter whispered secrets to the floating teacups.\nIn the upside-down universe, socks played hopscotch on the clouds.\nBubblegum clouds rained down glittery penguins wearing top hats.\nDandelion whispers tickled the rainbow-spotted hedgehog's dreams.", 
      score: "651", displayName: "🌟𝒬𝓊ℯℯ𝓃 𝒪𝒻 𝒯𝒽ℯ 𝒮𝓉𝒶𝓇𝓈🌟", username: "QueenOfTheStars8", verified: true },
    { text: "*Dying voice* Sorry...", 
      score: "396", displayName: "🎶Ｍｕｓｉｃ Ａｄｄｉｃｔ🎶", username: "MusicAddict45", verified: false },
    { text: "Apparently we...", 
      score: "428", displayName: "🌺𝑆𝓊𝓃𝓈𝒽𝒾𝓃𝑒 𝐵𝑒𝒶𝒸𝒽🌺", username: "SunshineBeach99", verified: false },
    { text: "Are... down now, ahh....", 
      score: "-996", displayName: "💫𝒮𝓉𝓎𝓁𝒾𝓈𝒽 𝒜𝓃𝑔𝑒𝓁💫", username: "StylishAngel67", verified: true },
  ]

  return (<div className={styles.posts}>
    <p className={styles.text}>Feed</p>
    <div className={styles.broken_container} key={0}>
      <p className={styles.broken_text}>Feed unavailable</p>
      <p className={styles.broken_explain}>The feed is not available right now, maybe the server is overloaded and therefore cannot respond to the request, try again sometime later</p>
    </div>
    {posts.map((post, i) => {
      return (<div className={styles.post} key={i}>
        <div className={styles.user}>
          <div className={styles.username_and_checkmark}>
            <span className={styles.username}>{post.displayName}</span>
            {(() => { if (post.verified) return (<span className={styles.checkmark}>✓</span>) })()}
          </div>
          <span className={styles.email}>@{post.username}</span>
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