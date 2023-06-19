import Header from "./components/Header";
import ParseqUI from './ParseqUI';

const Deforum = () => {
  return <>
    <Header title="Parseq" />
    { /* @ts-ignore */}
    <ParseqUI defaultTemplate='catduck' />
  </>;
};

export default Deforum;