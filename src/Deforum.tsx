import React from "react";
import Header from "./components/Header";
//@ts-ignore
import ParseqUI from './ParseqUI';

const Deforum = () => {
  return <>
      <Header title="Parseq for Deforum" />
      <ParseqUI
        defaultTemplate='catduck'
      />
    </>;
};

export default Deforum;