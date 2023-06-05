import Header from "../components/home/header";
import PageContent from "../components/home/page_content";

export default function App(): React.JSX.Element {
  return <>
    <Header searchActionURL="/somewhere" />
    <PageContent />
  </>;
}