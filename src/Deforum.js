import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
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

//////////////////////////////////////////
// Config
const interpolatable_fields = [
  'seed',
  'noise',
  'strength',
  'scale',  
  'prompt_weight_1',
  'prompt_weight_2',
  'prompt_weight_3',
  'prompt_weight_4',
  'prompt_weight_5',
  'prompt_weight_6',
  'prompt_weight_7',
  'prompt_weight_8',
  'angle',
  'zoom',
  'translation_x',
  'translation_y',
  'translation_z',
  'rotation_3d_x',
  'rotation_3d_y',
  'rotation_3d_z',
  'perspective_flip_theta',
  'perspective_flip_phi',
  'perspective_flip_gamma',
  'perspective_flip_fv',
  'contrast',
  'fov',
  'near',
  'far',
];
const default_keyframes = [
  {
      "frame": 0,
      "seed": 303,
      "seed_i": "S+f",      
      "scale": 7,
      "noise": 0.12,
      "strength": 0.5,
      "prompt_weight_1": 1,
      "prompt_weight_2": 0,
      "prompt_weight_3": 1,
      "prompt_weight_3_i": "tri(period=240, phase=0, amp=S)",
      "prompt_weight_4": 0,
      "prompt_weight_4_i": null,
      "prompt_weight_5": 0,
      "prompt_weight_6": 0,
      "prompt_weight_7": 0,
      "prompt_weight_8": 0,
      "angle": 0,
      "angle_i": "bez()",      
      "zoom": 1,
      "zoom_i": "C",      
      "translation_x": 0,
      "translation_y": 0,
      "translation_z": 10,
      "rotation_3d_x": 0,
      "rotation_3d_y": 0,
      "rotation_3d_z": 0,
      "perspective_flip_theta": 0,
      "perspective_flip_phi": 0,
      "perspective_flip_gamma": 0,
      "perspective_flip_fv": 50,
      "contrast": 1,
      "fov": 40,
      "near": 200,
      "far": 10000,
  },
  {
      "frame": 60,
      "angle": "",
      "zoom": 1.5
  },
  {
      "frame": 120,
      "seed": 303,
      "scale": 7,
      "noise": 0.12,
      "strength": 0.5,
      "prompt_weight_1": 0,
      "prompt_weight_2": 1,
      "prompt_weight_3": 1,
      "prompt_weight_4": 0,
      "prompt_weight_5": 0,
      "prompt_weight_6": 0,
      "prompt_weight_7": 0,
      "prompt_weight_8": 0,
      "angle": 180,
      "zoom": -1,
      "translation_x": 0,
      "translation_y": 0,
      "translation_z": 10,
      "rotation_3d_x": 0,
      "rotation_3d_y": 0,
      "rotation_3d_z": 0,
      "perspective_flip_theta": 0,
      "perspective_flip_phi": 0,
      "perspective_flip_gamma": 0,
      "perspective_flip_fv": 50,
      "contrast": 1,
      "fov": 40,
      "near": 200,
      "far": 10000
  }
];

const Deforum = () => {
  return (
    <div>
      <Grid container paddingLeft={5} >
        <Grid xs="12">
          <h2>Parseq Deforum mode v{packageJson.version} <small><small><small><a href="https://github.com/rewbs/sd-parseq">(what is this? How do I use it? Where do I report bugs?)</a></small></small></small></h2>
       </Grid>
      </Grid>
      <ParseqUI
        interpolatable_fields={ interpolatable_fields }
        default_keyframes={ default_keyframes }
        default_visible={ ['seed', 'noise', 'strength', 'prompt_weight_1', 'prompt_weight_2', 'prompt_weight_3', 'angle', 'zoom'] }
        show_options = { false }
      />
     </div>
  );
};

export default Deforum;