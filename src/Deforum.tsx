import React from 'react';
//@ts-ignore
import ParseqUI from './ParseqUI';
import Header from "./components/Header";

const Deforum = () => {
  return <>
      <Header title="Parseq for Deforum" />
      <ParseqUI
        defaultTemplate='catduck'
      />
  </>;
};

export default Deforum;