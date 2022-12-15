import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Alert } from '@mui/material';
import ParseqUI from './ParseqUI';
import packageJson from '../package.json';
import './robin.css';
import { UserAuthContextProvider } from "./UserAuthContext";
import Login from "./Login";
import Signup from "./SignUp";
import { Routes, Route } from "react-router-dom";

import GitInfo from 'react-git-info/macro';
import { app } from './firebase-config';


const gitInfo = GitInfo();
window.GIT_BRANCH = gitInfo.branch;
window.GIT_COMMIT_HASH = gitInfo.commit.hash;
window.GIT_COMMIT_SHORTHASH = gitInfo.commit.shortHash;
window.GIT_COMMIT_DATE = gitInfo.commit.date;

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
    <UserAuthContextProvider>
          <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
        </Routes>
    </UserAuthContextProvider>      
      <Grid container paddingLeft={5} >
        <Grid xs="12">
          <h2>Parseq v{packageJson.version} <small><small><small><a href="https://github.com/rewbs/sd-parseq">(what is this? How do I use it? Where do I report bugs?)</a></small></small></small></h2>
          <Alert severity="info">Using Deforum? You probably want  <a href="/deforum">this page</a>.</Alert>
          <h3 style={{color:'red'}}>Editable node dev branch, expect bugs.</h3>
        </Grid>
      </Grid>
      <ParseqUI
        interpolatable_fields={ interpolatable_fields }
        default_keyframes={ default_keyframes }
        default_displayFields={ ['seed', 'denoise', 'prompt_weight_1', 'prompt_weight_2', 'prompt_weight_3', 'prompt_weight_4'] }
        show_options = { true } 
        settings_2d_only = {[]}
        settings_3d_only = {[]}
      />
     </div>
  );
};


export default App;

