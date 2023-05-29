import { useState, useEffect } from 'react';
import Header from '../components/header';
import PageContent from '../components/page_content';
import { RequestErrorObject } from "../../backend/common/types"
import { HotTags } from "../../backend/db/models/post";

export default function App(props) {
  // const size = useWindowSize();
  // useEffect(() => {
  //   console.log(`${size.width}px / ${size.height}px`)
  // })
  
  const posts = [
    {
      username: "сиги и серёжки",
      checkmark: true,
      email: "@ok_sirok",
      text: "сейчас была самая смешная и отвратительно плохая ситуация на сеансе с психологом.\n\n(в самом конце выматывающего тяжёлого занятия)\n\nпсихолог: у вас такая кружка милая сегодня, что на ней написано?\n\nя, глядя на кружку с надписью \"не совершай самоубийство, живи ради Се Ляня\":",
      score: 943
    },
    {
      username: "настюхабамбук",
      checkmark: false,
      email: "@hearrmeroar_",
      text: "Мамина сестра ищет мужчину. Один пригласил обедать, он заехал за ней на такси, ехали к черту на куличики. Как оказалось: в столовку есть суп. Она сказала, что ей не нравится место и спросила, почему именно сюда. «Тут у моей бабули поминки недавно справляли, так вкусно кормят!»\nЯ ржу третий день, вчера в процессе засыпания вспомнила эту историю и гыгыкала в ночи, не могла уснуть",
      score: 256
    },
    {
      username: "海风",
      checkmark: false,
      email: "@blutigenkaiser",
      text: "я уверена что самый травмированный клон дотторе это тот самый молодой клон созданный во время его учебы в академии у пацана просто каждодневный стресс и пробуждения посреди ночи с возгласом \"Я ЗАБЫЛ НАПИСАТЬ РЕФЕРАТ…\"\nоригинальный дотторе который все еще не свободен от тревожек после академии в графе \"ваша самая большая ошибка\" пишет дрожащей рукой человека пережившего самый большой кризис \"поступление в филфак\"",
      score: 941
    },
    {
      username: "𝐑𝐢𝐲𝐚 | 𝐑𝐢𝐧 🌸 | 🇺🇦",
      checkmark: true,
      email: "@merrffi",
      text: "Аль Хайтам который заметив подавленное состояние Кавеха рассказал ему о книгах, которые переставили из за якобы обильного количества комментариев, потому что знал, что Кавех пойдет переставлять их обратно и наткнутся на эти благодарности учеников ему, я не могу с них\nон знал об этих благодарностях, он их видел, и эта его фраза \"как мало нужно чтобы тебя порадовать\" 😭😭😭\n\nя люблю их, невозможно",
      score: 717
    },
    {
      username: "Maiev 2.0",
      checkmark: false,
      email: "@yadeathcoreee",
      text: "Ну что, жароебы, довольны?????",
      score: 618
    }
  ]

  return (<>
    <Header searchActionURL="/somewhere" />
    <PageContent posts={posts} />
  </>);
}

export function useWindowSize(): { width: number, height: number } {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // only execute all the code below in client side
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
     
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}