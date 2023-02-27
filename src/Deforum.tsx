import React from 'react';
//@ts-ignore
import ParseqUI from './ParseqUI';
import Header from "./components/Header";

const default_keyframes = [
  {
    "frame": 0,
    "zoom": 1,
    "zoom_i": "C",
    "seed": -1,
    "noise": 0.04,
    "strength": 0.6,
    "prompt_weight_1": 1,
    "prompt_weight_1_i": "bez(0,0.6,1,0.4)",
    "prompt_weight_2": 0,
    "prompt_weight_2_i": "bez(0,0.6,1,0.4)",
  },
  {
    "frame": 40,
    "zoom": 1.5
  },
  {
    "frame": 80,
    "prompt_weight_1": 0,
    "prompt_weight_2": 1,

  },  
  {
    "frame": 119,
    "zoom": 0.5,
  }
];

const Deforum = () => {
  return <>
      <Header title="Parseq for Deforum" />
      <ParseqUI
        default_keyframes={default_keyframes}
      />
  </>;
};

export default Deforum;