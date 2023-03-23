import React from 'react';
//@ts-ignore
import ParseqUI from './ParseqUI';
import Header from "./components/Header";
import { GraphTest } from './GraphTest';

const Deforum = () => {
  return <>
      <Header title="Parseq for Deforum" />
      <ParseqUI
        defaultTemplate='catduck'
      />
      {/* <GraphTest /> */}
  </>;
};

export default Deforum;