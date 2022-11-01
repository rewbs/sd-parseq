import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Alert } from '@mui/material';
import ParseqUI from './ParseqUI';
import packageJson from '../package.json';
import './robin.css';

// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCGr7xczPkoHFQW-GanSAoAZZFGfLrYiTI",
  authDomain: "sd-parseq.firebaseapp.com",
  projectId: "sd-parseq",
  storageBucket: "sd-parseq.appspot.com",
  messagingSenderId: "830535540412",
  appId: "1:830535540412:web:858dde0a82381e6f32bab9",
  measurementId: "G-TPY8W4RQ83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


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
  return (
    <div>
      <Grid container paddingLeft={5} >
        <Grid xs="12">
          <h2>Parseq v{packageJson.version} <small><small><small><a href="https://github.com/rewbs/sd-parseq">(what is this? How do I use it? Where do I report bugs?)</a></small></small></small></h2>
          <Alert severity="info">Using Deforum? You probably want  <a href="/deforum">this page</a>.</Alert>
        </Grid>
      </Grid>
      <ParseqUI
        interpolatable_fields={ interpolatable_fields }
        default_keyframes={ default_keyframes }
      />
     </div>
  );
};


export default App;

