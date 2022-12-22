import React from 'react';
//@ts-ignore
import ParseqUI from './ParseqUI';
import Header from "./components/Header";

//////////////////////////////////////////
// Config
const interpolatable_fields = [
  'seed',
  'scale',
  'noise',
  'strength',
  'contrast',
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
  'perspective_flip_theta',
  'perspective_flip_phi',
  'perspective_flip_gamma',
  'perspective_flip_fv',
  'translation_x',
  'translation_y',
  'translation_z',
  'rotation_3d_x',
  'rotation_3d_y',
  'rotation_3d_z',
  'fov',
  'near',
  'far',
];

const settings_3d_only = [
  'translation_z',
  'rotation_3d_x',
  'rotation_3d_y',
  'rotation_3d_z',
  'fov',
  'near',
  'far',
]

const settings_2d_only = [
  'angle',
  'zoom',
  'perspective_flip_theta',
  'perspective_flip_phi',
  'perspective_flip_gamma',
  'perspective_flip_fv',
]

const default_keyframes = [
  {
    "frame": 0,
    "seed": 909,
    "seed_i": "L",
    "scale": 20,
    "noise": 0.08,
    "noise_i": "L + pulse(pw=1,p=1b,a=0.04)",    
    "strength": 0.6,
    "strength_i": "L - pulse(pw=1,p=2b,a=0.1)",
    "prompt_weight_1": 1,
    "prompt_weight_1_i": "bez(0,0.6,1,0.4)",
    "prompt_weight_2": 0,
    "prompt_weight_2_i": "bez(0,0.6,1,0.4)",
    "prompt_weight_3": 0,
    "prompt_weight_3_i": "L+sin(p=4b)",
    "prompt_weight_4": 0,
    "prompt_weight_4_i": "L+sin(p=4b, ps=2b)",
    "prompt_weight_5": 0,
    "prompt_weight_6": 0,
    "prompt_weight_7": 0,
    "prompt_weight_8": 0,
    "angle": 0,
    "angle_i": "",
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
    "frame": 40,
    "prompt_weight_1": 1,
    "prompt_weight_2": 0,
    "zoom": 1.5
  },
  {
    "frame": 80,
    "prompt_weight_1": 0,
    "prompt_weight_2": 1,
  },
  {
    "frame": 120,
    "seed": 606,
    "scale": 20,
    "noise": 0.08,
    "strength": 0.6,
    "prompt_weight_1": 0,
    "prompt_weight_2": 1,
    "prompt_weight_3": 0,
    "prompt_weight_4": 0,
    "prompt_weight_5": 0,
    "prompt_weight_6": 0,
    "prompt_weight_7": 0,
    "prompt_weight_8": 0,
    "angle": 0,
    "zoom": 0.5,
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
  return <>
      <Header title="Parseq for Deforum" />
      <ParseqUI
        interpolatable_fields={interpolatable_fields}
        default_keyframes={default_keyframes}
        default_displayFields={['noise', 'strength', 'prompt_weight_1', 'prompt_weight_2', 'prompt_weight_3', 'prompt_weight_4', 'zoom']}
        show_options={false}
        settings_3d_only={settings_3d_only}
        settings_2d_only={settings_2d_only}
      />
  </>;
};

export default Deforum;