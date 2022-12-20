import React from 'react';
import ParseqUI from './ParseqUI';
import Header from "./components/Header";

const interpolatable_fields = [
  'seed',
  'denoise',
  'prompt_weight_1',
  'prompt_weight_2',
  'prompt_weight_3',
  'prompt_weight_4',
  'scale',
  'rotx',
  'roty',
  'rotz',
  'panx',
  'pany',
  'zoom',
  'loopback_frames',
  'loopback_decay'
];

const default_keyframes = [
  {
    frame: 0, seed: 303, scale: 7.5, denoise: 0.6, rotx: 0, roty: 0, rotz: 0, panx: 0,
    pany: 0, zoom: 0, loopback_frames: 1, loopback_decay: 0.25,
    prompt_weight_1: 1, prompt_weight_2: 0, prompt_weight_3: 1, prompt_weight_3_i: 'L*tri(period=100, phase=0, amp=0.5, centre=0.5)',
    prompt_weight_4: 0, prompt_weight_4_i: 'L*sin(period=100, phase=50, amp=0.5, centre=0.5)'
  },
  {
    frame: 199, seed: 303, scale: 7.5, denoise: 0.6, rotx: 0, roty: 0, rotz: 0, panx: 0,
    pany: 0, zoom: 0, loopback_frames: 1, loopback_decay: 0.25,
    prompt_weight_1: 0, prompt_weight_2: 1, prompt_weight_3: 0, prompt_weight_4: 1
  }
];

const App = () => {
  return [
    <Header title="Parseq Legacy (don't use this)" />,
      <ParseqUI
        interpolatable_fields={ interpolatable_fields }
        default_keyframes={ default_keyframes }
        default_displayFields={ ['seed', 'denoise', 'prompt_weight_1', 'prompt_weight_2', 'prompt_weight_3', 'prompt_weight_4'] }
        show_options = { true } 
        settings_2d_only = {[]}
        settings_3d_only = {[]}
      />
  ];
};


export default App;

