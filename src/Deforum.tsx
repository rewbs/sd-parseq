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
  'antiblur_kernel',
  'antiblur_sigma',
  'antiblur_amount',
  'antiblur_threshold',
  'hybrid_comp_alpha',
  'hybrid_comp_mask_blend_alpha',
  'hybrid_comp_mask_contrast',
  'hybrid_comp_mask_auto_contrast_cutoff_low',
  'hybrid_comp_mask_auto_contrast_cutoff_high'    
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
        interpolatable_fields={interpolatable_fields}
        default_keyframes={default_keyframes}
        default_displayFields={['seed', 'noise', 'strength', 'prompt_weight_1', 'prompt_weight_2', 'zoom']}
        show_options={false}
        settings_3d_only={settings_3d_only}
        settings_2d_only={settings_2d_only}
      />
  </>;
};

export default Deforum;