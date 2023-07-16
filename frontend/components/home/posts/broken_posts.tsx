// Ignore SVG lines and fake text lines
/* eslint-disable max-len */
import styles from "../../../public/styles/home/posts/broken_posts.module.sass";
import Post from "../../common/post";

export default function BrokenPosts(): React.JSX.Element {
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
  ];

  return <div className={styles.posts}>
    <p className={styles.text}>Feed</p>
    <div className={styles.broken_container} key={0}>
      <p className={styles.broken_text}>Feed unavailable</p>
      <p className={styles.broken_explain}>The feed is not available right now, maybe the server is overloaded and therefore cannot respond to the request, try again sometime later</p>
    </div>
    {posts.map((post, i) => <Post key={i} post={post} styles={styles}/>)}
  </div>;
}