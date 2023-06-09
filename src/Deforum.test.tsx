/* eslint-disable no-template-curly-in-string */

// WARNING: do NOT run organise imports on this file!
// Order of imports is important for the tests to work.
// "fake-indexeddb/auto" must be imported before Dexie.

// Set up Dexie / indexedDB for testing
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { render, screen, waitFor } from '@testing-library/react';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import 'jest-canvas-mock';
import {
  BrowserRouter, Route, Routes
} from "react-router-dom";
import Deforum from './Deforum';
import * as utils from './utils/utils';

//@ts-ignore
Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

TimeAgo.addDefaultLocale(en);

jest.mock('react-chartjs-2', () => ({
  Line: () => null
}));
// jest.mock('chartjs-plugin-crosshair', () => ({
//   CrosshairPlugin: () => null
// }));
// jest.mock('chartjs-plugin-dragdata', () => null);
jest.mock('chartjs-plugin-annotation', () => ({
  annotationPlugin: () => null
}));

jest.mock('firebase/analytics', () => ({
  isSupported: () => new Promise(() => false),
  getAnalytics: () => null,
}));


jest.mock("wavesurfer.js/dist/plugin/wavesurfer.timeline.min", () => null);
jest.mock("wavesurfer.js/src/plugin/markers", () => null);
jest.mock("wavesurfer-react", () => ({
  WaveForm: () => null,
  WaveSurfer: () => null
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: () => { },
  }
}));

jest.mock('@xzdarcy/react-timeline-editor', () => ({
  Timeline: () => null,
  TimelineEffect: () => null,
  TimelineRow: () => null,
}));

// Workaround for meta.import.url not working with Jest.
jest.mock('./components/AudioWaveform', () => ({
  AudioWaveform: () => <></>
}));
jest.mock('./dbTasks', () => () => {});
jest.mock('./components/TimeSeriesUI', () => ({
  TimeSeriesUI: () => <></>
}));

jest.setTimeout(15000);

async function loadAndRender(fixture: {}) {

  // Mock version number and timestamp to ensure consistent snapshots.
  jest.spyOn(utils, 'getUTCTimeStamp').mockReturnValue('0.0.test');
  jest.spyOn(utils, 'getVersionNumber').mockReturnValue('Sun, 01 Jan 2023 14:00:00 GMT');
  jest.spyOn(utils, 'getOutputTruncationLimit').mockReturnValue(Number.MAX_VALUE);

  // Mock query params with test fixture.
  // TODO this overrides all query param lookups, when we really only want to override when the key is "parseq".
  jest.spyOn(URLSearchParams.prototype, 'get').mockImplementation((key) => JSON.stringify(fixture));

  // Render the app
  render(<BrowserRouter><Routes><Route path="*" element={<Deforum />} /></Routes></BrowserRouter>);

  // Wait for Parseq to complete
  await waitFor(() => {
    expect(screen.getAllByTestId("render-button")[0]).toHaveTextContent("Re-render");
  }, { timeout: 15000 });
}

test('Blank document', async () => {
  const fixture = {
    "prompts": {
      "positive": "",
      "negative": ""
    },
    "keyframes": [
      {
        "frame": 0,
        "seed": -1,
      },
      {
        "frame": 10
      }
    ]
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});

test('Multiple evals in prompts', async () => {
  const fixture = {
    "prompts": {
      "positive": "(cat:${prompt_weight_1})\n(dog:${-prompt_weight_1})",
      "negative": "(blurry:${10*prompt_weight_1})\n(happy:${-prompt_weight_1/10})",
    },
    "keyframes": [
      {
        "frame": 0,
        "prompt_weight_1": 0
      },
      {
        "frame": 10,
        "prompt_weight_1": 10
      }
    ]
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});

test('Full prodigy', async () => {
  const fixture = {
    "prompts": {
      "positive": "Realistic eyeball, photorealism, centered, photo, realistic, organic, dense, beautiful detail, fine textures, intense, volumetric lighting, cinematic lighting :${prompt_weight_1} AND\nRealistic ancient vicious snakes with open mouths, fangs, biting camera, photorealism, centered, photo, realistic, organic, dense, beautiful detail, fine textures, intense, volumetric lighting, cinematic lighting  :${prompt_weight_2} AND\nRealistic mushrooms, photorealism, centered, photo, realistic, organic, dense, beautiful detail, fine textures, intense, volumetric lighting, cinematic lighting  :${prompt_weight_3} AND\nLSD blotter, powder, pills, illegal drugs, syringe, photorealism, centered, photo, realistic, organic, dense, beautiful detail, fine textures, intense, volumetric lighting, cinematic lighting  :${prompt_weight_4}",
      "negative": "empty, boring, blank space, black, dark, cartoon, drawing, painting, low quality, noisy, grainy, watermark, signature, logo, writing, text, person, people, human, baby, cute, young, simple, cartoon, face, uncanny valley, deformed, silly"
    },
    "options": {
      "bpm": 140,
      "output_fps": "30",
    },
    "keyframes": [
      {
        "frame": 0,
        "seed": 606,
        "scale": 30,
        "strength": 0.55,
        "rotation_3d_x": 5,
        "rotation_3d_y": 5,
        "rotation_3d_z": 0,
        "translation_x": 0,
        "translation_y": 0,
        "translation_z": 128,
        "loopback_frames": 7,
        "loopback_decay": 0.5,
        "prompt_weight_1": 1,
        "prompt_weight_2": 0,
        "prompt_weight_3": 0,
        "prompt_weight_3_i": "bez()",
        "prompt_weight_4": 0,
        "prompt_weight_4_i": "bez()",
        "rotation_3d_x_i": "sin(period=4b)*L",
        "rotation_3d_y_i": "sin(period=1b)*L",
        "rotation_3d_z_i": "L",
        "translation_z_i": "sin(period=1b)*S*pulse(period=8b, pw=2b)*(1-saw(period=2b))*sq(period=16b, ps=8b) \n+ -sin(period=1b)*S*pulse(period=16b, pw=2b, ps=12b)*(1-saw(period=2b))*sq(period=32b) ",
        "translation_x_i": "S",
        "translation_y_i": "S",
        "loopback_frames_i": "S",
        "prompt_weight_2_i": "bez()",
        "prompt_weight_1_i": "bez()",
        "strength_i": "(S-(pulse(p=4b, a=0.45, pw=2, ps=1.4b)\n   +pulse(p=4b, a=0.45, pw=2, ps=0.6b)))\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=1.25b)\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=0.45b)\n",
        "prompt_weight_5": 0,
        "noise": 0.08,
        "prompt_weight_6": 0,
        "prompt_weight_7": 0,
        "prompt_weight_8": 0,
        "angle": 0,
        "zoom": 1,
        "perspective_flip_theta": 0,
        "perspective_flip_phi": 0,
        "perspective_flip_gamma": 0,
        "perspective_flip_fv": 50,
        "contrast": 1.05,
        "fov": 40,
        "near": 200,
        "far": 10000,
        "seed_i": "S+saw(p=4b, a=4b)",
        "noise_i": "S+pulse(p=4b, a=0.1, pw=2, ps=2b)",
        "angle_i": null,
        "contrast_i": "L",
        "scale_i": "L",
        "prompt_weight_5_i": "S*(pulse(p=4b, a=(0.9-S), pw=0.5b, ps=1.35b)\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=0.45b))",
        "antiblur_kernel": 0,
        "antiblur_sigma": 0,
        "antiblur_amount": 0,
        "antiblur_threshold": 0
      },
      {
        "frame": 129,
        "rotation_3d_x": 0,
        "rotation_3d_y_i": "S",
        "rotation_3d_z": 0,
        "translation_z_i": "",
        "prompt_weight_1": 1,
        "prompt_weight_2": 0,
        "rotation_3d_z_i": "bez(0,0,0,0.8)",
        "strength_i": "S-pulse(p=4b, a=0.3, pw=2)",
        "rotation_3d_x_i": "S",
        "rotation_3d_y": 0,
        "prompt_weight_5_i": "0"
      },
      {
        "frame": 148,
        "rotation_3d_z": -45,
        "rotation_3d_z_i": "",
        "angle_i": null,
        "angle": "",
        "seed_i": null,
        "strength_i": null,
        "rotation_3d_x": ""
      },
      {
        "frame": 167,
        "rotation_3d_z": -90,
        "angle": "",
        "angle_i": null,
        "rotation_3d_y": "",
        "rotation_3d_y_i": null,
        "rotation_3d_x": "",
        "rotation_3d_x_i": null
      },
      {
        "frame": 186,
        "rotation_3d_z": -135,
        "angle": ""
      },
      {
        "frame": 193,
        "rotation_3d_z": -180,
        "rotation_3d_z_i": "bez()",
        "prompt_weight_1": "",
        "prompt_weight_1_i": null,
        "prompt_weight_2": "",
        "angle": "",
        "angle_i": null,
        "seed_i": null
      },
      {
        "frame": 206,
        "rotation_3d_x": "",
        "rotation_3d_y_i": "sin(period=1b)*L",
        "rotation_3d_z": 0,
        "translation_z": "",
        "prompt_weight_1": 0,
        "prompt_weight_1_i": null,
        "prompt_weight_2": 1,
        "angle": "",
        "seed_i": "",
        "rotation_3d_y": 5,
        "rotation_3d_z_i": "S",
        "strength_i": "(S-(pulse(p=4b, a=0.45, pw=2, ps=1.4b)\n   +pulse(p=4b, a=0.45, pw=2, ps=0.6b)))\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=1.25b)\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=0.45b)\n",
        "prompt_weight_5_i": "S*(pulse(p=4b, a=(0.9-S), pw=0.5b, ps=1.35b)\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=0.45b))"
      },
      {
        "frame": 309,
        "rotation_3d_y": 0,
        "translation_z": 128,
        "translation_z_i": null,
        "strength": "",
        "strength_i": "S-pulse(p=4b, a=0.3, pw=2)",
        "rotation_3d_y_i": "sin(period=0.25b)*L",
        "rotation_3d_x": 0,
        "rotation_3d_x_i": "sin(period=0.75b)*L",
        "prompt_weight_5_i": "0",
        "rotation_3d_z": 0,
        "rotation_3d_z_i": "sin(period=0.75b)*L"
      },
      {
        "frame": 334,
        "translation_z": "",
        "translation_z_i": null,
        "prompt_weight_2": 1,
        "prompt_weight_3": 0,
        "rotation_3d_y": 3,
        "rotation_3d_y_i": "",
        "rotation_3d_z": 3,
        "rotation_3d_x": 2
      },
      {
        "frame": 360,
        "translation_z_i": "bez(0.9,0.1,0.9,0.4)",
        "translation_z": -16,
        "strength": "",
        "seed_i": null,
        "rotation_3d_z_i": null,
        "rotation_3d_z": 0,
        "rotation_3d_y": 0,
        "rotation_3d_x": 0,
        "rotation_3d_x_i": "S",
        "rotation_3d_y_i": "S"
      },
      {
        "frame": 373,
        "translation_z": -64,
        "rotation_3d_z_i": null,
        "rotation_3d_z": ""
      },
      {
        "frame": 386,
        "translation_z": -128,
        "prompt_weight_2": "",
        "prompt_weight_2_i": null,
        "prompt_weight_3": "",
        "rotation_3d_z": ""
      },
      {
        "frame": 399,
        "translation_z": -256,
        "translation_z_i": "L",
        "prompt_weight_2": "",
        "prompt_weight_3_i": null,
        "prompt_weight_3": "",
        "seed_i": null,
        "rotation_3d_z": "",
        "rotation_3d_z_i": "bez()",
        "rotation_3d_y": 0
      },
      {
        "frame": 411,
        "rotation_3d_x": 5,
        "rotation_3d_y": 5,
        "translation_z": 128,
        "translation_x": "",
        "translation_x_i": null,
        "translation_y": "",
        "translation_z_i": "sin(period=1b)*S*pulse(period=8b, pw=2b)*(1-saw(period=2b))*sq(period=16b, ps=8b) \n+ -sin(period=1b)*S*pulse(period=16b, pw=2b, ps=12b)*(1-saw(period=2b))*sq(period=32b) ",
        "prompt_weight_2": 0,
        "prompt_weight_3": 1,
        "strength": "",
        "prompt_weight_1": 0,
        "rotation_3d_z": 0,
        "strength_i": "(S-(pulse(p=4b, a=0.45, pw=2, ps=1.4b)\n   +pulse(p=4b, a=0.45, pw=2, ps=0.6b)))\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=1.25b)\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=0.45b)\n",
        "rotation_3d_y_i": "sin(period=1b)*L",
        "rotation_3d_x_i": "sin(period=4b)*L",
        "prompt_weight_5_i": "S*(pulse(p=4b, a=(0.9-S), pw=0.5b, ps=1.35b)\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=0.45b))"
      },
      {
        "frame": 489,
        "translation_y_i": null,
        "translation_y": "",
        "translation_z": ""
      },
      {
        "frame": 540,
        "translation_y": "",
        "translation_y_i": null,
        "rotation_3d_y_i": "S",
        "rotation_3d_y": 0,
        "translation_z_i": "L - saw(p=0.75b)*L",
        "translation_z": 64,
        "strength": "",
        "seed_i": null,
        "prompt_weight_3": 1,
        "strength_i": "S-pulse(p=4b, a=0.3, pw=2)",
        "rotation_3d_x": 0,
        "rotation_3d_x_i": "S",
        "prompt_weight_5_i": "0"
      },
      {
        "frame": 579,
        "translation_y_i": null,
        "translation_y": "",
        "prompt_weight_3": "",
        "prompt_weight_2": 0,
        "prompt_weight_1": 0,
        "strength_i": ""
      },
      {
        "frame": 604,
        "translation_z": -512,
        "prompt_weight_3": "",
        "strength_i": ""
      },
      {
        "frame": 617,
        "translation_y": "",
        "translation_y_i": null,
        "rotation_3d_y": 5,
        "translation_z": 128,
        "prompt_weight_3": "",
        "prompt_weight_2": "",
        "prompt_weight_1": "",
        "prompt_weight_4": "",
        "prompt_weight_4_i": null,
        "strength": "",
        "translation_z_i": "sin(period=1b)*S*pulse(period=8b, pw=2b)*(1-saw(period=2b))*sq(period=16b, ps=8b) \n+ -sin(period=1b)*S*pulse(period=16b, pw=2b, ps=12b)*(1-saw(period=2b))*sq(period=32b) ",
        "seed_i": null,
        "scale": "",
        "strength_i": "(S-(pulse(p=4b, a=0.45, pw=2, ps=1.4b)\n   +pulse(p=4b, a=0.45, pw=2, ps=0.6b)))\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=1.25b)\n+pulse(p=4b, a=(0.9-S), pw=0.5b, ps=0.45b)\n",
        "rotation_3d_y_i": "sin(period=1b)*L",
        "rotation_3d_x_i": "sin(period=4b)*L",
        "rotation_3d_x": 5
      },
      {
        "frame": 694,
        "rotation_3d_x": "",
        "rotation_3d_y": "",
        "translation_y": "",
        "translation_y_i": null,
        "loopback_frames": 10,
        "loopback_decay": 0,
        "loopback_decay_i": "L+sin(p=1b)*L",
        "strength_i": "",
        "noise": "",
        "prompt_weight_4": "",
        "prompt_weight_3": "",
        "scale": ""
      },
      {
        "frame": 720,
        "translation_y": "",
        "translation_y_i": null,
        "loopback_frames": "",
        "strength": 0.55,
        "strength_i": "L",
        "noise": "",
        "rotation_3d_z": 0,
        "rotation_3d_z_i": "L",
        "angle": "",
        "angle_i": null,
        "seed_i": "",
        "prompt_weight_3": 1,
        "prompt_weight_4": 0,
        "noise_i": "S"
      },
      {
        "frame": 759,
        "rotation_3d_y": 0,
        "loopback_frames": "",
        "loopback_decay": 0.8,
        "loopback_decay_i": "C",
        "strength": "",
        "prompt_weight_3": "",
        "prompt_weight_4": "",
        "rotation_3d_x": 0,
        "rotation_3d_y_i": "S",
        "translation_z_i": "L",
        "translation_z": 0,
        "rotation_3d_x_i": "sin(period=4b)*L"
      },
      {
        "frame": 798,
        "rotation_3d_z": 180,
        "rotation_3d_z_i": "bez(0.5,0.1,1,0.5)",
        "prompt_weight_4": 1,
        "prompt_weight_3": 0
      },
      {
        "frame": 823,
        "translation_z": 256,
        "prompt_weight_1": 0,
        "prompt_weight_2": 0,
        "prompt_weight_3": "",
        "prompt_weight_4": "",
        "loopback_frames": 1,
        "loopback_frames_i": "L",
        "loopback_decay": 0.05,
        "loopback_decay_i": "L",
        "noise": "",
        "noise_i": null,
        "rotation_3d_x": 2,
        "rotation_3d_z": 360,
        "seed_i": null,
        "angle": "",
        "strength": "",
        "rotation_3d_y_i": "sin(period=1b)*L",
        "rotation_3d_y": 5,
        "translation_z_i": "bez(0.5,0.1,1,0.5)",
        "rotation_3d_x_i": "sin(period=4b)*L"
      },
      {
        "frame": 893,
        "seed": 606,
        "scale": 30,
        "strength": 0.45,
        "rotation_3d_x": 5,
        "rotation_3d_y": 10,
        "rotation_3d_z": 360,
        "translation_x": 0,
        "translation_y": 0,
        "translation_z": 1500,
        "loopback_frames": 10,
        "loopback_decay": 0.2,
        "prompt_weight_1": 0,
        "prompt_weight_2": 0,
        "prompt_weight_3": 0,
        "prompt_weight_4": 1,
        "noise": 0.08,
        "far": 10000,
        "near": 200,
        "fov": 40,
        "contrast": 1.05,
        "perspective_flip_fv": 50,
        "perspective_flip_gamma": 0,
        "perspective_flip_phi": 0,
        "perspective_flip_theta": 0,
        "zoom": 1,
        "angle": 0,
        "prompt_weight_8": 0,
        "prompt_weight_7": 0,
        "prompt_weight_6": 0,
        "prompt_weight_5": 0,
        "noise_i": "",
        "antiblur_threshold": 0,
        "antiblur_amount": 0,
        "antiblur_sigma": 0,
        "antiblur_kernel": 0
      }
    ]
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});


test('Delegated seed', async () => {
  const fixture = {
    "prompts": {
      "positive": "",
      "negative": ""
    },
    "managedFields": [
      "noise",
    ],
    "keyframes": [
      {
        "frame": 0,
        "noise": 0.01,
      },
      {
        "frame": 10,
        "noise": 0.1,
      }
    ]
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});


test('Tutorial 2 part 2', async () => {
  const fixture = {
    "prompts": [
      {
        "name": "Prompt 1",
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a ((vicious snake showing fangs)) \n${\nif (prompt_weight_2>0)\n  \"(daytime, spring, foliage, grass:\" + prompt_weight_2 + \")\"\nelse\n  \"(nighttime, winter, snow, dead plants:\" + -prompt_weight_2 + \")\"\n}\n, Intricate, High Detail, dramatic",
        "negative": "${if (prompt_weight_2>0) \"(nighttime, winter, snow, dead plants)\" else \"(daytime, spring, foliage, grass)\"} (toxic alien mushroom), watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate, obscured, leaves, cat, leopard",
        "allFrames": true,
        "from": 0,
        "to": 45,
        "overlap": {
          "inFrames": 0,
          "outFrames": 30,
          "type": "custom",
          "custom": "prompt_weight_1"
        }
      },
      {
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a ((toxic alien mushroom))\n${\nif (prompt_weight_2>0)\n  \"(daytime, spring, foliage, grass:\" + prompt_weight_2 + \")\"\nelse\n  \"(nighttime, winter, snow, dead plants:\" + -prompt_weight_2 + \")\"\n}\n, Intricate, High Detail, dramatic",
        "negative": "${if (prompt_weight_2>0) \"(nighttime, winter, snow, dead plants)\" else \"(daytime, spring, foliage, grass)\"} (vicious snake showing fangs), watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate, obscured, leaves, cat, leopard",
        "from": 15,
        "to": 75,
        "allFrames": true,
        "name": "Prompt 2",
        "overlap": {
          "inFrames": 30,
          "outFrames": 30,
          "type": "custom",
          "custom": "1-prompt_weight_1"
        }
      }
    ],
    "options": {
      "input_fps": "",
      "bpm": "120",
      "output_fps": "10",
      "cc_window_width": 0,
      "cc_window_slide_rate": 1,
      "cc_use_input": false
    },
    "managedFields": [
      "seed",
      "prompt_weight_1",
      "strength",
      "translation_z",
      "rotation_3d_z",
      "prompt_weight_2"
    ],
    "displayedFields": [
      "strength",
      "rotation_3d_z",
      "translation_z",
      "prompt_weight_1",
      "prompt_weight_2"
    ],
    "keyframes": [
      {
        "frame": 0,
        "seed": 20,
        "seed_i": "S+saw(p=1b, a=5)",
        "strength": 0.725,
        "translation_z": "",
        "rotation_3d_y": "",
        "prompt_weight_1_i": "if (floor(b)%2==0) 1 else 0",
        "strength_i": "S-pulse(p=1b, pw=1f, a=0.25)",
        "translation_z_i": "if (floor(b)%4<2) prev_computed_value+3  else prev_computed_value",
        "rotation_3d_z_i": "if (floor(b)%4>=2) prev_computed_value+3  else prev_computed_value",
        "prompt_weight_2": 1.5
      },
      {
        "frame": 159,
        "seed": "",
        "translation_z": "",
        "rotation_3d_y": "",
        "prompt_weight_2": -1.5
      }
    ]
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});


test('Tutorial 2 part 1', async () => {
  const fixture = {

    "prompts": [
      {
        "name": "Prompt 1",
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (cat), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "allFrames": false,
        "from": 0,
        "to": 45,
        "overlap": {
          "inFrames": 0,
          "outFrames": 30,
          "type": "linear",
          "custom": "prompt_weight_1"
        }
      },
      {
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (duck), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "from": 16,
        "to": 75,
        "allFrames": false,
        "name": "Prompt 2",
        "overlap": {
          "inFrames": 30,
          "outFrames": 30,
          "type": "linear",
          "custom": "prompt_weight_2"
        }
      },
      {
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (fox), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "from": 46,
        "to": 105,
        "allFrames": false,
        "name": "Prompt 3",
        "overlap": {
          "inFrames": 30,
          "outFrames": 30,
          "type": "linear",
          "custom": "prompt_weight_3"
        }
      },
      {
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (bear), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "from": 76,
        "to": 120,
        "allFrames": false,
        "name": "Prompt 4",
        "overlap": {
          "inFrames": 30,
          "outFrames": 0,
          "type": "linear",
          "custom": "prompt_weight_4"
        }
      }
    ],
    "options": {
      "input_fps": "",
      "bpm": 140,
      "output_fps": "10",
      "cc_window_width": 0,
      "cc_window_slide_rate": 1,
      "cc_use_input": false
    },
    "managedFields": [
      "seed",
      "strength",
      "prompt_weight_1",
      "prompt_weight_2",
      "translation_z",
      "rotation_3d_y"
    ],
    "displayedFields": [
      "seed",
      "strength"
    ],
    "keyframes": [
      {
        "frame": 0,
        "seed": -1,
        "zoom": 1,
        "zoom_i": "C"
      },
      {
        "frame": 60,
        "zoom": 0.5
      },
      {
        "frame": 120,
        "zoom": 1
      }
    ]
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});


test('Info Matching', async () => {
  const fixture = {

    "prompts": [
      {
        "name": "Prompt 1",
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (cat), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "allFrames": false,
        "from": 0,
        "to": 45,
        "overlap": {
          "inFrames": 0,
          "outFrames": 30,
          "type": "linear",
          "custom": "prompt_weight_1"
        }
      },
      {
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (duck), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "from": 16,
        "to": 75,
        "allFrames": false,
        "name": "Prompt 2",
        "overlap": {
          "inFrames": 30,
          "outFrames": 30,
          "type": "linear",
          "custom": "prompt_weight_2"
        }
      },
      {
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (fox), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "from": 46,
        "to": 105,
        "allFrames": false,
        "name": "Prompt 3",
        "overlap": {
          "inFrames": 30,
          "outFrames": 30,
          "type": "linear",
          "custom": "prompt_weight_3"
        }
      },
      {
        "positive": "modelshoot style, (extremely detailed 8k wallpaper),a medium shot photo of a (bear), Intricate, High Detail, dramatic",
        "negative": "watermark, logo, text, signature, copyright, writing, letters, low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly, duplicate",
        "from": 76,
        "to": 120,
        "allFrames": false,
        "name": "Prompt 4",
        "overlap": {
          "inFrames": 30,
          "outFrames": 0,
          "type": "linear",
          "custom": "prompt_weight_4"
        }
      }
    ],
    "options": {
      "input_fps": "",
      "bpm": 140,
      "output_fps": "10",
      "cc_window_width": 0,
      "cc_window_slide_rate": 1,
      "cc_use_input": false
    },
    "managedFields": [
      "seed",
      "prompt_weight_3",
      "prompt_weight_4",
      "prompt_weight_1",
      "prompt_weight_2"
    ],
    "displayedFields": [
      "prompt_weight_2",
      "prompt_weight_3",
      "prompt_weight_4",
      "prompt_weight_1",
      "seed"
    ],
    "keyframes": [
      {
        "frame": 0,
        "seed": 0,
        "zoom": 1,
        "zoom_i": "C",
        "seed_i": "info_match(\"beat\")",
        "info": "beat: kick",
        "prompt_weight_3": "",
        "prompt_weight_3_i": "info_match(\"kick\")",
        "prompt_weight_4_i": "info_match_count(\"kick$\")",
        "prompt_weight_1_i": "info_match_last(\"snare\")",
        "prompt_weight_2_i": "info_match_last(\"^beat\")"
      },
      {
        "frame": 10,
        "zoom": 0.5,
        "info": "beat: snare"
      },
      {
        "frame": 20,
        "info": "beat: kick"
      },
      {
        "frame": 25
      },
      {
        "frame": 30,
        "info": "beat: snare"
      },
      {
        "frame": 35,
        "info": "kick not on this row"
      },
      {
        "frame": 40,
        "info": "beat: kick"
      },
      {
        "frame": 50,
        "zoom": 1,
        "info": "beat: snare"
      }
    ]
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});

test('TimeSeries', async () => {
  const fixture = {
      "prompts": [
        {
          "name": "Prompt 1",
          "positive": "Edit1",
          "negative": "",
          "allFrames": true,
          "from": 0,
          "to": 119,
          "overlap": {
            "inFrames": 0,
            "outFrames": 0,
            "type": "none",
            "custom": "prompt_weight_1"
          }
        },
      ],
      "options": {
        "bpm": 140,
        "output_fps": "20",
      },
      "managedFields": [
        "seed",
        "prompt_weight_1"
      ],
      "displayedFields": [
        "seed",
        "prompt_weight_1"
      ],
      "keyframes": [
        {
          "frame": 0,
          "seed": 0,
          "seed_i": "-1",
          "prompt_weight_1_i": "myts"
        },
        {
          "frame": 30,
          "info": ""
        }
      ],
      "timeSeries": [
        {
          "alias": "myts",
          "ts": {
            "data": [
              {
                "x": 0,
                "y": 0.23179130401622036
              },
              {
                "x": 0.8616780045351474,
                "y": 0.25613745664252546
              },
              {
                "x": 1.7233560090702948,
                "y": 0.30297666603772955
              },
              {
                "x": 2.585034013605442,
                "y": 0.33425543184623696
              },
              {
                "x": 3.4467120181405897,
                "y": 0.3422993339717206
              },
              {
                "x": 4.308390022675737,
                "y": 0.364258439940207
              },
              {
                "x": 5.170068027210884,
                "y": 0.41699158147413456
              },
              {
                "x": 6.031746031746032,
                "y": 0.47749855727298196
              },
              {
                "x": 6.893424036281179,
                "y": 0.5336873203936346
              },
              {
                "x": 7.755102040816326,
                "y": 0.5838767807823794
              },
              {
                "x": 8.616780045351474,
                "y": 0.568273936060134
              },
              {
                "x": 9.47845804988662,
                "y": 0.6128347224331298
              },
              {
                "x": 10.340136054421768,
                "y": 0.6198499921949009
              },
              {
                "x": 11.201814058956916,
                "y": 0.679345817049297
              },
              {
                "x": 12.063492063492063,
                "y": 0.6507325477913283
              },
              {
                "x": 12.92517006802721,
                "y": 0.7057759370162072
              },
              {
                "x": 13.786848072562359,
                "y": 0.7439778203270275
              },
              {
                "x": 14.648526077097506,
                "y": 0.6685596102288327
              },
              {
                "x": 15.510204081632653,
                "y": 0.6928210655653003
              },
              {
                "x": 16.3718820861678,
                "y": 0.7528694832202016
              },
              {
                "x": 17.233560090702948,
                "y": 0.7804977998391561
              },
              {
                "x": 18.095238095238095,
                "y": 0.7236316368526495
              },
              {
                "x": 18.95691609977324,
                "y": 0.7478168828304539
              },
              {
                "x": 19.81859410430839,
                "y": 0.7250844457427056
              },
              {
                "x": 20.680272108843536,
                "y": 0.7849596299403058
              },
              {
                "x": 21.541950113378686,
                "y": 0.6776217837457816
              },
              {
                "x": 22.403628117913833,
                "y": 0.6450335415829509
              },
              {
                "x": 23.26530612244898,
                "y": 0.7114762473579843
              },
              {
                "x": 24.126984126984127,
                "y": 0.7158268192476762
              },
              {
                "x": 24.988662131519273,
                "y": 0.6515769420460763
              },
              {
                "x": 25.85034013605442,
                "y": 0.5935722406216148
              },
              {
                "x": 26.712018140589567,
                "y": 0.6215272737079718
              },
              {
                "x": 27.573696145124718,
                "y": 0.6001860150353348
              },
              {
                "x": 28.435374149659864,
                "y": 0.6192115782085331
              },
              {
                "x": 29.29705215419501,
                "y": 0.6585696646476427
              },
              {
                "x": 30.158730158730158,
                "y": 0.7137692297360713
              },
              {
                "x": 31.020408163265305,
                "y": 0.6708955519174779
              },
              {
                "x": 31.882086167800452,
                "y": 0.6551948993316944
              },
              {
                "x": 32.7437641723356,
                "y": 0.6601682345362415
              },
              {
                "x": 33.605442176870746,
                "y": 0.7038142944618607
              },
              {
                "x": 34.467120181405896,
                "y": 0.8031055722669271
              },
              {
                "x": 35.32879818594104,
                "y": 0.854959950598656
              },
              {
                "x": 36.19047619047619,
                "y": 0.841765812426883
              },
              {
                "x": 37.05215419501134,
                "y": 0.7331560068101718
              },
              {
                "x": 37.91383219954648,
                "y": 0.6887016325831439
              },
              {
                "x": 38.775510204081634,
                "y": 0.7275685125731994
              },
              {
                "x": 39.63718820861678,
                "y": 0.8238366239238694
              },
              {
                "x": 40.49886621315193,
                "y": 0.8823096826949645
              },
              {
                "x": 41.36054421768707,
                "y": 0.8803741774151814
              },
              {
                "x": 42.22222222222222,
                "y": 0.8325989313455525
              },
              {
                "x": 43.08390022675737,
                "y": 0.7487986640054866
              },
              {
                "x": 43.945578231292515,
                "y": 0.6585681538658472
              },
              {
                "x": 44.807256235827666,
                "y": 0.6698568353618826
              },
              {
                "x": 45.66893424036281,
                "y": 0.7640081229908209
              },
              {
                "x": 46.53061224489796,
                "y": 0.8170023653082459
              },
              {
                "x": 47.3922902494331,
                "y": 0.8349893414826153
              },
              {
                "x": 48.25396825396825,
                "y": 0.8327842981687689
              },
              {
                "x": 49.1156462585034,
                "y": 0.8120805187464916
              },
              {
                "x": 49.97732426303855,
                "y": 0.7528010215703065
              },
              {
                "x": 50.8390022675737,
                "y": 0.6987505350587376
              },
              {
                "x": 51.70068027210884,
                "y": 0.7363543072446809
              },
              {
                "x": 52.56235827664399,
                "y": 0.817974333361269
              },
              {
                "x": 53.424036281179134,
                "y": 0.8686497879483375
              },
              {
                "x": 54.285714285714285,
                "y": 0.8945815362275154
              },
              {
                "x": 55.147392290249435,
                "y": 0.8899801081753174
              },
              {
                "x": 56.00907029478458,
                "y": 0.8671249069504032
              },
              {
                "x": 56.87074829931973,
                "y": 0.818042512341856
              },
              {
                "x": 57.73242630385487,
                "y": 0.7471709759659821
              },
              {
                "x": 58.59410430839002,
                "y": 0.7263127905754833
              },
              {
                "x": 59.455782312925166,
                "y": 0.7734669211638383
              },
              {
                "x": 60.317460317460316,
                "y": 0.8028838920740485
              },
              {
                "x": 61.17913832199547,
                "y": 0.820213062505071
              },
              {
                "x": 62.04081632653061,
                "y": 0.8299544207732407
              },
              {
                "x": 62.90249433106576,
                "y": 0.8240124977694822
              },
              {
                "x": 63.764172335600904,
                "y": 0.8154306404381985
              },
              {
                "x": 64.62585034013605,
                "y": 0.81326128198309
              },
              {
                "x": 65.4875283446712,
                "y": 0.7916907399556117
              },
              {
                "x": 66.34920634920636,
                "y": 0.7795333268056711
              },
              {
                "x": 67.21088435374149,
                "y": 0.8194357658066621
              },
              {
                "x": 68.07256235827664,
                "y": 0.8504452056595673
              },
              {
                "x": 68.93424036281179,
                "y": 0.8668158958605838
              },
              {
                "x": 69.79591836734694,
                "y": 0.8773979040858838
              },
              {
                "x": 70.65759637188208,
                "y": 0.8749281880763713
              },
              {
                "x": 71.51927437641723,
                "y": 0.8720283521684745
              },
              {
                "x": 72.38095238095238,
                "y": 0.8570848336078252
              },
              {
                "x": 73.24263038548753,
                "y": 0.8275975508486111
              },
              {
                "x": 74.10430839002268,
                "y": 0.8144063121786821
              },
              {
                "x": 74.96598639455782,
                "y": 0.8159409806014163
              },
              {
                "x": 75.82766439909297,
                "y": 0.8083345208299528
              },
              {
                "x": 76.68934240362812,
                "y": 0.8032793999722059
              },
              {
                "x": 77.55102040816327,
                "y": 0.8009778978983383
              },
              {
                "x": 78.41269841269842,
                "y": 0.7985882972233858
              },
              {
                "x": 79.27437641723355,
                "y": 0.8040578027213551
              },
              {
                "x": 80.1360544217687,
                "y": 0.8080277389730876
              },
              {
                "x": 80.99773242630386,
                "y": 0.820594231360135
              },
              {
                "x": 81.859410430839,
                "y": 0.8503271109195737
              },
              {
                "x": 82.72108843537414,
                "y": 0.8717809276541998
              },
              {
                "x": 83.58276643990929,
                "y": 0.8652025993293098
              },
              {
                "x": 84.44444444444444,
                "y": 0.8615726628610356
              },
              {
                "x": 85.3061224489796,
                "y": 0.8579000604586823
              },
              {
                "x": 86.16780045351474,
                "y": 0.8562280286714392
              },
              {
                "x": 87.02947845804988,
                "y": 0.8548283016511863
              },
              {
                "x": 87.89115646258503,
                "y": 0.8536042407574332
              },
              {
                "x": 88.75283446712018,
                "y": 0.8603268621277537
              },
              {
                "x": 89.61451247165533,
                "y": 0.8679964085493864
              },
              {
                "x": 90.47619047619048,
                "y": 0.8670694074014407
              },
              {
                "x": 91.33786848072562,
                "y": 0.8799300214866365
              },
              {
                "x": 92.19954648526077,
                "y": 0.9042273040872132
              },
              {
                "x": 93.06122448979592,
                "y": 0.8657023040598029
              },
              {
                "x": 93.92290249433107,
                "y": 0.821474759104076
              },
              {
                "x": 94.7845804988662,
                "y": 0.7920524817200328
              },
              {
                "x": 95.64625850340136,
                "y": 0.7787339433554006
              },
              {
                "x": 96.5079365079365,
                "y": 0.7692131442393296
              },
              {
                "x": 97.36961451247166,
                "y": 0.7730950418501333
              },
              {
                "x": 98.2312925170068,
                "y": 0.7916955817382333
              },
              {
                "x": 99.09297052154194,
                "y": 0.8172085768515148
              },
              {
                "x": 99.9546485260771,
                "y": 0.8577389528722765
              },
              {
                "x": 100.81632653061224,
                "y": 0.9159444951231493
              },
              {
                "x": 101.6780045351474,
                "y": 0.9568275910462425
              },
              {
                "x": 102.53968253968254,
                "y": 0.921347766598102
              },
              {
                "x": 103.40136054421768,
                "y": 0.8856849089546143
              },
              {
                "x": 104.26303854875283,
                "y": 0.8580577015985515
              },
              {
                "x": 105.12471655328798,
                "y": 0.8467547667167887
              },
              {
                "x": 105.98639455782313,
                "y": 0.8377414960608919
              },
              {
                "x": 106.84807256235827,
                "y": 0.8355262680862103
              },
              {
                "x": 107.70975056689342,
                "y": 0.8495292430693254
              },
              {
                "x": 108.57142857142857,
                "y": 0.8687245705764961
              },
              {
                "x": 109.43310657596372,
                "y": 0.8866651290241488
              },
              {
                "x": 110.29478458049887,
                "y": 0.9209897830506207
              },
              {
                "x": 111.156462585034,
                "y": 0.9696106638007311
              },
              {
                "x": 112.01814058956916,
                "y": 0.9495588268750879
              },
              {
                "x": 112.87981859410431,
                "y": 0.8811401427147657
              },
              {
                "x": 113.74149659863946,
                "y": 0.8161063292981634
              },
              {
                "x": 114.60317460317461,
                "y": 0.773570585849787
              },
              {
                "x": 115.46485260770974,
                "y": 0.750892823858852
              },
              {
                "x": 116.3265306122449,
                "y": 0.7405562582505175
              },
              {
                "x": 117.18820861678005,
                "y": 0.747192451338393
              },
              {
                "x": 118.0498866213152,
                "y": 0.7737487703028516
              },
              {
                "x": 118.91156462585033,
                "y": 0.8146819929166155
              },
              {
                "x": 119.77324263038548,
                "y": 0.8666854878742062
              },
              {
                "x": 120.63492063492063,
                "y": 0.9371009051996353
              },
              {
                "x": 121.49659863945578,
                "y": 0.9968774121114309
              },
              {
                "x": 122.35827664399093,
                "y": 0.9799838607816996
              },
              {
                "x": 123.21995464852607,
                "y": 0.9240936842494059
              },
              {
                "x": 124.08163265306122,
                "y": 0.8728094670439794
              },
              {
                "x": 124.94331065759637,
                "y": 0.8362531559599985
              },
              {
                "x": 125.80498866213152,
                "y": 0.814336862256925
              },
              {
                "x": 126.66666666666667,
                "y": 0.8015870117118975
              },
              {
                "x": 127.52834467120181,
                "y": 0.8066344234066909
              },
              {
                "x": 128.39002267573696,
                "y": 0.8300840781869474
              },
              {
                "x": 129.2517006802721,
                "y": 0.8567349885808453
              },
              {
                "x": 130.11337868480726,
                "y": 0.8910252768720178
              },
              {
                "x": 130.9750566893424,
                "y": 0.9500061810355415
              },
              {
                "x": 131.83673469387756,
                "y": 0.9873468052269359
              },
              {
                "x": 132.6984126984127,
                "y": 0.9631986403229379
              },
              {
                "x": 133.56009070294783,
                "y": 0.8804124515354905
              },
              {
                "x": 134.42176870748298,
                "y": 0.8054408075499808
              },
              {
                "x": 135.28344671201813,
                "y": 0.7430731224834723
              },
              {
                "x": 136.14512471655328,
                "y": 0.6957567472071758
              },
              {
                "x": 137.00680272108843,
                "y": 0.6676495245369466
              },
              {
                "x": 137.86848072562358,
                "y": 0.6595499438742958
              },
              {
                "x": 138.73015873015873,
                "y": 0.6718353344828495
              },
              {
                "x": 139.59183673469389,
                "y": 0.7060935012617159
              },
              {
                "x": 140.45351473922904,
                "y": 0.7561145292885321
              },
              {
                "x": 141.31519274376416,
                "y": 0.8186881646433426
              },
              {
                "x": 142.1768707482993,
                "y": 0.9003754122517719
              },
              {
                "x": 143.03854875283446,
                "y": 0.9303908497649289
              },
              {
                "x": 143.9002267573696,
                "y": 0.8939635815030524
              },
              {
                "x": 144.76190476190476,
                "y": 0.8325211137698396
              },
              {
                "x": 145.6235827664399,
                "y": 0.7787807015701476
              },
              {
                "x": 146.48526077097506,
                "y": 0.7362068534424394
              },
              {
                "x": 147.3469387755102,
                "y": 0.7062116396334304
              },
              {
                "x": 148.20861678004536,
                "y": 0.6864879860575849
              },
              {
                "x": 149.0702947845805,
                "y": 0.6845527720128468
              },
              {
                "x": 149.93197278911563,
                "y": 0.7002391883443762
              },
              {
                "x": 150.79365079365078,
                "y": 0.7213987420461996
              },
              {
                "x": 151.65532879818593,
                "y": 0.7530046055738688
              },
              {
                "x": 152.51700680272108,
                "y": 0.8101345482779991
              },
              {
                "x": 153.37868480725623,
                "y": 0.8489049416693896
              },
              {
                "x": 154.24036281179139,
                "y": 0.8379053773398852
              },
              {
                "x": 155.10204081632654,
                "y": 0.7818111092841347
              },
              {
                "x": 155.9637188208617,
                "y": 0.7053751954529781
              },
              {
                "x": 156.82539682539684,
                "y": 0.64061354975158
              },
              {
                "x": 157.68707482993196,
                "y": 0.5884297546039807
              },
              {
                "x": 158.5487528344671,
                "y": 0.5518412963104837
              },
              {
                "x": 159.41043083900226,
                "y": 0.5346463766694278
              },
              {
                "x": 160.2721088435374,
                "y": 0.5352400079140553
              },
              {
                "x": 161.13378684807256,
                "y": 0.5540784183079531
              },
              {
                "x": 161.9954648526077,
                "y": 0.5923195755211532
              },
              {
                "x": 162.85714285714286,
                "y": 0.6434113870092998
              },
              {
                "x": 163.718820861678,
                "y": 0.7047575608729213
              },
              {
                "x": 164.58049886621316,
                "y": 0.7585871166935654
              },
              {
                "x": 165.44217687074828,
                "y": 0.7731124131639886
              },
              {
                "x": 166.30385487528343,
                "y": 0.7375622763314855
              },
              {
                "x": 167.16553287981858,
                "y": 0.6791281905912716
              },
              {
                "x": 168.02721088435374,
                "y": 0.6291678765055824
              },
              {
                "x": 168.88888888888889,
                "y": 0.5891196657988776
              },
              {
                "x": 169.75056689342404,
                "y": 0.5603079669693547
              },
              {
                "x": 170.6122448979592,
                "y": 0.5417414673185627
              },
              {
                "x": 171.47392290249434,
                "y": 0.53822671431055
              },
              {
                "x": 172.3356009070295,
                "y": 0.5500355330310566
              },
              {
                "x": 173.19727891156464,
                "y": 0.5686069579804022
              },
              {
                "x": 174.05895691609976,
                "y": 0.5958968466285672
              },
              {
                "x": 174.9206349206349,
                "y": 0.6437113066404195
              },
              {
                "x": 175.78231292517006,
                "y": 0.6832974568876198
              },
              {
                "x": 176.6439909297052,
                "y": 0.6840605826455162
              },
              {
                "x": 177.50566893424036,
                "y": 0.6506759411209082
              },
              {
                "x": 178.3673469387755,
                "y": 0.5845294411948134
              },
              {
                "x": 179.22902494331066,
                "y": 0.5235488915157339
              },
              {
                "x": 180.0907029478458,
                "y": 0.47319900344592736
              },
              {
                "x": 180.95238095238096,
                "y": 0.4339359709860342
              },
              {
                "x": 181.81405895691609,
                "y": 0.40962810648858666
              },
              {
                "x": 182.67573696145124,
                "y": 0.40146845431505496
              },
              {
                "x": 183.5374149659864,
                "y": 0.40732566646655965
              },
              {
                "x": 184.39909297052154,
                "y": 0.4285418568188814
              },
              {
                "x": 185.2607709750567,
                "y": 0.4647925852491232
              },
              {
                "x": 186.12244897959184,
                "y": 0.5102712588263063
              },
              {
                "x": 186.984126984127,
                "y": 0.5640569082871377
              },
              {
                "x": 187.84580498866214,
                "y": 0.5955020700301733
              },
              {
                "x": 188.7074829931973,
                "y": 0.5981422356325873
              },
              {
                "x": 189.5691609977324,
                "y": 0.5644077608588871
              },
              {
                "x": 190.43083900226756,
                "y": 0.5152010003204271
              },
              {
                "x": 191.2925170068027,
                "y": 0.4735643829716171
              },
              {
                "x": 192.15419501133786,
                "y": 0.43994511307252016
              },
              {
                "x": 193.015873015873,
                "y": 0.41507994461942915
              },
              {
                "x": 193.87755102040816,
                "y": 0.39914420110937937
              },
              {
                "x": 194.7392290249433,
                "y": 0.39519896844204466
              },
              {
                "x": 195.60090702947846,
                "y": 0.402770535685407
              },
              {
                "x": 196.4625850340136,
                "y": 0.4163679573027496
              },
              {
                "x": 197.32426303854876,
                "y": 0.4375085593123126
              },
              {
                "x": 198.1859410430839,
                "y": 0.47425311958988076
              },
              {
                "x": 199.04761904761904,
                "y": 0.5051817160206137
              },
              {
                "x": 199.9092970521542,
                "y": 0.5085938600697155
              },
              {
                "x": 200.77097505668934,
                "y": 0.487875383984841
              },
              {
                "x": 201.6326530612245,
                "y": 0.44428939235795134
              },
              {
                "x": 202.49433106575964,
                "y": 0.39427362369341684
              },
              {
                "x": 203.3560090702948,
                "y": 0.35214314237576805
              },
              {
                "x": 204.21768707482994,
                "y": 0.31788046573657386
              },
              {
                "x": 205.0793650793651,
                "y": 0.29351187016652613
              },
              {
                "x": 205.9410430839002,
                "y": 0.28128292347939676
              },
              {
                "x": 206.80272108843536,
                "y": 0.279939387691338
              },
              {
                "x": 207.6643990929705,
                "y": 0.28892872996200103
              },
              {
                "x": 208.52607709750566,
                "y": 0.3094439197026607
              },
              {
                "x": 209.3877551020408,
                "y": 0.33912550120694657
              },
              {
                "x": 210.24943310657596,
                "y": 0.37446494982808226
              },
              {
                "x": 211.11111111111111,
                "y": 0.4028313802540173
              },
              {
                "x": 211.97278911564626,
                "y": 0.4138744649498281
              },
              {
                "x": 212.83446712018142,
                "y": 0.40473475545575754
              },
              {
                "x": 213.69614512471654,
                "y": 0.37138621851098175
              },
              {
                "x": 214.5578231292517,
                "y": 0.33660825927854293
              },
              {
                "x": 215.41950113378684,
                "y": 0.3070845978359249
              },
              {
                "x": 216.281179138322,
                "y": 0.28311339462608986
              },
              {
                "x": 217.14285714285714,
                "y": 0.2649753038677933
              },
              {
                "x": 218.0045351473923,
                "y": 0.2536701847231938
              },
              {
                "x": 218.86621315192744,
                "y": 0.2507505020035601
              },
              {
                "x": 219.7278911564626,
                "y": 0.2544531829900369
              },
              {
                "x": 220.58956916099774,
                "y": 0.2621994013201102
              },
              {
                "x": 221.4512471655329,
                "y": 0.27677836855472865
              },
              {
                "x": 222.312925170068,
                "y": 0.30237396949049083
              },
              {
                "x": 223.17460317460316,
                "y": 0.3167330478419004
              },
              {
                "x": 224.0362811791383,
                "y": 0.3151717067860644
              },
              {
                "x": 224.89795918367346,
                "y": 0.2994618042754538
              },
              {
                "x": 225.75963718820861,
                "y": 0.27068224408971026
              },
              {
                "x": 226.62131519274377,
                "y": 0.23782379576536022
              },
              {
                "x": 227.48299319727892,
                "y": 0.20957899879935785
              },
              {
                "x": 228.34467120181407,
                "y": 0.18595666305181163
              },
              {
                "x": 229.20634920634922,
                "y": 0.16810589065535697
              },
              {
                "x": 230.06802721088434,
                "y": 0.1572985885670441
              },
              {
                "x": 230.9297052154195,
                "y": 0.15292079690782392
              },
              {
                "x": 231.79138321995464,
                "y": 0.15449012337161921
              },
              {
                "x": 232.6530612244898,
                "y": 0.1625942824204908
              },
              {
                "x": 233.51473922902494,
                "y": 0.17631229783148442
              },
              {
                "x": 234.3764172335601,
                "y": 0.19370570486281666
              },
              {
                "x": 235.23809523809524,
                "y": 0.2078450635043155
              },
              {
                "x": 236.0997732426304,
                "y": 0.21266928636586907
              },
              {
                "x": 236.96145124716554,
                "y": 0.20807311767595257
              },
              {
                "x": 237.82312925170066,
                "y": 0.19251280611886887
              },
              {
                "x": 238.6848072562358,
                "y": 0.1714968085414476
              },
              {
                "x": 239.54648526077096,
                "y": 0.15290182728105223
              },
              {
                "x": 240.40816326530611,
                "y": 0.136631330501221
              },
              {
                "x": 241.26984126984127,
                "y": 0.12274669866446118
              },
              {
                "x": 242.13151927437642,
                "y": 0.11174787312973994
              },
              {
                "x": 242.99319727891157,
                "y": 0.1044417859027197
              },
              {
                "x": 243.85487528344672,
                "y": 0.10043370856727503
              },
              {
                "x": 244.71655328798187,
                "y": 0.09848686867651628
              },
              {
                "x": 245.57823129251702,
                "y": 0.09925032207383817
              },
              {
                "x": 246.43990929705214,
                "y": 0.10473268795461792
              },
              {
                "x": 247.3015873015873,
                "y": 0.11012721086801476
              },
              {
                "x": 248.16326530612244,
                "y": 0.10910093550949412
              },
              {
                "x": 249.0249433106576,
                "y": 0.10320643215595685
              },
              {
                "x": 249.88662131519274,
                "y": 0.09329454479414274
              },
              {
                "x": 250.7482993197279,
                "y": 0.08045294905334563
              },
              {
                "x": 251.60997732426304,
                "y": 0.06757624209048448
              },
              {
                "x": 252.4716553287982,
                "y": 0.05551527163980886
              },
              {
                "x": 253.33333333333334,
                "y": 0.04441916717578551
              },
              {
                "x": 254.19501133786846,
                "y": 0.03477914371320502
              },
              {
                "x": 255.05668934240362,
                "y": 0.026288217029674592
              },
              {
                "x": 255.91836734693877,
                "y": 0.019095503215697446
              },
              {
                "x": 256.7800453514739,
                "y": 0.013630800954534854
              },
              {
                "x": 257.6417233560091,
                "y": 0.010087078892969684
              },
              {
                "x": 258.5034013605442,
                "y": 0.008297674296722188
              },
              {
                "x": 259.36507936507934,
                "y": 0.007973124693004001
              },
              {
                "x": 260.2267573696145,
                "y": 0.007201249035155428
              },
              {
                "x": 261.08843537414964,
                "y": 0.005710125605220686
              },
              {
                "x": 261.9501133786848,
                "y": 0.003955862746473932
              },
              {
                "x": 262.81179138321994,
                "y": 0.0021489720019647746
              },
              {
                "x": 263.6734693877551,
                "y": 0.0009823872008981826
              },
              {
                "x": 264.53514739229024,
                "y": 0.00043856571468668865
              },
              {
                "x": 265.3968253968254,
                "y": 0.00021051154304961055
              },
              {
                "x": 266.25850340136054,
                "y": 0.00011402708581853907
              },
              {
                "x": 267.12018140589566,
                "y": 0.00005262788576240264
              },
              {
                "x": 267.98185941043084,
                "y": 0.000017542628587467548
              },
              {
                "x": 268.84353741496597,
                "y": 0
              },
              {
                "x": 269.70521541950114,
                "y": 0
              },
              {
                "x": 270.56689342403627,
                "y": 0
              },
              {
                "x": 271.42857142857144,
                "y": 0
              },
              {
                "x": 272.29024943310657,
                "y": 0
              },
              {
                "x": 273.15192743764175,
                "y": 0
              },
              {
                "x": 274.01360544217687,
                "y": 0
              },
              {
                "x": 274.875283446712,
                "y": 0
              },
              {
                "x": 275.73696145124717,
                "y": 0
              },
              {
                "x": 276.5986394557823,
                "y": 0
              },
              {
                "x": 277.46031746031747,
                "y": 0
              },
              {
                "x": 278.3219954648526,
                "y": 0
              },
              {
                "x": 279.18367346938777,
                "y": 0
              },
              {
                "x": 280.0453514739229,
                "y": 0
              },
              {
                "x": 280.90702947845807,
                "y": 0
              },
              {
                "x": 281.7687074829932,
                "y": 0
              },
              {
                "x": 282.6303854875283,
                "y": 0
              },
              {
                "x": 283.4920634920635,
                "y": 0
              },
              {
                "x": 284.3537414965986,
                "y": 0
              },
              {
                "x": 285.2154195011338,
                "y": 0
              },
              {
                "x": 286.0770975056689,
                "y": 0
              },
              {
                "x": 286.9387755102041,
                "y": 0
              },
              {
                "x": 287.8004535147392,
                "y": 0
              },
              {
                "x": 288.6621315192744,
                "y": 0
              },
              {
                "x": 289.5238095238095,
                "y": 0
              },
              {
                "x": 290.38548752834464,
                "y": 0
              },
              {
                "x": 291.2471655328798,
                "y": 0
              },
              {
                "x": 292.10884353741494,
                "y": 0
              },
              {
                "x": 292.9705215419501,
                "y": 0
              },
              {
                "x": 293.83219954648524,
                "y": 0
              },
              {
                "x": 294.6938775510204,
                "y": 0
              },
              {
                "x": 295.55555555555554,
                "y": 0
              },
              {
                "x": 296.4172335600907,
                "y": 0
              },
              {
                "x": 297.27891156462584,
                "y": 0
              },
              {
                "x": 298.140589569161,
                "y": 0
              },
              {
                "x": 299.00226757369614,
                "y": 0
              },
              {
                "x": 299.86394557823127,
                "y": 0
              },
              {
                "x": 300.72562358276645,
                "y": 0
              },
              {
                "x": 301.58730158730157,
                "y": 0
              },
              {
                "x": 302.44897959183675,
                "y": 0
              },
              {
                "x": 303.31065759637187,
                "y": 0
              },
              {
                "x": 304.17233560090705,
                "y": 0
              },
              {
                "x": 305.03401360544217,
                "y": 0
              },
              {
                "x": 305.89569160997735,
                "y": 0
              },
              {
                "x": 306.75736961451247,
                "y": 0
              },
              {
                "x": 307.6190476190476,
                "y": 0
              },
              {
                "x": 308.48072562358277,
                "y": 0
              },
              {
                "x": 309.3424036281179,
                "y": 0
              },
              {
                "x": 310.2040816326531,
                "y": 0
              },
              {
                "x": 311.0657596371882,
                "y": 0
              },
              {
                "x": 311.9274376417234,
                "y": 0
              },
              {
                "x": 312.7891156462585,
                "y": 0
              },
              {
                "x": 313.6507936507937,
                "y": 0
              },
              {
                "x": 314.5124716553288,
                "y": 0
              },
              {
                "x": 315.3741496598639,
                "y": 0
              },
              {
                "x": 316.2358276643991,
                "y": 0
              },
              {
                "x": 317.0975056689342,
                "y": 0
              },
              {
                "x": 317.9591836734694,
                "y": 0
              },
              {
                "x": 318.8208616780045,
                "y": 0
              },
              {
                "x": 319.6825396825397,
                "y": 0
              },
              {
                "x": 320.5442176870748,
                "y": 0
              },
              {
                "x": 321.40589569161,
                "y": 0
              },
              {
                "x": 322.2675736961451,
                "y": 0
              },
              {
                "x": 323.12925170068024,
                "y": 0
              },
              {
                "x": 323.9909297052154,
                "y": 0
              },
              {
                "x": 324.85260770975054,
                "y": 0
              },
              {
                "x": 325.7142857142857,
                "y": 0
              },
              {
                "x": 326.57596371882084,
                "y": 0
              },
              {
                "x": 327.437641723356,
                "y": 0
              },
              {
                "x": 328.29931972789115,
                "y": 0
              },
              {
                "x": 329.1609977324263,
                "y": 0
              },
              {
                "x": 330.02267573696145,
                "y": 0
              },
              {
                "x": 330.88435374149657,
                "y": 0
              },
              {
                "x": 331.74603174603175,
                "y": 0
              },
              {
                "x": 332.60770975056687,
                "y": 0
              },
              {
                "x": 333.46938775510205,
                "y": 0
              },
              {
                "x": 334.33106575963717,
                "y": 0
              },
              {
                "x": 335.19274376417235,
                "y": 0
              },
              {
                "x": 336.05442176870747,
                "y": 0
              },
              {
                "x": 336.91609977324265,
                "y": 0
              },
              {
                "x": 337.77777777777777,
                "y": 0
              },
              {
                "x": 338.6394557823129,
                "y": 0
              },
              {
                "x": 339.5011337868481,
                "y": 0
              },
              {
                "x": 340.3628117913832,
                "y": 0
              },
              {
                "x": 341.2244897959184,
                "y": 0
              },
              {
                "x": 342.0861678004535,
                "y": 0
              },
              {
                "x": 342.9478458049887,
                "y": 0
              },
              {
                "x": 343.8095238095238,
                "y": 0
              },
              {
                "x": 344.671201814059,
                "y": 0
              },
              {
                "x": 345.5328798185941,
                "y": 0
              },
              {
                "x": 346.3945578231293,
                "y": 0
              },
              {
                "x": 347.2562358276644,
                "y": 0
              },
              {
                "x": 348.1179138321995,
                "y": 0
              },
              {
                "x": 348.9795918367347,
                "y": 0
              },
              {
                "x": 349.8412698412698,
                "y": 0
              },
              {
                "x": 350.702947845805,
                "y": 0
              },
              {
                "x": 351.5646258503401,
                "y": 0
              },
              {
                "x": 352.4263038548753,
                "y": 0
              },
              {
                "x": 353.2879818594104,
                "y": 0
              },
              {
                "x": 354.1496598639456,
                "y": 0
              },
              {
                "x": 355.0113378684807,
                "y": 0
              },
              {
                "x": 355.87301587301585,
                "y": 0
              },
              {
                "x": 356.734693877551,
                "y": 0
              },
              {
                "x": 357.59637188208615,
                "y": 0
              },
              {
                "x": 358.4580498866213,
                "y": 0
              },
              {
                "x": 359.31972789115645,
                "y": 0
              },
              {
                "x": 360.1814058956916,
                "y": 0
              },
              {
                "x": 361.04308390022675,
                "y": 0
              },
              {
                "x": 361.9047619047619,
                "y": 0
              },
              {
                "x": 362.76643990929705,
                "y": 0
              },
              {
                "x": 363.62811791383217,
                "y": 0
              },
              {
                "x": 364.48979591836735,
                "y": 0
              },
              {
                "x": 365.35147392290247,
                "y": 0
              },
              {
                "x": 366.21315192743765,
                "y": 0
              },
              {
                "x": 367.0748299319728,
                "y": 0
              },
              {
                "x": 367.93650793650795,
                "y": 0
              },
              {
                "x": 368.7981859410431,
                "y": 0
              },
              {
                "x": 369.65986394557825,
                "y": 0
              },
              {
                "x": 370.5215419501134,
                "y": 0
              },
              {
                "x": 371.3832199546485,
                "y": 0
              },
              {
                "x": 372.2448979591837,
                "y": 0
              },
              {
                "x": 373.1065759637188,
                "y": 0
              },
              {
                "x": 373.968253968254,
                "y": 0
              },
              {
                "x": 374.8299319727891,
                "y": 0
              },
              {
                "x": 375.6916099773243,
                "y": 0
              },
              {
                "x": 376.5532879818594,
                "y": 0
              },
              {
                "x": 377.4149659863946,
                "y": 0
              },
              {
                "x": 378.2766439909297,
                "y": 0
              },
              {
                "x": 379.1383219954648,
                "y": 0
              },
              {
                "x": 380,
                "y": 0
              },
              {
                "x": 380.8616780045351,
                "y": 0
              },
              {
                "x": 381.7233560090703,
                "y": 0
              },
              {
                "x": 382.5850340136054,
                "y": 0
              },
              {
                "x": 383.4467120181406,
                "y": 0
              },
              {
                "x": 384.3083900226757,
                "y": 0
              },
              {
                "x": 385.1700680272109,
                "y": 0
              },
              {
                "x": 386.031746031746,
                "y": 0
              },
              {
                "x": 386.89342403628115,
                "y": 0
              },
              {
                "x": 387.7551020408163,
                "y": 0
              },
              {
                "x": 388.61678004535145,
                "y": 0
              },
              {
                "x": 389.4784580498866,
                "y": 0
              },
              {
                "x": 390.34013605442175,
                "y": 0
              },
              {
                "x": 391.2018140589569,
                "y": 0
              },
              {
                "x": 392.06349206349205,
                "y": 0
              },
              {
                "x": 392.9251700680272,
                "y": 0
              },
              {
                "x": 393.78684807256235,
                "y": 0
              },
              {
                "x": 394.64852607709753,
                "y": 0
              },
              {
                "x": 395.51020408163265,
                "y": 0
              },
              {
                "x": 396.3718820861678,
                "y": 0
              },
              {
                "x": 397.23356009070295,
                "y": 0
              },
              {
                "x": 398.0952380952381,
                "y": 0
              },
              {
                "x": 398.95691609977325,
                "y": 0
              },
              {
                "x": 399.8185941043084,
                "y": 0
              },
              {
                "x": 400.68027210884355,
                "y": 0
              },
              {
                "x": 401.5419501133787,
                "y": 0
              },
              {
                "x": 402.40362811791385,
                "y": 0
              },
              {
                "x": 403.265306122449,
                "y": 0
              },
              {
                "x": 404.1269841269841,
                "y": 0
              },
              {
                "x": 404.9886621315193,
                "y": 0
              },
              {
                "x": 405.8503401360544,
                "y": 0
              },
              {
                "x": 406.7120181405896,
                "y": 0
              },
              {
                "x": 407.5736961451247,
                "y": 0
              },
              {
                "x": 408.4353741496599,
                "y": 0
              },
              {
                "x": 409.297052154195,
                "y": 0
              },
              {
                "x": 410.1587301587302,
                "y": 0
              },
              {
                "x": 411.0204081632653,
                "y": 0
              },
              {
                "x": 411.8820861678004,
                "y": 0
              },
              {
                "x": 412.7437641723356,
                "y": 0
              },
              {
                "x": 413.6054421768707,
                "y": 0
              },
              {
                "x": 414.4671201814059,
                "y": 0
              },
              {
                "x": 415.328798185941,
                "y": 0
              },
              {
                "x": 416.1904761904762,
                "y": 0
              },
              {
                "x": 417.0521541950113,
                "y": 0
              },
              {
                "x": 417.9138321995465,
                "y": 0
              },
              {
                "x": 418.7755102040816,
                "y": 0
              },
              {
                "x": 419.63718820861675,
                "y": 0
              },
              {
                "x": 420.4988662131519,
                "y": 0
              },
              {
                "x": 421.36054421768705,
                "y": 0
              },
              {
                "x": 422.22222222222223,
                "y": 0
              },
              {
                "x": 423.08390022675735,
                "y": 0
              },
              {
                "x": 423.94557823129253,
                "y": 0
              },
              {
                "x": 424.80725623582765,
                "y": 0
              },
              {
                "x": 425.66893424036283,
                "y": 0
              },
              {
                "x": 426.53061224489795,
                "y": 0
              },
              {
                "x": 427.3922902494331,
                "y": 0
              },
              {
                "x": 428.25396825396825,
                "y": 0
              },
              {
                "x": 429.1156462585034,
                "y": 0
              },
              {
                "x": 429.97732426303855,
                "y": 0
              },
              {
                "x": 430.8390022675737,
                "y": 0
              },
              {
                "x": 431.70068027210885,
                "y": 0
              },
              {
                "x": 432.562358276644,
                "y": 0
              },
              {
                "x": 433.42403628117916,
                "y": 0
              },
              {
                "x": 434.2857142857143,
                "y": 0
              },
              {
                "x": 435.1473922902494,
                "y": 0
              },
              {
                "x": 436.0090702947846,
                "y": 0
              },
              {
                "x": 436.8707482993197,
                "y": 0
              },
              {
                "x": 437.7324263038549,
                "y": 0
              },
              {
                "x": 438.59410430839,
                "y": 0
              },
              {
                "x": 439.4557823129252,
                "y": 0
              },
              {
                "x": 440.3174603174603,
                "y": 0
              },
              {
                "x": 441.1791383219955,
                "y": 0
              },
              {
                "x": 442.0408163265306,
                "y": 0
              },
              {
                "x": 442.9024943310658,
                "y": 0
              },
              {
                "x": 443.7641723356009,
                "y": 0
              },
              {
                "x": 444.625850340136,
                "y": 0
              },
              {
                "x": 445.4875283446712,
                "y": 0
              },
              {
                "x": 446.3492063492063,
                "y": 0
              },
              {
                "x": 447.2108843537415,
                "y": 0
              },
              {
                "x": 448.0725623582766,
                "y": 0
              },
              {
                "x": 448.9342403628118,
                "y": 0
              },
              {
                "x": 449.7959183673469,
                "y": 0
              },
              {
                "x": 450.6575963718821,
                "y": 0
              },
              {
                "x": 451.51927437641723,
                "y": 0
              },
              {
                "x": 452.38095238095235,
                "y": 0
              },
              {
                "x": 453.24263038548753,
                "y": 0
              },
              {
                "x": 454.10430839002265,
                "y": 0
              },
              {
                "x": 454.96598639455783,
                "y": 0
              },
              {
                "x": 455.82766439909295,
                "y": 0
              },
              {
                "x": 456.68934240362813,
                "y": 0
              },
              {
                "x": 457.55102040816325,
                "y": 0
              },
              {
                "x": 458.41269841269843,
                "y": 0
              },
              {
                "x": 459.27437641723355,
                "y": 0
              },
              {
                "x": 460.1360544217687,
                "y": 0
              },
              {
                "x": 460.99773242630386,
                "y": 0
              },
              {
                "x": 461.859410430839,
                "y": 0
              },
              {
                "x": 462.72108843537416,
                "y": 0
              },
              {
                "x": 463.5827664399093,
                "y": 0
              },
              {
                "x": 464.44444444444446,
                "y": 0
              },
              {
                "x": 465.3061224489796,
                "y": 0
              },
              {
                "x": 466.16780045351476,
                "y": 0
              },
              {
                "x": 467.0294784580499,
                "y": 0
              },
              {
                "x": 467.891156462585,
                "y": 0
              },
              {
                "x": 468.7528344671202,
                "y": 0
              },
              {
                "x": 469.6145124716553,
                "y": 0
              },
              {
                "x": 470.4761904761905,
                "y": 0
              },
              {
                "x": 471.3378684807256,
                "y": 0
              },
              {
                "x": 472.1995464852608,
                "y": 0
              },
              {
                "x": 473.0612244897959,
                "y": 0
              },
              {
                "x": 473.9229024943311,
                "y": 0
              },
              {
                "x": 474.7845804988662,
                "y": 0
              },
              {
                "x": 475.6462585034013,
                "y": 0
              },
              {
                "x": 476.5079365079365,
                "y": 0
              },
              {
                "x": 477.3696145124716,
                "y": 0
              },
              {
                "x": 478.2312925170068,
                "y": 0
              },
              {
                "x": 479.09297052154193,
                "y": 0
              },
              {
                "x": 479.9546485260771,
                "y": 0
              },
              {
                "x": 480.81632653061223,
                "y": 0
              },
              {
                "x": 481.6780045351474,
                "y": 0
              },
              {
                "x": 482.53968253968253,
                "y": 0
              },
              {
                "x": 483.4013605442177,
                "y": 0
              },
              {
                "x": 484.26303854875283,
                "y": 0
              },
              {
                "x": 485.12471655328795,
                "y": 0
              },
              {
                "x": 485.98639455782313,
                "y": 0
              },
              {
                "x": 486.84807256235825,
                "y": 0
              },
              {
                "x": 487.70975056689343,
                "y": 0
              },
              {
                "x": 488.57142857142856,
                "y": 0
              },
              {
                "x": 489.43310657596373,
                "y": 0
              },
              {
                "x": 490.29478458049886,
                "y": 0
              },
              {
                "x": 491.15646258503403,
                "y": 0
              },
              {
                "x": 492.01814058956916,
                "y": 0
              },
              {
                "x": 492.8798185941043,
                "y": 0
              },
              {
                "x": 493.74149659863946,
                "y": 0
              },
              {
                "x": 494.6031746031746,
                "y": 0
              },
              {
                "x": 495.46485260770976,
                "y": 0
              },
              {
                "x": 496.3265306122449,
                "y": 0
              },
              {
                "x": 497.18820861678006,
                "y": 0.118246087993825
              },
              {
                "x": 498.0498866213152,
                "y": 0.16462002666479547
              },
              {
                "x": 498.91156462585036,
                "y": 0.2677092835590485
              },
              {
                "x": 499.7732426303855,
                "y": 0.3170654690898885
              },
              {
                "x": 500.6349206349206,
                "y": 0.3522833709791747
              },
              {
                "x": 501.4965986394558,
                "y": 0.4088249889125105
              },
              {
                "x": 502.3582766439909,
                "y": 0.5231450143575451
              },
              {
                "x": 503.2199546485261,
                "y": 0.5580822256236952
              },
              {
                "x": 504.0816326530612,
                "y": 0.6419886181575526
              },
              {
                "x": 504.9433106575964,
                "y": 0.7300262997237585
              },
              {
                "x": 505.8049886621315,
                "y": 0.6851018635685105
              },
              {
                "x": 506.6666666666667,
                "y": 0.6953818439207666
              },
              {
                "x": 507.5283446712018,
                "y": 0.6074581894403792
              },
              {
                "x": 508.39002267573693,
                "y": 0.6041177234752715
              },
              {
                "x": 509.2517006802721,
                "y": 0.6600541035908665
              },
              {
                "x": 510.11337868480723,
                "y": 0.6411951996721174
              },
              {
                "x": 510.9750566893424,
                "y": 0.6373937343281284
              },
              {
                "x": 511.83673469387753,
                "y": 0.6780740235882571
              },
              {
                "x": 512.6984126984127,
                "y": 0.6812343521123518
              },
              {
                "x": 513.5600907029478,
                "y": 0.7297877482418997
              },
              {
                "x": 514.421768707483,
                "y": 0.7017450041540396
              },
              {
                "x": 515.2834467120182,
                "y": 0.7209190972001417
              },
              {
                "x": 516.1451247165533,
                "y": 0.8386652202792239
              },
              {
                "x": 517.0068027210884,
                "y": 0.8768716605619233
              },
              {
                "x": 517.8684807256236,
                "y": 0.7922872931871421
              },
              {
                "x": 518.7301587301587,
                "y": 0.8332154962792497
              },
              {
                "x": 519.5918367346939,
                "y": 0.8365520733999342
              },
              {
                "x": 520.453514739229,
                "y": 0.8257828781323872
              },
              {
                "x": 521.3151927437642,
                "y": 0.7627057016677969
              },
              {
                "x": 522.1768707482993,
                "y": 0.6921713919181521
              },
              {
                "x": 523.0385487528345,
                "y": 0.7134755309711682
              },
              {
                "x": 523.9002267573696,
                "y": 0.7308953611585235
              },
              {
                "x": 524.7619047619047,
                "y": 0.6898719242067306
              },
              {
                "x": 525.6235827664399,
                "y": 0.6441119775363215
              },
              {
                "x": 526.4852607709751,
                "y": 0.658830691551662
              },
              {
                "x": 527.3469387755102,
                "y": 0.6511467846725943
              },
              {
                "x": 528.2086167800453,
                "y": 0.650936264563808
              },
              {
                "x": 529.0702947845805,
                "y": 0.7182143009735337
              },
              {
                "x": 529.9319727891157,
                "y": 0.7971066453567129
              },
              {
                "x": 530.7936507936508,
                "y": 0.7714079279421456
              },
              {
                "x": 531.6553287981859,
                "y": 0.7430502688305042
              },
              {
                "x": 532.5170068027211,
                "y": 0.7264987987582286
              },
              {
                "x": 533.3786848072563,
                "y": 0.7503567736371846
              },
              {
                "x": 534.2403628117913,
                "y": 0.8188870522141264
              },
              {
                "x": 535.1020408163265,
                "y": 0.9087397469845867
              },
              {
                "x": 535.9637188208617,
                "y": 0.9042642138462872
              },
              {
                "x": 536.8253968253969,
                "y": 0.7956104745664778
              },
              {
                "x": 537.6870748299319,
                "y": 0.7163680014162932
              },
              {
                "x": 538.5487528344671,
                "y": 0.6981932814267968
              },
              {
                "x": 539.4104308390023,
                "y": 0.7635591113603323
              },
              {
                "x": 540.2721088435374,
                "y": 0.8444781175923511
              },
              {
                "x": 541.1337868480725,
                "y": 0.8701461097096804
              },
              {
                "x": 541.9954648526077,
                "y": 0.8337212655512662
              },
              {
                "x": 542.8571428571429,
                "y": 0.7672534835822926
              },
              {
                "x": 543.718820861678,
                "y": 0.6586909265687496
              },
              {
                "x": 544.5804988662131,
                "y": 0.6455690403853238
              },
              {
                "x": 545.4421768707483,
                "y": 0.7297473436622869
              },
              {
                "x": 546.3038548752835,
                "y": 0.7921448589065571
              },
              {
                "x": 547.1655328798186,
                "y": 0.8267714208857603
              },
              {
                "x": 548.0272108843537,
                "y": 0.8316187284074912
              },
              {
                "x": 548.8888888888889,
                "y": 0.8150373125200097
              },
              {
                "x": 549.750566893424,
                "y": 0.7658534267811798
              },
              {
                "x": 550.6122448979592,
                "y": 0.6871986477494316
              },
              {
                "x": 551.4739229024943,
                "y": 0.7003297035539036
              },
              {
                "x": 552.3356009070295,
                "y": 0.787773685349589
              },
              {
                "x": 553.1972789115646,
                "y": 0.847185240487167
              },
              {
                "x": 554.0589569160998,
                "y": 0.8806515477446621
              },
              {
                "x": 554.9206349206349,
                "y": 0.8837514364312018
              },
              {
                "x": 555.7823129251701,
                "y": 0.8647031997531834
              },
              {
                "x": 556.6439909297052,
                "y": 0.8245590442306544
              },
              {
                "x": 557.5056689342404,
                "y": 0.7554684230030048
              },
              {
                "x": 558.3673469387755,
                "y": 0.7079191282166739
              },
              {
                "x": 559.2290249433106,
                "y": 0.7574682623183516
              },
              {
                "x": 560.0907029478458,
                "y": 0.7932974451525607
              },
              {
                "x": 560.952380952381,
                "y": 0.8126529861973777
              },
              {
                "x": 561.8140589569161,
                "y": 0.8251048090683605
              },
              {
                "x": 562.6757369614512,
                "y": 0.8233818882398878
              },
              {
                "x": 563.5374149659864,
                "y": 0.8129930373752555
              },
              {
                "x": 564.3990929705216,
                "y": 0.8112006312913622
              },
              {
                "x": 565.2607709750566,
                "y": 0.7961030493919561
              },
              {
                "x": 566.1224489795918,
                "y": 0.7628236614974387
              },
              {
                "x": 566.984126984127,
                "y": 0.8018573720566758
              },
              {
                "x": 567.8458049886622,
                "y": 0.8376469554905138
              },
              {
                "x": 568.7074829931972,
                "y": 0.8556665157269665
              },
              {
                "x": 569.5691609977324,
                "y": 0.8685728537142131
              },
              {
                "x": 570.4308390022676,
                "y": 0.8689801630559917
              },
              {
                "x": 571.2925170068028,
                "y": 0.8655103030735782
              },
              {
                "x": 572.1541950113378,
                "y": 0.8562069537472152
              },
              {
                "x": 573.015873015873,
                "y": 0.8274216288207297
              },
              {
                "x": 573.8775510204082,
                "y": 0.8086784480036489
              },
              {
                "x": 574.7392290249433,
                "y": 0.810651993719739
              },
              {
                "x": 575.6009070294784,
                "y": 0.8040458321044357
              },
              {
                "x": 576.4625850340136,
                "y": 0.796877047211051
              },
              {
                "x": 577.3242630385488,
                "y": 0.7949177634464248
              },
              {
                "x": 578.1859410430839,
                "y": 0.7914756735821171
              },
              {
                "x": 579.047619047619,
                "y": 0.795269823787037
              },
              {
                "x": 579.9092970521542,
                "y": 0.8001518653707417
              },
              {
                "x": 580.7709750566893,
                "y": 0.808121974924457
              },
              {
                "x": 581.6326530612245,
                "y": 0.8351354943636082
              },
              {
                "x": 582.4943310657596,
                "y": 0.8608694126727949
              },
              {
                "x": 583.3560090702948,
                "y": 0.8664655111921971
              },
              {
                "x": 584.2176870748299,
                "y": 0.8629054111745448
              },
              {
                "x": 585.0793650793651,
                "y": 0.859048319936978
              },
              {
                "x": 585.9410430839002,
                "y": 0.857332311657954
              },
              {
                "x": 586.8027210884354,
                "y": 0.8561254593290603
              },
              {
                "x": 587.6643990929705,
                "y": 0.8542873721717994
              },
              {
                "x": 588.5260770975057,
                "y": 0.8584926948657112
              },
              {
                "x": 589.3877551020408,
                "y": 0.8677850543519973
              },
              {
                "x": 590.2494331065759,
                "y": 0.8680248350170603
              },
              {
                "x": 591.1111111111111,
                "y": 0.8747720828801488
              },
              {
                "x": 591.9727891156463,
                "y": 0.9052009371052908
              },
              {
                "x": 592.8344671201814,
                "y": 0.8736670991093074
              },
              {
                "x": 593.6961451247165,
                "y": 0.829159163331226
              },
              {
                "x": 594.5578231292517,
                "y": 0.7939917950050998
              },
              {
                "x": 595.4195011337869,
                "y": 0.7776647900608195
              },
              {
                "x": 596.281179138322,
                "y": 0.7667318436064041
              },
              {
                "x": 597.1428571428571,
                "y": 0.7660789032014543
              },
              {
                "x": 598.0045351473923,
                "y": 0.7817760181380159
              },
              {
                "x": 598.8662131519275,
                "y": 0.8054029836662026
              },
              {
                "x": 599.7278911564625,
                "y": 0.8407580444130359
              },
              {
                "x": 600.5895691609977,
                "y": 0.8956740782659236
              },
              {
                "x": 601.4512471655329,
                "y": 0.953608518700442
              },
              {
                "x": 602.3129251700681,
                "y": 0.9314960353659393
              },
              {
                "x": 603.1746031746031,
                "y": 0.895762705265886
              },
              {
                "x": 604.0362811791383,
                "y": 0.8649336855233022
              },
              {
                "x": 604.8979591836735,
                "y": 0.8500606372777842
              },
              {
                "x": 605.7596371882086,
                "y": 0.8408718632443831
              },
              {
                "x": 606.6213151927437,
                "y": 0.8355076734780947
              },
              {
                "x": 607.4829931972789,
                "y": 0.8454583269547149
              },
              {
                "x": 608.3446712018141,
                "y": 0.8649081082337697
              },
              {
                "x": 609.2063492063492,
                "y": 0.8821207932125652
              },
              {
                "x": 610.0680272108843,
                "y": 0.9102969700625451
              },
              {
                "x": 610.9297052154195,
                "y": 0.9629354901869551
              },
              {
                "x": 611.7913832199547,
                "y": 0.9611285459065922
              },
              {
                "x": 612.6530612244898,
                "y": 0.8928417141299843
              },
              {
                "x": 613.5147392290249,
                "y": 0.8262204812724218
              },
              {
                "x": 614.3764172335601,
                "y": 0.7772378989097806
              },
              {
                "x": 615.2380952380952,
                "y": 0.7501920823607225
              },
              {
                "x": 616.0997732426304,
                "y": 0.7363732792805658
              },
              {
                "x": 616.9614512471655,
                "y": 0.7380009662493532
              },
              {
                "x": 617.8231292517007,
                "y": 0.7595136338773925
              },
              {
                "x": 618.6848072562358,
                "y": 0.7974293102306966
              },
              {
                "x": 619.546485260771,
                "y": 0.8460380709988554
              },
              {
                "x": 620.4081632653061,
                "y": 0.9111027296330082
              },
              {
                "x": 621.2698412698412,
                "y": 0.988307838046453
              },
              {
                "x": 622.1315192743764,
                "y": 0.9923250999929829
              },
              {
                "x": 622.9931972789116,
                "y": 0.9345312120537869
              },
              {
                "x": 623.8548752834467,
                "y": 0.8816942323777444
              },
              {
                "x": 624.7165532879818,
                "y": 0.8406204802890752
              },
              {
                "x": 625.578231292517,
                "y": 0.815660386342817
              },
              {
                "x": 626.4399092970522,
                "y": 0.8002176566522471
              },
              {
                "x": 627.3015873015873,
                "y": 0.7995461200331062
              },
              {
                "x": 628.1632653061224,
                "y": 0.8195399026788417
              },
              {
                "x": 629.0249433106576,
                "y": 0.8461909072958422
              },
              {
                "x": 629.8866213151928,
                "y": 0.8765517752694713
              },
              {
                "x": 630.7482993197278,
                "y": 0.9283754754155137
              },
              {
                "x": 631.609977324263,
                "y": 0.983934674026439
              },
              {
                "x": 632.4716553287982,
                "y": 0.9752069464834705
              },
              {
                "x": 633.3333333333334,
                "y": 0.9078324213336455
              },
              {
                "x": 634.1950113378684,
                "y": 0.830115510157456
              },
              {
                "x": 635.0566893424036,
                "y": 0.7642218424022328
              },
              {
                "x": 635.9183673469388,
                "y": 0.7125637179449579
              },
              {
                "x": 636.7800453514739,
                "y": 0.6790971965440473
              },
              {
                "x": 637.641723356009,
                "y": 0.665848760167872
              },
              {
                "x": 638.5034013605442,
                "y": 0.6725028385137996
              },
              {
                "x": 639.3650793650794,
                "y": 0.7012173462128206
              },
              {
                "x": 640.2267573696145,
                "y": 0.7479225990103217
              },
              {
                "x": 641.0884353741496,
                "y": 0.8066541717124566
              },
              {
                "x": 641.9501133786848,
                "y": 0.8831222370359975
              },
              {
                "x": 642.81179138322,
                "y": 0.9285313311346572
              },
              {
                "x": 643.6734693877551,
                "y": 0.9101992842607537
              },
              {
                "x": 644.5351473922902,
                "y": 0.8455199167424106
              },
              {
                "x": 645.3968253968254,
                "y": 0.7899022505547857
              },
              {
                "x": 646.2585034013605,
                "y": 0.7437933871691023
              },
              {
                "x": 647.1201814058957,
                "y": 0.710929825099993
              },
              {
                "x": 647.9818594104308,
                "y": 0.6881361344297111
              },
              {
                "x": 648.843537414966,
                "y": 0.6807363401855572
              },
              {
                "x": 649.7052154195011,
                "y": 0.6929405533082109
              },
              {
                "x": 650.5668934240363,
                "y": 0.713266892112286
              },
              {
                "x": 651.4285714285714,
                "y": 0.7403907082589599
              },
              {
                "x": 652.2902494331066,
                "y": 0.7902756738425155
              },
              {
                "x": 653.1519274376417,
                "y": 0.8439665289730217
              },
              {
                "x": 654.0136054421769,
                "y": 0.8452120941485467
              },
              {
                "x": 654.875283446712,
                "y": 0.8009506931188491
              },
              {
                "x": 655.7369614512471,
                "y": 0.7222519086859586
              },
              {
                "x": 656.5986394557823,
                "y": 0.6541660119588648
              },
              {
                "x": 657.4603174603175,
                "y": 0.5986053122025976
              },
              {
                "x": 658.3219954648526,
                "y": 0.557376820081979
              },
              {
                "x": 659.1836734693877,
                "y": 0.5350506216189325
              },
              {
                "x": 660.0453514739229,
                "y": 0.5311620170363593
              },
              {
                "x": 660.9070294784581,
                "y": 0.5448778513966674
              },
              {
                "x": 661.7687074829931,
                "y": 0.578373556262225
              },
              {
                "x": 662.6303854875283,
                "y": 0.6268250201260548
              },
              {
                "x": 663.4920634920635,
                "y": 0.684995789769139
              },
              {
                "x": 664.3537414965987,
                "y": 0.7477720861693917
              },
              {
                "x": 665.2154195011337,
                "y": 0.7737439477931373
              },
              {
                "x": 666.0770975056689,
                "y": 0.7520349449161462
              },
              {
                "x": 666.9387755102041,
                "y": 0.6904780389417574
              },
              {
                "x": 667.8004535147393,
                "y": 0.6384826257566629
              },
              {
                "x": 668.6621315192743,
                "y": 0.5954608067354649
              },
              {
                "x": 669.5238095238095,
                "y": 0.5638948038631335
              },
              {
                "x": 670.3854875283447,
                "y": 0.5423898539637844
              },
              {
                "x": 671.2471655328798,
                "y": 0.5343753824601398
              },
              {
                "x": 672.1088435374149,
                "y": 0.542877407126172
              },
              {
                "x": 672.9705215419501,
                "y": 0.5602472048459592
              },
              {
                "x": 673.8321995464853,
                "y": 0.5840900355025799
              },
              {
                "x": 674.6938775510204,
                "y": 0.6258436072776966
              },
              {
                "x": 675.5555555555555,
                "y": 0.6769556167727814
              },
              {
                "x": 676.4172335600907,
                "y": 0.6872359097744237
              },
              {
                "x": 677.2789115646258,
                "y": 0.6627017963343308
              },
              {
                "x": 678.140589569161,
                "y": 0.6049321590662087
              },
              {
                "x": 679.0022675736961,
                "y": 0.5412764184876966
              },
              {
                "x": 679.8639455782313,
                "y": 0.4881986859354854
              },
              {
                "x": 680.7256235827664,
                "y": 0.44574290363840974
              },
              {
                "x": 681.5873015873016,
                "y": 0.4171195096797621
              },
              {
                "x": 682.4489795918367,
                "y": 0.4049162130909262
              },
              {
                "x": 683.3106575963719,
                "y": 0.40712446855600326
              },
              {
                "x": 684.172335600907,
                "y": 0.4240689089269641
              },
              {
                "x": 685.0340136054422,
                "y": 0.4568197459022202
              },
              {
                "x": 685.8956916099773,
                "y": 0.5003510485129745
              },
              {
                "x": 686.7573696145124,
                "y": 0.5515665567328609
              },
              {
                "x": 687.6190476190476,
                "y": 0.5897393165391903
              },
              {
                "x": 688.4807256235828,
                "y": 0.6006859167777701
              },
              {
                "x": 689.342403628118,
                "y": 0.5770296821275701
              },
              {
                "x": 690.204081632653,
                "y": 0.5252966117577823
              },
              {
                "x": 691.0657596371882,
                "y": 0.4818091357384186
              },
              {
                "x": 691.9274376417234,
                "y": 0.44591800335557596
              },
              {
                "x": 692.7891156462586,
                "y": 0.4188072970687913
              },
              {
                "x": 693.6507936507936,
                "y": 0.40031028267341984
              },
              {
                "x": 694.5124716553288,
                "y": 0.39292666910573165
              },
              {
                "x": 695.374149659864,
                "y": 0.39796331795246825
              },
              {
                "x": 696.235827664399,
                "y": 0.4103152386373105
              },
              {
                "x": 697.0975056689342,
                "y": 0.4286929237558988
              },
              {
                "x": 697.9591836734694,
                "y": 0.46084137530370683
              },
              {
                "x": 698.8208616780046,
                "y": 0.49993631803113603
              },
              {
                "x": 699.6825396825396,
                "y": 0.5101025818055257
              },
              {
                "x": 700.5442176870748,
                "y": 0.495603156001114
              },
              {
                "x": 701.40589569161,
                "y": 0.4578590395743199
              },
              {
                "x": 702.2675736961451,
                "y": 0.4060627412197088
              },
              {
                "x": 703.1292517006802,
                "y": 0.3618359414830676
              },
              {
                "x": 703.9909297052154,
                "y": 0.3254418440362327
              },
              {
                "x": 704.8526077097506,
                "y": 0.2981348324805743
              },
              {
                "x": 705.7142857142857,
                "y": 0.2827130802789744
              },
              {
                "x": 706.5759637188208,
                "y": 0.2786942336711706
              },
              {
                "x": 707.437641723356,
                "y": 0.2848328174218723
              },
              {
                "x": 708.2993197278912,
                "y": 0.30234812130953803
              },
              {
                "x": 709.1609977324263,
                "y": 0.33005606073319693
              },
              {
                "x": 710.0226757369614,
                "y": 0.36399200056136416
              },
              {
                "x": 710.8843537414966,
                "y": 0.3970598554487405
              },
              {
                "x": 711.7460317460317,
                "y": 0.41271665146305525
              },
              {
                "x": 712.6077097505669,
                "y": 0.40938355203143645
              },
              {
                "x": 713.469387755102,
                "y": 0.3824994737211424
              },
              {
                "x": 714.3310657596372,
                "y": 0.34614257940986054
              },
              {
                "x": 715.1927437641723,
                "y": 0.3152505297651124
              },
              {
                "x": 716.0544217687075,
                "y": 0.2897618356466076
              },
              {
                "x": 716.9160997732426,
                "y": 0.27005363465961546
              },
              {
                "x": 717.7777777777777,
                "y": 0.2567486344417031
              },
              {
                "x": 718.6394557823129,
                "y": 0.25160980064001814
              },
              {
                "x": 719.5011337868481,
                "y": 0.253926613968085
              },
              {
                "x": 720.3628117913833,
                "y": 0.26060274908579606
              },
              {
                "x": 721.2244897959183,
                "y": 0.27284857883979363
              },
              {
                "x": 722.0861678004535,
                "y": 0.2954444288329136
              },
              {
                "x": 722.9478458049887,
                "y": 0.31458402123336465
              },
              {
                "x": 723.8095238095239,
                "y": 0.31695234783071696
              },
              {
                "x": 724.6712018140589,
                "y": 0.3048914212794415
              },
              {
                "x": 725.5328798185941,
                "y": 0.27938366197266584
              },
              {
                "x": 726.3945578231293,
                "y": 0.24548144866170302
              },
              {
                "x": 727.2562358276643,
                "y": 0.21600867626031453
              },
              {
                "x": 728.1179138321995,
                "y": 0.1911408138830581
              },
              {
                "x": 728.9795918367347,
                "y": 0.1715883893821459
              },
              {
                "x": 729.8412698412699,
                "y": 0.1589127652277554
              },
              {
                "x": 730.7029478458049,
                "y": 0.1529560984498484
              },
              {
                "x": 731.5646258503401,
                "y": 0.1529026825163174
              },
              {
                "x": 732.4263038548753,
                "y": 0.15927883697203543
              },
              {
                "x": 733.2879818594104,
                "y": 0.17172495613314967
              },
              {
                "x": 734.1496598639455,
                "y": 0.188258718686408
              },
              {
                "x": 735.0113378684807,
                "y": 0.2050470142446144
              },
              {
                "x": 735.8730158730159,
                "y": 0.21223949196547612
              },
              {
                "x": 736.734693877551,
                "y": 0.21025717493509227
              },
              {
                "x": 737.5963718820861,
                "y": 0.19767033892358432
              },
              {
                "x": 738.4580498866213,
                "y": 0.17594381777681925
              },
              {
                "x": 739.3197278911565,
                "y": 0.15674358745615372
              },
              {
                "x": 740.1814058956916,
                "y": 0.13985030648248437
              },
              {
                "x": 741.0430839002267,
                "y": 0.1253165813272321
              },
              {
                "x": 741.9047619047619,
                "y": 0.11346692974028208
              },
              {
                "x": 742.766439909297,
                "y": 0.10516091054234203
              },
              {
                "x": 743.6281179138322,
                "y": 0.10041604494765788
              },
              {
                "x": 744.4897959183673,
                "y": 0.09796924763717582
              },
              {
                "x": 745.3514739229025,
                "y": 0.09782926851084807
              },
              {
                "x": 746.2131519274376,
                "y": 0.10194332435184442
              },
              {
                "x": 747.0748299319728,
                "y": 0.10940794061086997
              },
              {
                "x": 747.936507936508,
                "y": 0.10987283418775985
              },
              {
                "x": 748.7981859410431,
                "y": 0.10518003783220325
              },
              {
                "x": 749.6598639455782,
                "y": 0.09624179580171321
              },
              {
                "x": 750.5215419501134,
                "y": 0.08404929712691832
              },
              {
                "x": 751.3832199546486,
                "y": 0.0709620807624417
              },
              {
                "x": 752.2448979591836,
                "y": 0.058699367941576056
              },
              {
                "x": 753.1065759637188,
                "y": 0.04733134523942741
              },
              {
                "x": 753.968253968254,
                "y": 0.037349227670786404
              },
              {
                "x": 754.8299319727892,
                "y": 0.028568832625523677
              },
              {
                "x": 755.6916099773242,
                "y": 0.020981393607572358
              },
              {
                "x": 756.5532879818594,
                "y": 0.01501670930019371
              },
              {
                "x": 757.4149659863946,
                "y": 0.010973006263129562
              },
              {
                "x": 758.2766439909296,
                "y": 0.008745022568231918
              },
              {
                "x": 759.1383219954648,
                "y": 0.008052066521647604
              },
              {
                "x": 760,
                "y": 0.007534558978317312
              },
              {
                "x": 760.8616780045352,
                "y": 0.00618377657708231
              },
              {
                "x": 761.7233560090702,
                "y": 0.004455827661216757
              },
              {
                "x": 762.5850340136054,
                "y": 0.002561223773770262
              },
              {
                "x": 763.4467120181406,
                "y": 0.001201670058241527
              },
              {
                "x": 764.3083900226758,
                "y": 0.0005262788576240264
              },
              {
                "x": 765.1700680272108,
                "y": 0.00024559680022454564
              },
              {
                "x": 766.031746031746,
                "y": 0.00012279840011227282
              },
              {
                "x": 766.8934240362812,
                "y": 0.00006139920005613641
              },
              {
                "x": 767.7551020408163,
                "y": 0.00002631394288120132
              },
              {
                "x": 768.6167800453514,
                "y": 0.000008771314293733774
              },
              {
                "x": 769.4784580498866,
                "y": 0
              },
              {
                "x": 770.3401360544218,
                "y": 0
              },
              {
                "x": 771.2018140589569,
                "y": 0
              },
              {
                "x": 772.063492063492,
                "y": 0
              },
              {
                "x": 772.9251700680272,
                "y": 0
              },
              {
                "x": 773.7868480725623,
                "y": 0
              },
              {
                "x": 774.6485260770975,
                "y": 0
              },
              {
                "x": 775.5102040816327,
                "y": 0
              },
              {
                "x": 776.3718820861678,
                "y": 0
              },
              {
                "x": 777.2335600907029,
                "y": 0
              },
              {
                "x": 778.0952380952381,
                "y": 0
              },
              {
                "x": 778.9569160997733,
                "y": 0
              },
              {
                "x": 779.8185941043084,
                "y": 0
              },
              {
                "x": 780.6802721088435,
                "y": 0
              },
              {
                "x": 781.5419501133787,
                "y": 0
              },
              {
                "x": 782.4036281179139,
                "y": 0
              },
              {
                "x": 783.2653061224489,
                "y": 0
              },
              {
                "x": 784.1269841269841,
                "y": 0
              },
              {
                "x": 784.9886621315193,
                "y": 0
              },
              {
                "x": 785.8503401360545,
                "y": 0
              },
              {
                "x": 786.7120181405895,
                "y": 0
              },
              {
                "x": 787.5736961451247,
                "y": 0
              },
              {
                "x": 788.4353741496599,
                "y": 0
              },
              {
                "x": 789.2970521541951,
                "y": 0
              },
              {
                "x": 790.1587301587301,
                "y": 0
              },
              {
                "x": 791.0204081632653,
                "y": 0
              },
              {
                "x": 791.8820861678005,
                "y": 0
              },
              {
                "x": 792.7437641723355,
                "y": 0
              },
              {
                "x": 793.6054421768707,
                "y": 0
              },
              {
                "x": 794.4671201814059,
                "y": 0
              },
              {
                "x": 795.3287981859411,
                "y": 0
              },
              {
                "x": 796.1904761904761,
                "y": 0
              },
              {
                "x": 797.0521541950113,
                "y": 0
              },
              {
                "x": 797.9138321995465,
                "y": 0
              },
              {
                "x": 798.7755102040816,
                "y": 0
              },
              {
                "x": 799.6371882086167,
                "y": 0
              },
              {
                "x": 800.4988662131519,
                "y": 0
              },
              {
                "x": 801.3605442176871,
                "y": 0
              },
              {
                "x": 802.2222222222222,
                "y": 0
              },
              {
                "x": 803.0839002267574,
                "y": 0
              },
              {
                "x": 803.9455782312925,
                "y": 0
              },
              {
                "x": 804.8072562358277,
                "y": 0
              },
              {
                "x": 805.6689342403628,
                "y": 0
              },
              {
                "x": 806.530612244898,
                "y": 0
              },
              {
                "x": 807.3922902494331,
                "y": 0
              },
              {
                "x": 808.2539682539682,
                "y": 0
              },
              {
                "x": 809.1156462585034,
                "y": 0
              },
              {
                "x": 809.9773242630386,
                "y": 0
              },
              {
                "x": 810.8390022675737,
                "y": 0
              },
              {
                "x": 811.7006802721088,
                "y": 0
              },
              {
                "x": 812.562358276644,
                "y": 0
              },
              {
                "x": 813.4240362811792,
                "y": 0
              },
              {
                "x": 814.2857142857142,
                "y": 0
              },
              {
                "x": 815.1473922902494,
                "y": 0
              },
              {
                "x": 816.0090702947846,
                "y": 0
              },
              {
                "x": 816.8707482993198,
                "y": 0
              },
              {
                "x": 817.7324263038548,
                "y": 0
              },
              {
                "x": 818.59410430839,
                "y": 0
              },
              {
                "x": 819.4557823129252,
                "y": 0
              },
              {
                "x": 820.3174603174604,
                "y": 0
              },
              {
                "x": 821.1791383219954,
                "y": 0
              },
              {
                "x": 822.0408163265306,
                "y": 0
              },
              {
                "x": 822.9024943310658,
                "y": 0
              },
              {
                "x": 823.7641723356008,
                "y": 0
              },
              {
                "x": 824.625850340136,
                "y": 0
              },
              {
                "x": 825.4875283446712,
                "y": 0
              },
              {
                "x": 826.3492063492064,
                "y": 0
              },
              {
                "x": 827.2108843537414,
                "y": 0
              },
              {
                "x": 828.0725623582766,
                "y": 0
              },
              {
                "x": 828.9342403628118,
                "y": 0
              },
              {
                "x": 829.795918367347,
                "y": 0
              },
              {
                "x": 830.657596371882,
                "y": 0
              },
              {
                "x": 831.5192743764172,
                "y": 0
              },
              {
                "x": 832.3809523809524,
                "y": 0
              },
              {
                "x": 833.2426303854875,
                "y": 0
              },
              {
                "x": 834.1043083900227,
                "y": 0
              },
              {
                "x": 834.9659863945578,
                "y": 0
              },
              {
                "x": 835.827664399093,
                "y": 0
              },
              {
                "x": 836.6893424036281,
                "y": 0
              },
              {
                "x": 837.5510204081633,
                "y": 0
              },
              {
                "x": 838.4126984126984,
                "y": 0
              },
              {
                "x": 839.2743764172335,
                "y": 0
              },
              {
                "x": 840.1360544217687,
                "y": 0
              },
              {
                "x": 840.9977324263039,
                "y": 0
              },
              {
                "x": 841.859410430839,
                "y": 0
              },
              {
                "x": 842.7210884353741,
                "y": 0
              },
              {
                "x": 843.5827664399093,
                "y": 0
              },
              {
                "x": 844.4444444444445,
                "y": 0
              },
              {
                "x": 845.3061224489796,
                "y": 0
              },
              {
                "x": 846.1678004535147,
                "y": 0
              },
              {
                "x": 847.0294784580499,
                "y": 0
              },
              {
                "x": 847.8911564625851,
                "y": 0
              },
              {
                "x": 848.7528344671201,
                "y": 0
              },
              {
                "x": 849.6145124716553,
                "y": 0
              },
              {
                "x": 850.4761904761905,
                "y": 0
              },
              {
                "x": 851.3378684807257,
                "y": 0
              },
              {
                "x": 852.1995464852607,
                "y": 0
              },
              {
                "x": 853.0612244897959,
                "y": 0
              },
              {
                "x": 853.9229024943311,
                "y": 0
              },
              {
                "x": 854.7845804988661,
                "y": 0
              },
              {
                "x": 855.6462585034013,
                "y": 0
              },
              {
                "x": 856.5079365079365,
                "y": 0
              },
              {
                "x": 857.3696145124717,
                "y": 0
              },
              {
                "x": 858.2312925170068,
                "y": 0
              },
              {
                "x": 859.0929705215419,
                "y": 0
              },
              {
                "x": 859.9546485260771,
                "y": 0
              },
              {
                "x": 860.8163265306123,
                "y": 0
              },
              {
                "x": 861.6780045351474,
                "y": 0
              },
              {
                "x": 862.5396825396825,
                "y": 0
              },
              {
                "x": 863.4013605442177,
                "y": 0
              },
              {
                "x": 864.2630385487528,
                "y": 0
              },
              {
                "x": 865.124716553288,
                "y": 0
              },
              {
                "x": 865.9863945578231,
                "y": 0
              },
              {
                "x": 866.8480725623583,
                "y": 0
              },
              {
                "x": 867.7097505668934,
                "y": 0
              },
              {
                "x": 868.5714285714286,
                "y": 0
              },
              {
                "x": 869.4331065759637,
                "y": 0
              },
              {
                "x": 870.2947845804988,
                "y": 0
              },
              {
                "x": 871.156462585034,
                "y": 0
              },
              {
                "x": 872.0181405895692,
                "y": 0
              },
              {
                "x": 872.8798185941043,
                "y": 0
              },
              {
                "x": 873.7414965986394,
                "y": 0
              },
              {
                "x": 874.6031746031746,
                "y": 0
              },
              {
                "x": 875.4648526077098,
                "y": 0
              },
              {
                "x": 876.3265306122449,
                "y": 0
              },
              {
                "x": 877.18820861678,
                "y": 0
              },
              {
                "x": 878.0498866213152,
                "y": 0
              },
              {
                "x": 878.9115646258504,
                "y": 0
              },
              {
                "x": 879.7732426303854,
                "y": 0
              },
              {
                "x": 880.6349206349206,
                "y": 0
              },
              {
                "x": 881.4965986394558,
                "y": 0
              },
              {
                "x": 882.358276643991,
                "y": 0
              },
              {
                "x": 883.219954648526,
                "y": 0
              },
              {
                "x": 884.0816326530612,
                "y": 0
              },
              {
                "x": 884.9433106575964,
                "y": 0
              },
              {
                "x": 885.8049886621316,
                "y": 0
              },
              {
                "x": 886.6666666666666,
                "y": 0
              },
              {
                "x": 887.5283446712018,
                "y": 0
              },
              {
                "x": 888.390022675737,
                "y": 0
              },
              {
                "x": 889.251700680272,
                "y": 0
              },
              {
                "x": 890.1133786848072,
                "y": 0
              },
              {
                "x": 890.9750566893424,
                "y": 0
              },
              {
                "x": 891.8367346938776,
                "y": 0
              },
              {
                "x": 892.6984126984127,
                "y": 0
              },
              {
                "x": 893.5600907029478,
                "y": 0
              },
              {
                "x": 894.421768707483,
                "y": 0
              },
              {
                "x": 895.2834467120181,
                "y": 0
              },
              {
                "x": 896.1451247165533,
                "y": 0
              },
              {
                "x": 897.0068027210884,
                "y": 0
              },
              {
                "x": 897.8684807256236,
                "y": 0
              },
              {
                "x": 898.7301587301587,
                "y": 0
              },
              {
                "x": 899.5918367346939,
                "y": 0
              },
              {
                "x": 900.453514739229,
                "y": 0
              },
              {
                "x": 901.3151927437642,
                "y": 0
              },
              {
                "x": 902.1768707482993,
                "y": 0
              },
              {
                "x": 903.0385487528345,
                "y": 0
              },
              {
                "x": 903.9002267573696,
                "y": 0
              },
              {
                "x": 904.7619047619047,
                "y": 0
              },
              {
                "x": 905.6235827664399,
                "y": 0
              },
              {
                "x": 906.4852607709751,
                "y": 0
              },
              {
                "x": 907.3469387755102,
                "y": 0
              },
              {
                "x": 908.2086167800453,
                "y": 0
              },
              {
                "x": 909.0702947845805,
                "y": 0
              },
              {
                "x": 909.9319727891157,
                "y": 0
              },
              {
                "x": 910.7936507936507,
                "y": 0
              },
              {
                "x": 911.6553287981859,
                "y": 0
              },
              {
                "x": 912.5170068027211,
                "y": 0
              },
              {
                "x": 913.3786848072563,
                "y": 0
              },
              {
                "x": 914.2403628117913,
                "y": 0
              },
              {
                "x": 915.1020408163265,
                "y": 0
              },
              {
                "x": 915.9637188208617,
                "y": 0
              },
              {
                "x": 916.8253968253969,
                "y": 0
              },
              {
                "x": 917.6870748299319,
                "y": 0
              },
              {
                "x": 918.5487528344671,
                "y": 0
              },
              {
                "x": 919.4104308390023,
                "y": 0
              },
              {
                "x": 920.2721088435374,
                "y": 0
              },
              {
                "x": 921.1337868480725,
                "y": 0
              },
              {
                "x": 921.9954648526077,
                "y": 0
              },
              {
                "x": 922.8571428571429,
                "y": 0
              },
              {
                "x": 923.718820861678,
                "y": 0
              },
              {
                "x": 924.5804988662131,
                "y": 0
              },
              {
                "x": 925.4421768707483,
                "y": 0
              },
              {
                "x": 926.3038548752835,
                "y": 0
              },
              {
                "x": 927.1655328798186,
                "y": 0
              },
              {
                "x": 928.0272108843537,
                "y": 0
              },
              {
                "x": 928.8888888888889,
                "y": 0
              },
              {
                "x": 929.750566893424,
                "y": 0
              },
              {
                "x": 930.6122448979592,
                "y": 0
              },
              {
                "x": 931.4739229024943,
                "y": 0
              },
              {
                "x": 932.3356009070295,
                "y": 0
              },
              {
                "x": 933.1972789115646,
                "y": 0
              },
              {
                "x": 934.0589569160998,
                "y": 0
              },
              {
                "x": 934.9206349206349,
                "y": 0
              },
              {
                "x": 935.78231292517,
                "y": 0
              },
              {
                "x": 936.6439909297052,
                "y": 0
              },
              {
                "x": 937.5056689342404,
                "y": 0
              },
              {
                "x": 938.3673469387755,
                "y": 0
              },
              {
                "x": 939.2290249433106,
                "y": 0
              },
              {
                "x": 940.0907029478458,
                "y": 0
              },
              {
                "x": 940.952380952381,
                "y": 0
              },
              {
                "x": 941.8140589569161,
                "y": 0
              },
              {
                "x": 942.6757369614512,
                "y": 0
              },
              {
                "x": 943.5374149659864,
                "y": 0
              },
              {
                "x": 944.3990929705216,
                "y": 0
              },
              {
                "x": 945.2607709750566,
                "y": 0
              },
              {
                "x": 946.1224489795918,
                "y": 0
              },
              {
                "x": 946.984126984127,
                "y": 0
              },
              {
                "x": 947.8458049886622,
                "y": 0
              },
              {
                "x": 948.7074829931972,
                "y": 0
              },
              {
                "x": 949.5691609977324,
                "y": 0
              },
              {
                "x": 950.4308390022676,
                "y": 0
              },
              {
                "x": 951.2925170068027,
                "y": 0
              },
              {
                "x": 952.1541950113378,
                "y": 0
              },
              {
                "x": 953.015873015873,
                "y": 0
              },
              {
                "x": 953.8775510204082,
                "y": 0
              },
              {
                "x": 954.7392290249433,
                "y": 0
              },
              {
                "x": 955.6009070294784,
                "y": 0
              },
              {
                "x": 956.4625850340136,
                "y": 0
              },
              {
                "x": 957.3242630385488,
                "y": 0
              },
              {
                "x": 958.1859410430839,
                "y": 0
              },
              {
                "x": 959.047619047619,
                "y": 0
              },
              {
                "x": 959.9092970521542,
                "y": 0
              },
              {
                "x": 960.7709750566893,
                "y": 0
              },
              {
                "x": 961.6326530612245,
                "y": 0
              },
              {
                "x": 962.4943310657596,
                "y": 0
              },
              {
                "x": 963.3560090702948,
                "y": 0
              },
              {
                "x": 964.2176870748299,
                "y": 0
              },
              {
                "x": 965.0793650793651,
                "y": 0
              },
              {
                "x": 965.9410430839002,
                "y": 0
              },
              {
                "x": 966.8027210884354,
                "y": 0
              },
              {
                "x": 967.6643990929705,
                "y": 0
              },
              {
                "x": 968.5260770975057,
                "y": 0
              },
              {
                "x": 969.3877551020408,
                "y": 0
              },
              {
                "x": 970.2494331065759,
                "y": 0
              },
              {
                "x": 971.1111111111111,
                "y": 0
              },
              {
                "x": 971.9727891156463,
                "y": 0
              },
              {
                "x": 972.8344671201814,
                "y": 0
              },
              {
                "x": 973.6961451247165,
                "y": 0
              },
              {
                "x": 974.5578231292517,
                "y": 0
              },
              {
                "x": 975.4195011337869,
                "y": 0
              },
              {
                "x": 976.2811791383219,
                "y": 0
              },
              {
                "x": 977.1428571428571,
                "y": 0
              },
              {
                "x": 978.0045351473923,
                "y": 0
              },
              {
                "x": 978.8662131519275,
                "y": 0
              },
              {
                "x": 979.7278911564625,
                "y": 0
              },
              {
                "x": 980.5895691609977,
                "y": 0
              },
              {
                "x": 981.4512471655329,
                "y": 0
              },
              {
                "x": 982.3129251700681,
                "y": 0
              },
              {
                "x": 983.1746031746031,
                "y": 0
              },
              {
                "x": 984.0362811791383,
                "y": 0
              },
              {
                "x": 984.8979591836735,
                "y": 0
              },
              {
                "x": 985.7596371882086,
                "y": 0
              },
              {
                "x": 986.6213151927437,
                "y": 0
              },
              {
                "x": 987.4829931972789,
                "y": 0
              },
              {
                "x": 988.3446712018141,
                "y": 0
              },
              {
                "x": 989.2063492063492,
                "y": 0
              },
              {
                "x": 990.0680272108843,
                "y": 0
              },
              {
                "x": 990.9297052154195,
                "y": 0
              },
              {
                "x": 991.7913832199546,
                "y": 0
              },
              {
                "x": 992.6530612244898,
                "y": 0
              },
              {
                "x": 993.5147392290249,
                "y": 0
              },
              {
                "x": 994.3764172335601,
                "y": 0
              },
              {
                "x": 995.2380952380952,
                "y": 0
              },
              {
                "x": 996.0997732426304,
                "y": 0
              },
              {
                "x": 996.9614512471655,
                "y": 0.056943372394919665
              },
              {
                "x": 997.8231292517007,
                "y": 0.06382008280120693
              },
              {
                "x": 998.6848072562358,
                "y": 0.17689454735358487
              },
              {
                "x": 999.546485260771,
                "y": 0.23618166803535717
              },
              {
                "x": 1000.4081632653061,
                "y": 0.30205624704653405
              },
              {
                "x": 1001.2698412698412,
                "y": 0.3550086714378048
              },
              {
                "x": 1002.1315192743764,
                "y": 0.48767480013052816
              },
              {
                "x": 1002.9931972789116,
                "y": 0.5010865486995705
              },
              {
                "x": 1003.8548752834467,
                "y": 0.6188151291500651
              },
              {
                "x": 1004.7165532879818,
                "y": 0.6512777633511738
              },
              {
                "x": 1005.578231292517,
                "y": 0.6535513411236766
              },
              {
                "x": 1006.4399092970522,
                "y": 0.6527443802086532
              },
              {
                "x": 1007.3015873015872,
                "y": 0.6227605759608154
              },
              {
                "x": 1008.1632653061224,
                "y": 0.6564083654799718
              },
              {
                "x": 1009.0249433106576,
                "y": 0.6770566689090624
              },
              {
                "x": 1009.8866213151928,
                "y": 0.6383751728736964
              },
              {
                "x": 1010.7482993197278,
                "y": 0.6057546550153006
              },
              {
                "x": 1011.609977324263,
                "y": 0.6797051968118466
              },
              {
                "x": 1012.4716553287982,
                "y": 0.6185445482375689
              },
              {
                "x": 1013.3333333333334,
                "y": 0.7206555209187624
              },
              {
                "x": 1014.1950113378684,
                "y": 0.7475930494255338
              },
              {
                "x": 1015.0566893424036,
                "y": 0.7813538381421151
              },
              {
                "x": 1015.9183673469388,
                "y": 0.8122727210275267
              },
              {
                "x": 1016.7800453514739,
                "y": 0.8317071182436212
              },
              {
                "x": 1017.641723356009,
                "y": 0.7850498592683738
              },
              {
                "x": 1018.5034013605442,
                "y": 0.858029858136326
              },
              {
                "x": 1019.3650793650794,
                "y": 0.8784443811988523
              },
              {
                "x": 1020.2267573696145,
                "y": 0.8742016005387232
              },
              {
                "x": 1021.0884353741496,
                "y": 0.8365539717813114
              },
              {
                "x": 1021.9501133786848,
                "y": 0.7411530545348243
              },
              {
                "x": 1022.81179138322,
                "y": 0.7308353592442526
              },
              {
                "x": 1023.6734693877551,
                "y": 0.7740691673980663
              },
              {
                "x": 1024.5351473922901,
                "y": 0.7436677920559852
              },
              {
                "x": 1025.3968253968253,
                "y": 0.6913030457223945
              },
              {
                "x": 1026.2585034013605,
                "y": 0.6593406173473709
              },
              {
                "x": 1027.1201814058957,
                "y": 0.6270261061466766
              },
              {
                "x": 1027.9818594104308,
                "y": 0.601702550864372
              },
              {
                "x": 1028.843537414966,
                "y": 0.633280250250051
              },
              {
                "x": 1029.7052154195012,
                "y": 0.7046809285810125
              },
              {
                "x": 1030.5668934240364,
                "y": 0.715453627234835
              },
              {
                "x": 1031.4285714285713,
                "y": 0.6553174964369962
              },
              {
                "x": 1032.2902494331065,
                "y": 0.6544842215790915
              },
              {
                "x": 1033.1519274376417,
                "y": 0.6780965996578229
              },
              {
                "x": 1034.0136054421769,
                "y": 0.7321629809643978
              },
              {
                "x": 1034.875283446712,
                "y": 0.836883461405943
              },
              {
                "x": 1035.7369614512472,
                "y": 0.8631781870570486
              },
              {
                "x": 1036.5986394557824,
                "y": 0.7932152804655156
              },
              {
                "x": 1037.4603174603174,
                "y": 0.7184901712283898
              },
              {
                "x": 1038.3219954648525,
                "y": 0.7090694884418748
              },
              {
                "x": 1039.1836734693877,
                "y": 0.7649269224459578
              },
              {
                "x": 1040.045351473923,
                "y": 0.8650725553867383
              },
              {
                "x": 1040.907029478458,
                "y": 0.8936879660788607
              },
              {
                "x": 1041.7687074829932,
                "y": 0.8654906061622322
              },
              {
                "x": 1042.6303854875284,
                "y": 0.8032070837408339
              },
              {
                "x": 1043.4920634920634,
                "y": 0.701249651888464
              },
              {
                "x": 1044.3537414965986,
                "y": 0.6619629351668305
              },
              {
                "x": 1045.2154195011337,
                "y": 0.7189238501903376
              },
              {
                "x": 1046.077097505669,
                "y": 0.7879616443788485
              },
              {
                "x": 1046.938775510204,
                "y": 0.8287019323410967
              },
              {
                "x": 1047.8004535147393,
                "y": 0.8341544605490953
              },
              {
                "x": 1048.6621315192745,
                "y": 0.8264058523785064
              },
              {
                "x": 1049.5238095238094,
                "y": 0.7843703308169713
              },
              {
                "x": 1050.3854875283446,
                "y": 0.7184251744189554
              },
              {
                "x": 1051.2471655328798,
                "y": 0.7068905449274941
              },
              {
                "x": 1052.108843537415,
                "y": 0.778738573136041
              },
              {
                "x": 1052.9705215419501,
                "y": 0.8442986568445306
              },
              {
                "x": 1053.8321995464853,
                "y": 0.8838785444675484
              },
              {
                "x": 1054.6938775510205,
                "y": 0.8954515912877277
              },
              {
                "x": 1055.5555555555557,
                "y": 0.8804383561967691
              },
              {
                "x": 1056.4172335600906,
                "y": 0.848021985539118
              },
              {
                "x": 1057.2789115646258,
                "y": 0.7840365925869786
              },
              {
                "x": 1058.140589569161,
                "y": 0.7175237864295639
              },
              {
                "x": 1059.0022675736961,
                "y": 0.7425044895381177
              },
              {
                "x": 1059.8639455782313,
                "y": 0.7835617825638812
              },
              {
                "x": 1060.7256235827665,
                "y": 0.8058384025434002
              },
              {
                "x": 1061.5873015873017,
                "y": 0.8202902478223499
              },
              {
                "x": 1062.4489795918366,
                "y": 0.82308457955236
              },
              {
                "x": 1063.3106575963718,
                "y": 0.812625489647485
              },
              {
                "x": 1064.172335600907,
                "y": 0.8090961663214904
              },
              {
                "x": 1065.0340136054422,
                "y": 0.8001733327127742
              },
              {
                "x": 1065.8956916099773,
                "y": 0.7695337870641138
              },
              {
                "x": 1066.7573696145125,
                "y": 0.7996553995594059
              },
              {
                "x": 1067.6190476190477,
                "y": 0.8380410007891441
              },
              {
                "x": 1068.4807256235827,
                "y": 0.859568941125568
              },
              {
                "x": 1069.3424036281178,
                "y": 0.8738522726680913
              },
              {
                "x": 1070.204081632653,
                "y": 0.878022492973355
              },
              {
                "x": 1071.0657596371882,
                "y": 0.8739299638991892
              },
              {
                "x": 1071.9274376417234,
                "y": 0.8687054641656178
              },
              {
                "x": 1072.7891156462586,
                "y": 0.8434201377658257
              },
              {
                "x": 1073.6507936507937,
                "y": 0.8193530518417568
              },
              {
                "x": 1074.5124716553287,
                "y": 0.8141519151548028
              },
              {
                "x": 1075.3741496598639,
                "y": 0.8091951332362641
              },
              {
                "x": 1076.235827664399,
                "y": 0.8014477328345381
              },
              {
                "x": 1077.0975056689342,
                "y": 0.8000762727451145
              },
              {
                "x": 1077.9591836734694,
                "y": 0.79657288646959
              },
              {
                "x": 1078.8208616780046,
                "y": 0.7980250786266097
              },
              {
                "x": 1079.6825396825398,
                "y": 0.8038543279309348
              },
              {
                "x": 1080.5442176870747,
                "y": 0.8088420021785752
              },
              {
                "x": 1081.4058956916099,
                "y": 0.8313029653757852
              },
              {
                "x": 1082.267573696145,
                "y": 0.8602205881042888
              },
              {
                "x": 1083.1292517006802,
                "y": 0.8737281594274087
              },
              {
                "x": 1083.9909297052154,
                "y": 0.8697993280042574
              },
              {
                "x": 1084.8526077097506,
                "y": 0.8659068431429977
              },
              {
                "x": 1085.7142857142858,
                "y": 0.8630854865139673
              },
              {
                "x": 1086.575963718821,
                "y": 0.8618785313962344
              },
              {
                "x": 1087.437641723356,
                "y": 0.859996536273085
              },
              {
                "x": 1088.299319727891,
                "y": 0.8617459337934346
              },
              {
                "x": 1089.1609977324263,
                "y": 0.871266450240197
              },
              {
                "x": 1090.0226757369614,
                "y": 0.8739711586680048
              },
              {
                "x": 1090.8843537414966,
                "y": 0.8760873924246271
              },
              {
                "x": 1091.7460317460318,
                "y": 0.9008853198452905
              },
              {
                "x": 1092.607709750567,
                "y": 0.8900611882259635
              },
              {
                "x": 1093.469387755102,
                "y": 0.8471499400158597
              },
              {
                "x": 1094.331065759637,
                "y": 0.806912914776951
              },
              {
                "x": 1095.1927437641723,
                "y": 0.7866301498750362
              },
              {
                "x": 1096.0544217687075,
                "y": 0.774758724185611
              },
              {
                "x": 1096.9160997732426,
                "y": 0.7701060216340356
              },
              {
                "x": 1097.7777777777778,
                "y": 0.7820752252069209
              },
              {
                "x": 1098.639455782313,
                "y": 0.804149479658911
              },
              {
                "x": 1099.501133786848,
                "y": 0.8351011007896649
              },
              {
                "x": 1100.3628117913831,
                "y": 0.8854031663519502
              },
              {
                "x": 1101.2244897959183,
                "y": 0.9451091151498141
              },
              {
                "x": 1102.0861678004535,
                "y": 0.9454687390358573
              },
              {
                "x": 1102.9478458049887,
                "y": 0.9117525606755666
              },
              {
                "x": 1103.8095238095239,
                "y": 0.8783532460441373
              },
              {
                "x": 1104.671201814059,
                "y": 0.8593136179314171
              },
              {
                "x": 1105.532879818594,
                "y": 0.8497914482974879
              },
              {
                "x": 1106.3945578231292,
                "y": 0.8422957520661927
              },
              {
                "x": 1107.2562358276643,
                "y": 0.8477028647386587
              },
              {
                "x": 1108.1179138321995,
                "y": 0.8663282281314689
              },
              {
                "x": 1108.9795918367347,
                "y": 0.8839269794252377
              },
              {
                "x": 1109.8412698412699,
                "y": 0.9070510762539691
              },
              {
                "x": 1110.702947845805,
                "y": 0.9534621945047168
              },
              {
                "x": 1111.5646258503402,
                "y": 0.9679528468534008
              },
              {
                "x": 1112.4263038548752,
                "y": 0.9142093659785663
              },
              {
                "x": 1113.2879818594104,
                "y": 0.847237486126933
              },
              {
                "x": 1114.1496598639455,
                "y": 0.7919922710159321
              },
              {
                "x": 1115.0113378684807,
                "y": 0.7600170529254253
              },
              {
                "x": 1115.873015873016,
                "y": 0.7429177782994121
              },
              {
                "x": 1116.734693877551,
                "y": 0.7398965830351544
              },
              {
                "x": 1117.5963718820863,
                "y": 0.7561112483437292
              },
              {
                "x": 1118.4580498866212,
                "y": 0.7905094306533039
              },
              {
                "x": 1119.3197278911564,
                "y": 0.8362585116868171
              },
              {
                "x": 1120.1814058956916,
                "y": 0.8961303081355859
              },
              {
                "x": 1121.0430839002267,
                "y": 0.9748438706055716
              },
              {
                "x": 1121.904761904762,
                "y": 0.9988860430846959
              },
              {
                "x": 1122.766439909297,
                "y": 0.9424601782331065
              },
              {
                "x": 1123.6281179138323,
                "y": 0.8885440699268363
              },
              {
                "x": 1124.4897959183672,
                "y": 0.8433475688452237
              },
              {
                "x": 1125.3514739229024,
                "y": 0.8147033515808649
              },
              {
                "x": 1126.2131519274376,
                "y": 0.7970062913279662
              },
              {
                "x": 1127.0748299319728,
                "y": 0.791203467321098
              },
              {
                "x": 1127.936507936508,
                "y": 0.8064958255053922
              },
              {
                "x": 1128.7981859410431,
                "y": 0.8328749964709166
              },
              {
                "x": 1129.6598639455783,
                "y": 0.8608677295055501
              },
              {
                "x": 1130.5215419501133,
                "y": 0.9056482355884566
              },
              {
                "x": 1131.3832199546484,
                "y": 0.9761016505215094
              },
              {
                "x": 1132.2448979591836,
                "y": 0.9831627726713805
              },
              {
                "x": 1133.1065759637188,
                "y": 0.931296406591259
              },
              {
                "x": 1133.968253968254,
                "y": 0.8512640397562562
              },
              {
                "x": 1134.8299319727892,
                "y": 0.7819759761581973
              },
              {
                "x": 1135.6916099773243,
                "y": 0.7262918869659915
              },
              {
                "x": 1136.5532879818593,
                "y": 0.6876327475031906
              },
              {
                "x": 1137.4149659863945,
                "y": 0.6691477594020266
              },
              {
                "x": 1138.2766439909296,
                "y": 0.6703898169084078
              },
              {
                "x": 1139.1383219954648,
                "y": 0.6932624579730698
              },
              {
                "x": 1140,
                "y": 0.7361168810864699
              },
              {
                "x": 1140.8616780045352,
                "y": 0.7915589839364343
              },
              {
                "x": 1141.7233560090704,
                "y": 0.8626850747315977
              },
              {
                "x": 1142.5850340136055,
                "y": 0.922180899585994
              },
              {
                "x": 1143.4467120181405,
                "y": 0.9217423338713073
              },
              {
                "x": 1144.3083900226757,
                "y": 0.8536155357518771
              },
              {
                "x": 1145.1700680272108,
                "y": 0.796217082902077
              },
              {
                "x": 1146.031746031746,
                "y": 0.7469328281444614
              },
              {
                "x": 1146.8934240362812,
                "y": 0.7108237341691482
              },
              {
                "x": 1147.7551020408164,
                "y": 0.6853897922390864
              },
              {
                "x": 1148.6167800453516,
                "y": 0.6729552121959096
              },
              {
                "x": 1149.4784580498865,
                "y": 0.6806597239544045
              },
              {
                "x": 1150.3401360544217,
                "y": 0.6999861843234138
              },
              {
                "x": 1151.2018140589569,
                "y": 0.7240050408674721
              },
              {
                "x": 1152.063492063492,
                "y": 0.7667064199647723
              },
              {
                "x": 1152.9251700680272,
                "y": 0.8354054606845025
              },
              {
                "x": 1153.7868480725624,
                "y": 0.8493873596726765
              },
              {
                "x": 1154.6485260770976,
                "y": 0.8169588213861637
              },
              {
                "x": 1155.5102040816325,
                "y": 0.7398127549891305
              },
              {
                "x": 1156.3718820861677,
                "y": 0.6685166428878964
              },
              {
                "x": 1157.233560090703,
                "y": 0.6096755229801925
              },
              {
                "x": 1158.095238095238,
                "y": 0.5642017318728798
              },
              {
                "x": 1158.9569160997733,
                "y": 0.536691635267817
              },
              {
                "x": 1159.8185941043084,
                "y": 0.5282243189665486
              },
              {
                "x": 1160.6802721088436,
                "y": 0.5370719539735219
              },
              {
                "x": 1161.5419501133786,
                "y": 0.5654187345996622
              },
              {
                "x": 1162.4036281179137,
                "y": 0.6107737489202033
              },
              {
                "x": 1163.265306122449,
                "y": 0.6662427695974803
              },
              {
                "x": 1164.126984126984,
                "y": 0.73451863027156
              },
              {
                "x": 1164.9886621315193,
                "y": 0.7710774682478423
              },
              {
                "x": 1165.8503401360545,
                "y": 0.762885060697495
              },
              {
                "x": 1166.7120181405896,
                "y": 0.7026612167567189
              },
              {
                "x": 1167.5736961451248,
                "y": 0.6486219181678863
              },
              {
                "x": 1168.4353741496598,
                "y": 0.6028633163181257
              },
              {
                "x": 1169.297052154195,
                "y": 0.5683588075199493
              },
              {
                "x": 1170.1587301587301,
                "y": 0.544204843612263
              },
              {
                "x": 1171.0204081632653,
                "y": 0.5320239549904119
              },
              {
                "x": 1171.8820861678005,
                "y": 0.5365525571499095
              },
              {
                "x": 1172.7437641723357,
                "y": 0.5524663423941467
              },
              {
                "x": 1173.6054421768708,
                "y": 0.5738094084372095
              },
              {
                "x": 1174.4671201814058,
                "y": 0.6097652185557977
              },
              {
                "x": 1175.328798185941,
                "y": 0.6678243980651303
              },
              {
                "x": 1176.1904761904761,
                "y": 0.688077981643832
              },
              {
                "x": 1177.0521541950113,
                "y": 0.6724470220325822
              },
              {
                "x": 1177.9138321995465,
                "y": 0.6232735329565688
              },
              {
                "x": 1178.7755102040817,
                "y": 0.5571969867246158
              },
              {
                "x": 1179.6371882086169,
                "y": 0.5013037051127991
              },
              {
                "x": 1180.4988662131518,
                "y": 0.4559270922873834
              },
              {
                "x": 1181.360544217687,
                "y": 0.42320746885635224
              },
              {
                "x": 1182.2222222222222,
                "y": 0.40677633881778036
              },
              {
                "x": 1183.0839002267574,
                "y": 0.4053795070165032
              },
              {
                "x": 1183.9455782312925,
                "y": 0.4181925470005394
              },
              {
                "x": 1184.8072562358277,
                "y": 0.44703124074900447
              },
              {
                "x": 1185.668934240363,
                "y": 0.48834326379165827
              },
              {
                "x": 1186.5306122448978,
                "y": 0.5373131710055435
              },
              {
                "x": 1187.392290249433,
                "y": 0.5821521296751105
              },
              {
                "x": 1188.2539682539682,
                "y": 0.6008262578064697
              },
              {
                "x": 1189.1156462585034,
                "y": 0.5869851238509579
              },
              {
                "x": 1189.9773242630386,
                "y": 0.5353483966037471
              },
              {
                "x": 1190.8390022675737,
                "y": 0.48997496380804967
              },
              {
                "x": 1191.700680272109,
                "y": 0.45189967994296454
              },
              {
                "x": 1192.562358276644,
                "y": 0.42249080365385544
              },
              {
                "x": 1193.424036281179,
                "y": 0.40163425003618164
              },
              {
                "x": 1194.2857142857142,
                "y": 0.39097890625685267
              },
              {
                "x": 1195.1473922902494,
                "y": 0.3930420624265403
              },
              {
                "x": 1196.0090702947846,
                "y": 0.40401689961587134
              },
              {
                "x": 1196.8707482993198,
                "y": 0.42028074081835265
              },
              {
                "x": 1197.732426303855,
                "y": 0.4480523622108756
              },
              {
                "x": 1198.5941043083901,
                "y": 0.49269098543249157
              },
              {
                "x": 1199.455782312925,
                "y": 0.5099359139853399
              },
              {
                "x": 1200.3174603174602,
                "y": 0.501725713258609
              },
              {
                "x": 1201.1791383219954,
                "y": 0.46997258758705535
              },
              {
                "x": 1202.0408163265306,
                "y": 0.4166676788512101
              },
              {
                "x": 1202.9024943310658,
                "y": 0.37030947972126954
              },
              {
                "x": 1203.764172335601,
                "y": 0.33187168317546795
              },
              {
                "x": 1204.6258503401361,
                "y": 0.3018718652830284
              },
              {
                "x": 1205.487528344671,
                "y": 0.28318714133547646
              },
              {
                "x": 1206.3492063492063,
                "y": 0.2763789611049773
              },
              {
                "x": 1207.2108843537414,
                "y": 0.2797895975844349
              },
              {
                "x": 1208.0725623582766,
                "y": 0.29420853758617815
              },
              {
                "x": 1208.9342403628118,
                "y": 0.31962706547320147
              },
              {
                "x": 1209.795918367347,
                "y": 0.352168268893411
              },
              {
                "x": 1210.6575963718822,
                "y": 0.39009543189951584
              },
              {
                "x": 1211.5192743764171,
                "y": 0.41027822608939724
              },
              {
                "x": 1212.3809523809523,
                "y": 0.41239211283418714
              },
              {
                "x": 1213.2426303854875,
                "y": 0.39199003578696234
              },
              {
                "x": 1214.1043083900227,
                "y": 0.3539138546609668
              },
              {
                "x": 1214.9659863945578,
                "y": 0.32167095301837373
              },
              {
                "x": 1215.827664399093,
                "y": 0.2946998489655057
              },
              {
                "x": 1216.6893424036282,
                "y": 0.27346539217985255
              },
              {
                "x": 1217.5510204081631,
                "y": 0.2583096146658842
              },
              {
                "x": 1218.4126984126983,
                "y": 0.25091653595923646
              },
              {
                "x": 1219.2743764172335,
                "y": 0.25157556660291935
              },
              {
                "x": 1220.1360544217687,
                "y": 0.25725178473974963
              },
              {
                "x": 1220.9977324263039,
                "y": 0.2675591840149102
              },
              {
                "x": 1221.859410430839,
                "y": 0.2871377382953664
              },
              {
                "x": 1222.7210884353742,
                "y": 0.31131221714224555
              },
              {
                "x": 1223.5827664399094,
                "y": 0.317759330160082
              },
              {
                "x": 1224.4444444444443,
                "y": 0.30939124149319563
              },
              {
                "x": 1225.3061224489795,
                "y": 0.2872956257001633
              },
              {
                "x": 1226.1678004535147,
                "y": 0.2530338265136136
              },
              {
                "x": 1227.0294784580499,
                "y": 0.22231554461398817
              },
              {
                "x": 1227.891156462585,
                "y": 0.19623724514706478
              },
              {
                "x": 1228.7528344671202,
                "y": 0.17512351385326305
              },
              {
                "x": 1229.6145124716554,
                "y": 0.16056202714564166
              },
              {
                "x": 1230.4761904761904,
                "y": 0.15295631687613206
              },
              {
                "x": 1231.3378684807255,
                "y": 0.15135910679822087
              },
              {
                "x": 1232.1995464852607,
                "y": 0.15598971403219786
              },
              {
                "x": 1233.061224489796,
                "y": 0.16701482352972216
              },
              {
                "x": 1233.922902494331,
                "y": 0.18264508556879647
              },
              {
                "x": 1234.7845804988663,
                "y": 0.201634972984352
              },
              {
                "x": 1235.6462585034014,
                "y": 0.2112483334502842
              },
              {
                "x": 1236.5079365079364,
                "y": 0.21177461230790823
              },
              {
                "x": 1237.3696145124716,
                "y": 0.20211739527050737
              },
              {
                "x": 1238.2312925170068,
                "y": 0.18140832222300188
              },
              {
                "x": 1239.092970521542,
                "y": 0.16158529539525188
              },
              {
                "x": 1239.954648526077,
                "y": 0.14407800100667964
              },
              {
                "x": 1240.8163265306123,
                "y": 0.12892149540509906
              },
              {
                "x": 1241.6780045351475,
                "y": 0.11629995745312967
              },
              {
                "x": 1242.5396825396824,
                "y": 0.10697646258496527
              },
              {
                "x": 1243.4013605442176,
                "y": 0.10138955295951683
              },
              {
                "x": 1244.2630385487528,
                "y": 0.09844279715859441
              },
              {
                "x": 1245.124716553288,
                "y": 0.09753095415230592
              },
              {
                "x": 1245.9863945578231,
                "y": 0.10034687046786876
              },
              {
                "x": 1246.8480725623583,
                "y": 0.10823254969720464
              },
              {
                "x": 1247.7097505668935,
                "y": 0.11031141435712709
              },
              {
                "x": 1248.5714285714287,
                "y": 0.10686418237405763
              },
              {
                "x": 1249.4331065759636,
                "y": 0.09896098674870267
              },
              {
                "x": 1250.2947845804988,
                "y": 0.08748775806337329
              },
              {
                "x": 1251.156462585034,
                "y": 0.07419880468229204
              },
              {
                "x": 1252.0181405895692,
                "y": 0.061716806862648896
              },
              {
                "x": 1252.8798185941043,
                "y": 0.050085638307385785
              },
              {
                "x": 1253.7414965986395,
                "y": 0.039743885074813835
              },
              {
                "x": 1254.6031746031747,
                "y": 0.030665250353525082
              },
              {
                "x": 1255.4648526077096,
                "y": 0.0227269432384268
              },
              {
                "x": 1256.3265306122448,
                "y": 0.016306134527017842
              },
              {
                "x": 1257.18820861678,
                "y": 0.011744907618187979
              },
              {
                "x": 1258.0498866213152,
                "y": 0.009069572707308644
              },
              {
                "x": 1258.9115646258504,
                "y": 0.008008209950178934
              },
              {
                "x": 1259.7732426303855,
                "y": 0.007806469721423058
              },
              {
                "x": 1260.6349206349207,
                "y": 0.006639884920356467
              },
              {
                "x": 1261.4965986394557,
                "y": 0.00497333520454705
              },
              {
                "x": 1262.3582766439908,
                "y": 0.0030611886885130867
              },
              {
                "x": 1263.219954648526,
                "y": 0.001517437372815943
              },
              {
                "x": 1264.0816326530612,
                "y": 0.0006841625149112343
              },
              {
                "x": 1264.9433106575964,
                "y": 0.00032453862886814964
              },
              {
                "x": 1265.8049886621316,
                "y": 0.00017542628587467548
              },
              {
                "x": 1266.6666666666667,
                "y": 0.00009648445723107152
              },
              {
                "x": 1267.5283446712017,
                "y": 0.00005262788576240264
              },
              {
                "x": 1268.3900226757369,
                "y": 0.00002631394288120132
              },
              {
                "x": 1269.251700680272,
                "y": 0.000008771314293733774
              },
              {
                "x": 1270.1133786848072,
                "y": 0
              },
              {
                "x": 1270.9750566893424,
                "y": 0
              },
              {
                "x": 1271.8367346938776,
                "y": 0
              },
              {
                "x": 1272.6984126984128,
                "y": 0
              },
              {
                "x": 1273.5600907029477,
                "y": 0
              },
              {
                "x": 1274.421768707483,
                "y": 0
              },
              {
                "x": 1275.283446712018,
                "y": 0
              },
              {
                "x": 1276.1451247165533,
                "y": 0
              },
              {
                "x": 1277.0068027210884,
                "y": 0
              },
              {
                "x": 1277.8684807256236,
                "y": 0
              },
              {
                "x": 1278.7301587301588,
                "y": 0
              },
              {
                "x": 1279.591836734694,
                "y": 0
              },
              {
                "x": 1280.453514739229,
                "y": 0
              },
              {
                "x": 1281.315192743764,
                "y": 0
              },
              {
                "x": 1282.1768707482993,
                "y": 0
              },
              {
                "x": 1283.0385487528345,
                "y": 0
              },
              {
                "x": 1283.9002267573696,
                "y": 0
              },
              {
                "x": 1284.7619047619048,
                "y": 0
              },
              {
                "x": 1285.62358276644,
                "y": 0
              },
              {
                "x": 1286.485260770975,
                "y": 0
              },
              {
                "x": 1287.3469387755101,
                "y": 0
              },
              {
                "x": 1288.2086167800453,
                "y": 0
              },
              {
                "x": 1289.0702947845805,
                "y": 0
              },
              {
                "x": 1289.9319727891157,
                "y": 0
              },
              {
                "x": 1290.7936507936508,
                "y": 0
              },
              {
                "x": 1291.655328798186,
                "y": 0
              },
              {
                "x": 1292.517006802721,
                "y": 0
              },
              {
                "x": 1293.3786848072561,
                "y": 0
              },
              {
                "x": 1294.2403628117913,
                "y": 0
              },
              {
                "x": 1295.1020408163265,
                "y": 0
              },
              {
                "x": 1295.9637188208617,
                "y": 0
              },
              {
                "x": 1296.8253968253969,
                "y": 0
              },
              {
                "x": 1297.687074829932,
                "y": 0
              },
              {
                "x": 1298.548752834467,
                "y": 0
              },
              {
                "x": 1299.4104308390022,
                "y": 0
              },
              {
                "x": 1300.2721088435374,
                "y": 0
              },
              {
                "x": 1301.1337868480725,
                "y": 0
              },
              {
                "x": 1301.9954648526077,
                "y": 0
              },
              {
                "x": 1302.857142857143,
                "y": 0
              },
              {
                "x": 1303.718820861678,
                "y": 0
              },
              {
                "x": 1304.5804988662132,
                "y": 0
              },
              {
                "x": 1305.4421768707482,
                "y": 0
              },
              {
                "x": 1306.3038548752834,
                "y": 0
              },
              {
                "x": 1307.1655328798186,
                "y": 0
              },
              {
                "x": 1308.0272108843537,
                "y": 0
              },
              {
                "x": 1308.888888888889,
                "y": 0
              },
              {
                "x": 1309.750566893424,
                "y": 0
              },
              {
                "x": 1310.6122448979593,
                "y": 0
              },
              {
                "x": 1311.4739229024942,
                "y": 0
              },
              {
                "x": 1312.3356009070294,
                "y": 0
              },
              {
                "x": 1313.1972789115646,
                "y": 0
              },
              {
                "x": 1314.0589569160998,
                "y": 0
              },
              {
                "x": 1314.920634920635,
                "y": 0
              },
              {
                "x": 1315.7823129251701,
                "y": 0
              },
              {
                "x": 1316.6439909297053,
                "y": 0
              },
              {
                "x": 1317.5056689342402,
                "y": 0
              },
              {
                "x": 1318.3673469387754,
                "y": 0
              },
              {
                "x": 1319.2290249433106,
                "y": 0
              },
              {
                "x": 1320.0907029478458,
                "y": 0
              },
              {
                "x": 1320.952380952381,
                "y": 0
              },
              {
                "x": 1321.8140589569161,
                "y": 0
              },
              {
                "x": 1322.6757369614513,
                "y": 0
              },
              {
                "x": 1323.5374149659863,
                "y": 0
              },
              {
                "x": 1324.3990929705215,
                "y": 0
              },
              {
                "x": 1325.2607709750566,
                "y": 0
              },
              {
                "x": 1326.1224489795918,
                "y": 0
              },
              {
                "x": 1326.984126984127,
                "y": 0
              },
              {
                "x": 1327.8458049886622,
                "y": 0
              },
              {
                "x": 1328.7074829931973,
                "y": 0
              },
              {
                "x": 1329.5691609977325,
                "y": 0
              },
              {
                "x": 1330.4308390022675,
                "y": 0
              },
              {
                "x": 1331.2925170068027,
                "y": 0
              },
              {
                "x": 1332.1541950113378,
                "y": 0
              },
              {
                "x": 1333.015873015873,
                "y": 0
              },
              {
                "x": 1333.8775510204082,
                "y": 0
              },
              {
                "x": 1334.7392290249434,
                "y": 0
              },
              {
                "x": 1335.6009070294785,
                "y": 0
              },
              {
                "x": 1336.4625850340135,
                "y": 0
              },
              {
                "x": 1337.3242630385487,
                "y": 0
              },
              {
                "x": 1338.1859410430839,
                "y": 0
              },
              {
                "x": 1339.047619047619,
                "y": 0
              },
              {
                "x": 1339.9092970521542,
                "y": 0
              },
              {
                "x": 1340.7709750566894,
                "y": 0
              },
              {
                "x": 1341.6326530612246,
                "y": 0
              },
              {
                "x": 1342.4943310657595,
                "y": 0
              },
              {
                "x": 1343.3560090702947,
                "y": 0
              },
              {
                "x": 1344.2176870748299,
                "y": 0
              },
              {
                "x": 1345.079365079365,
                "y": 0
              },
              {
                "x": 1345.9410430839002,
                "y": 0
              },
              {
                "x": 1346.8027210884354,
                "y": 0
              },
              {
                "x": 1347.6643990929706,
                "y": 0
              },
              {
                "x": 1348.5260770975055,
                "y": 0
              },
              {
                "x": 1349.3877551020407,
                "y": 0
              },
              {
                "x": 1350.249433106576,
                "y": 0
              },
              {
                "x": 1351.111111111111,
                "y": 0
              },
              {
                "x": 1351.9727891156463,
                "y": 0
              },
              {
                "x": 1352.8344671201814,
                "y": 0
              },
              {
                "x": 1353.6961451247166,
                "y": 0
              },
              {
                "x": 1354.5578231292516,
                "y": 0
              },
              {
                "x": 1355.4195011337868,
                "y": 0
              },
              {
                "x": 1356.281179138322,
                "y": 0
              },
              {
                "x": 1357.142857142857,
                "y": 0
              },
              {
                "x": 1358.0045351473923,
                "y": 0
              },
              {
                "x": 1358.8662131519275,
                "y": 0
              },
              {
                "x": 1359.7278911564626,
                "y": 0
              },
              {
                "x": 1360.5895691609978,
                "y": 0
              },
              {
                "x": 1361.4512471655328,
                "y": 0
              },
              {
                "x": 1362.312925170068,
                "y": 0
              },
              {
                "x": 1363.1746031746031,
                "y": 0
              },
              {
                "x": 1364.0362811791383,
                "y": 0
              },
              {
                "x": 1364.8979591836735,
                "y": 0
              },
              {
                "x": 1365.7596371882087,
                "y": 0
              },
              {
                "x": 1366.6213151927439,
                "y": 0
              },
              {
                "x": 1367.4829931972788,
                "y": 0
              },
              {
                "x": 1368.344671201814,
                "y": 0
              },
              {
                "x": 1369.2063492063492,
                "y": 0
              },
              {
                "x": 1370.0680272108843,
                "y": 0
              },
              {
                "x": 1370.9297052154195,
                "y": 0
              },
              {
                "x": 1371.7913832199547,
                "y": 0
              },
              {
                "x": 1372.6530612244899,
                "y": 0
              },
              {
                "x": 1373.5147392290248,
                "y": 0
              },
              {
                "x": 1374.37641723356,
                "y": 0
              },
              {
                "x": 1375.2380952380952,
                "y": 0
              },
              {
                "x": 1376.0997732426304,
                "y": 0
              },
              {
                "x": 1376.9614512471655,
                "y": 0
              },
              {
                "x": 1377.8231292517007,
                "y": 0
              },
              {
                "x": 1378.684807256236,
                "y": 0
              },
              {
                "x": 1379.5464852607709,
                "y": 0
              },
              {
                "x": 1380.408163265306,
                "y": 0
              },
              {
                "x": 1381.2698412698412,
                "y": 0
              },
              {
                "x": 1382.1315192743764,
                "y": 0
              },
              {
                "x": 1382.9931972789116,
                "y": 0
              },
              {
                "x": 1383.8548752834467,
                "y": 0
              },
              {
                "x": 1384.716553287982,
                "y": 0
              },
              {
                "x": 1385.578231292517,
                "y": 0
              },
              {
                "x": 1386.439909297052,
                "y": 0
              },
              {
                "x": 1387.3015873015872,
                "y": 0
              },
              {
                "x": 1388.1632653061224,
                "y": 0
              },
              {
                "x": 1389.0249433106576,
                "y": 0
              },
              {
                "x": 1389.8866213151928,
                "y": 0
              },
              {
                "x": 1390.748299319728,
                "y": 0
              },
              {
                "x": 1391.6099773242631,
                "y": 0
              },
              {
                "x": 1392.471655328798,
                "y": 0
              },
              {
                "x": 1393.3333333333333,
                "y": 0
              },
              {
                "x": 1394.1950113378684,
                "y": 0
              },
              {
                "x": 1395.0566893424036,
                "y": 0
              },
              {
                "x": 1395.9183673469388,
                "y": 0
              },
              {
                "x": 1396.780045351474,
                "y": 0
              },
              {
                "x": 1397.6417233560092,
                "y": 0
              },
              {
                "x": 1398.503401360544,
                "y": 0
              },
              {
                "x": 1399.3650793650793,
                "y": 0
              },
              {
                "x": 1400.2267573696145,
                "y": 0
              },
              {
                "x": 1401.0884353741496,
                "y": 0
              },
              {
                "x": 1401.9501133786848,
                "y": 0
              },
              {
                "x": 1402.81179138322,
                "y": 0
              },
              {
                "x": 1403.6734693877552,
                "y": 0
              },
              {
                "x": 1404.5351473922901,
                "y": 0
              },
              {
                "x": 1405.3968253968253,
                "y": 0
              },
              {
                "x": 1406.2585034013605,
                "y": 0
              },
              {
                "x": 1407.1201814058957,
                "y": 0
              },
              {
                "x": 1407.9818594104308,
                "y": 0
              },
              {
                "x": 1408.843537414966,
                "y": 0
              },
              {
                "x": 1409.7052154195012,
                "y": 0
              },
              {
                "x": 1410.5668934240362,
                "y": 0
              },
              {
                "x": 1411.4285714285713,
                "y": 0
              },
              {
                "x": 1412.2902494331065,
                "y": 0
              },
              {
                "x": 1413.1519274376417,
                "y": 0
              },
              {
                "x": 1414.0136054421769,
                "y": 0
              },
              {
                "x": 1414.875283446712,
                "y": 0
              },
              {
                "x": 1415.7369614512472,
                "y": 0
              },
              {
                "x": 1416.5986394557824,
                "y": 0
              },
              {
                "x": 1417.4603174603174,
                "y": 0
              },
              {
                "x": 1418.3219954648525,
                "y": 0
              },
              {
                "x": 1419.1836734693877,
                "y": 0
              },
              {
                "x": 1420.045351473923,
                "y": 0
              },
              {
                "x": 1420.907029478458,
                "y": 0
              },
              {
                "x": 1421.7687074829932,
                "y": 0
              },
              {
                "x": 1422.6303854875284,
                "y": 0
              },
              {
                "x": 1423.4920634920634,
                "y": 0
              },
              {
                "x": 1424.3537414965986,
                "y": 0
              },
              {
                "x": 1425.2154195011337,
                "y": 0
              },
              {
                "x": 1426.077097505669,
                "y": 0
              },
              {
                "x": 1426.938775510204,
                "y": 0
              },
              {
                "x": 1427.8004535147393,
                "y": 0
              },
              {
                "x": 1428.6621315192745,
                "y": 0
              },
              {
                "x": 1429.5238095238094,
                "y": 0
              },
              {
                "x": 1430.3854875283446,
                "y": 0
              },
              {
                "x": 1431.2471655328798,
                "y": 0
              },
              {
                "x": 1432.108843537415,
                "y": 0
              },
              {
                "x": 1432.9705215419501,
                "y": 0
              },
              {
                "x": 1433.8321995464853,
                "y": 0
              },
              {
                "x": 1434.6938775510205,
                "y": 0
              },
              {
                "x": 1435.5555555555554,
                "y": 0
              },
              {
                "x": 1436.4172335600906,
                "y": 0
              },
              {
                "x": 1437.2789115646258,
                "y": 0
              },
              {
                "x": 1438.140589569161,
                "y": 0
              },
              {
                "x": 1439.0022675736961,
                "y": 0
              },
              {
                "x": 1439.8639455782313,
                "y": 0
              },
              {
                "x": 1440.7256235827665,
                "y": 0
              },
              {
                "x": 1441.5873015873017,
                "y": 0
              },
              {
                "x": 1442.4489795918366,
                "y": 0
              },
              {
                "x": 1443.3106575963718,
                "y": 0
              },
              {
                "x": 1444.172335600907,
                "y": 0
              },
              {
                "x": 1445.0340136054422,
                "y": 0
              },
              {
                "x": 1445.8956916099773,
                "y": 0
              },
              {
                "x": 1446.7573696145125,
                "y": 0
              },
              {
                "x": 1447.6190476190477,
                "y": 0
              },
              {
                "x": 1448.4807256235827,
                "y": 0
              },
              {
                "x": 1449.3424036281178,
                "y": 0
              },
              {
                "x": 1450.204081632653,
                "y": 0
              },
              {
                "x": 1451.0657596371882,
                "y": 0
              },
              {
                "x": 1451.9274376417234,
                "y": 0
              },
              {
                "x": 1452.7891156462586,
                "y": 0
              },
              {
                "x": 1453.6507936507937,
                "y": 0
              },
              {
                "x": 1454.5124716553287,
                "y": 0
              },
              {
                "x": 1455.3741496598639,
                "y": 0
              },
              {
                "x": 1456.235827664399,
                "y": 0
              },
              {
                "x": 1457.0975056689342,
                "y": 0
              },
              {
                "x": 1457.9591836734694,
                "y": 0
              },
              {
                "x": 1458.8208616780046,
                "y": 0
              },
              {
                "x": 1459.6825396825398,
                "y": 0
              },
              {
                "x": 1460.5442176870747,
                "y": 0
              },
              {
                "x": 1461.4058956916099,
                "y": 0
              },
              {
                "x": 1462.267573696145,
                "y": 0
              },
              {
                "x": 1463.1292517006802,
                "y": 0
              },
              {
                "x": 1463.9909297052154,
                "y": 0
              },
              {
                "x": 1464.8526077097506,
                "y": 0
              },
              {
                "x": 1465.7142857142858,
                "y": 0
              },
              {
                "x": 1466.5759637188207,
                "y": 0
              },
              {
                "x": 1467.437641723356,
                "y": 0
              },
              {
                "x": 1468.299319727891,
                "y": 0
              },
              {
                "x": 1469.1609977324263,
                "y": 0
              },
              {
                "x": 1470.0226757369614,
                "y": 0
              },
              {
                "x": 1470.8843537414966,
                "y": 0
              },
              {
                "x": 1471.7460317460318,
                "y": 0
              },
              {
                "x": 1472.607709750567,
                "y": 0
              },
              {
                "x": 1473.469387755102,
                "y": 0
              },
              {
                "x": 1474.331065759637,
                "y": 0
              },
              {
                "x": 1475.1927437641723,
                "y": 0
              },
              {
                "x": 1476.0544217687075,
                "y": 0
              },
              {
                "x": 1476.9160997732426,
                "y": 0
              },
              {
                "x": 1477.7777777777778,
                "y": 0
              },
              {
                "x": 1478.639455782313,
                "y": 0
              },
              {
                "x": 1479.501133786848,
                "y": 0
              },
              {
                "x": 1480.3628117913831,
                "y": 0
              },
              {
                "x": 1481.2244897959183,
                "y": 0
              },
              {
                "x": 1482.0861678004535,
                "y": 0
              },
              {
                "x": 1482.9478458049887,
                "y": 0
              },
              {
                "x": 1483.8095238095239,
                "y": 0
              },
              {
                "x": 1484.671201814059,
                "y": 0
              },
              {
                "x": 1485.532879818594,
                "y": 0
              },
              {
                "x": 1486.3945578231292,
                "y": 0
              },
              {
                "x": 1487.2562358276643,
                "y": 0
              },
              {
                "x": 1488.1179138321995,
                "y": 0
              },
              {
                "x": 1488.9795918367347,
                "y": 0
              },
              {
                "x": 1489.8412698412699,
                "y": 0
              },
              {
                "x": 1490.702947845805,
                "y": 0
              },
              {
                "x": 1491.56462585034,
                "y": 0
              },
              {
                "x": 1492.4263038548752,
                "y": 0
              },
              {
                "x": 1493.2879818594104,
                "y": 0
              },
              {
                "x": 1494.1496598639455,
                "y": 0
              },
              {
                "x": 1495.0113378684807,
                "y": 0
              },
              {
                "x": 1495.873015873016,
                "y": 0
              },
              {
                "x": 1496.734693877551,
                "y": 0.05148761490421725
              },
              {
                "x": 1497.5963718820863,
                "y": 0.10101045540663812
              },
              {
                "x": 1498.4580498866212,
                "y": 0.13813942881201322
              },
              {
                "x": 1499.3197278911564,
                "y": 0.16986527261244824
              },
              {
                "x": 1500.1814058956916,
                "y": 0.1934432849558803
              },
              {
                "x": 1501.0430839002267,
                "y": 0.2597895062736826
              },
              {
                "x": 1501.904761904762,
                "y": 0.27289384982852083
              },
              {
                "x": 1502.766439909297,
                "y": 0.3205045438149077
              },
              {
                "x": 1503.6281179138323,
                "y": 0.39378010342475966
              },
              {
                "x": 1504.4897959183672,
                "y": 0.4518637466778647
              },
              {
                "x": 1505.3514739229024,
                "y": 0.41718248283392123
              },
              {
                "x": 1506.2131519274376,
                "y": 0.4211295742661014
              },
              {
                "x": 1507.0748299319728,
                "y": 0.45707442024182243
              },
              {
                "x": 1507.936507936508,
                "y": 0.42736597872894616
              },
              {
                "x": 1508.7981859410431,
                "y": 0.4766535013150804
              },
              {
                "x": 1509.6598639455783,
                "y": 0.4384289723380843
              },
              {
                "x": 1510.5215419501133,
                "y": 0.5161428169805655
              },
              {
                "x": 1511.3832199546484,
                "y": 0.5629026934804603
              },
              {
                "x": 1512.2448979591836,
                "y": 0.5129595408480793
              },
              {
                "x": 1513.1065759637188,
                "y": 0.5749325424685796
              },
              {
                "x": 1513.968253968254,
                "y": 0.6832352674983609
              },
              {
                "x": 1514.8299319727892,
                "y": 0.632694954537867
              },
              {
                "x": 1515.6916099773243,
                "y": 0.6829282714980802
              },
              {
                "x": 1516.5532879818593,
                "y": 0.784903571477029
              },
              {
                "x": 1517.4149659863945,
                "y": 0.7549473060724082
              },
              {
                "x": 1518.2766439909296,
                "y": 0.774385131724583
              },
              {
                "x": 1519.1383219954648,
                "y": 0.7963519461422115
              },
              {
                "x": 1520,
                "y": 0.8078017405782381
              },
              {
                "x": 1520.8616780045352,
                "y": 0.8326691746686636
              },
              {
                "x": 1521.7233560090704,
                "y": 0.739207154733659
              },
              {
                "x": 1522.5850340136055,
                "y": 0.6945310307171427
              },
              {
                "x": 1523.4467120181405,
                "y": 0.7688065201564802
              },
              {
                "x": 1524.3083900226757,
                "y": 0.7286777572626483
              },
              {
                "x": 1525.1700680272108,
                "y": 0.698372866377798
              },
              {
                "x": 1526.031746031746,
                "y": 0.6565512730175048
              },
              {
                "x": 1526.8934240362812,
                "y": 0.6481568682663031
              },
              {
                "x": 1527.7551020408164,
                "y": 0.6179475367391297
              },
              {
                "x": 1528.6167800453516,
                "y": 0.6346661757271831
              },
              {
                "x": 1529.4784580498865,
                "y": 0.6949708074128433
              },
              {
                "x": 1530.3401360544217,
                "y": 0.7369524119452555
              },
              {
                "x": 1531.2018140589569,
                "y": 0.6602473822102431
              },
              {
                "x": 1532.063492063492,
                "y": 0.6291969296104255
              },
              {
                "x": 1532.9251700680272,
                "y": 0.6595018204952757
              },
              {
                "x": 1533.7868480725624,
                "y": 0.6896225137799575
              },
              {
                "x": 1534.6485260770976,
                "y": 0.7929573342822057
              },
              {
                "x": 1535.5102040816325,
                "y": 0.8502503643286169
              },
              {
                "x": 1536.3718820861677,
                "y": 0.8020933305294536
              },
              {
                "x": 1537.233560090703,
                "y": 0.7029744510223687
              },
              {
                "x": 1538.095238095238,
                "y": 0.6696073521263481
              },
              {
                "x": 1538.9569160997733,
                "y": 0.7009131279203166
              },
              {
                "x": 1539.8185941043084,
                "y": 0.8097596880879523
              },
              {
                "x": 1540.6802721088436,
                "y": 0.8849949511835246
              },
              {
                "x": 1541.5419501133786,
                "y": 0.8643764265377759
              },
              {
                "x": 1542.4036281179137,
                "y": 0.8199427599790147
              },
              {
                "x": 1543.265306122449,
                "y": 0.7340458444390965
              },
              {
                "x": 1544.126984126984,
                "y": 0.6636999038033516
              },
              {
                "x": 1544.9886621315193,
                "y": 0.7028989073820477
              },
              {
                "x": 1545.8503401360545,
                "y": 0.7815681100435387
              },
              {
                "x": 1546.7120181405896,
                "y": 0.8281414933258521
              },
              {
                "x": 1547.5736961451246,
                "y": 0.8416462679359672
              },
              {
                "x": 1548.4353741496598,
                "y": 0.8394149192449764
              },
              {
                "x": 1549.297052154195,
                "y": 0.8013524861262478
              },
              {
                "x": 1550.1587301587301,
                "y": 0.7340999841773713
              },
              {
                "x": 1551.0204081632653,
                "y": 0.7009872619616059
              },
              {
                "x": 1551.8820861678005,
                "y": 0.7575113329834858
              },
              {
                "x": 1552.7437641723357,
                "y": 0.8330617637920694
              },
              {
                "x": 1553.6054421768708,
                "y": 0.8790621849522073
              },
              {
                "x": 1554.4671201814058,
                "y": 0.8989504805515294
              },
              {
                "x": 1555.328798185941,
                "y": 0.8891124836428694
              },
              {
                "x": 1556.1904761904761,
                "y": 0.8626433124827315
              },
              {
                "x": 1557.0521541950113,
                "y": 0.8064032984184772
              },
              {
                "x": 1557.9138321995465,
                "y": 0.7364437035548629
              },
              {
                "x": 1558.7755102040817,
                "y": 0.736873497955256
              },
              {
                "x": 1559.6371882086169,
                "y": 0.7816502565283933
              },
              {
                "x": 1560.4988662131518,
                "y": 0.8065497307566273
              },
              {
                "x": 1561.360544217687,
                "y": 0.8225893638032118
              },
              {
                "x": 1562.2222222222222,
                "y": 0.8295413670343447
              },
              {
                "x": 1563.0839002267574,
                "y": 0.8209417529310581
              },
              {
                "x": 1563.9455782312925,
                "y": 0.814605446282073
              },
              {
                "x": 1564.8072562358277,
                "y": 0.8103487034712614
              },
              {
                "x": 1565.668934240363,
                "y": 0.7841383631744182
              },
              {
                "x": 1566.5306122448978,
                "y": 0.7908486231160862
              },
              {
                "x": 1567.392290249433,
                "y": 0.8306109994748176
              },
              {
                "x": 1568.2539682539682,
                "y": 0.857155977403998
              },
              {
                "x": 1569.1156462585034,
                "y": 0.8724391274214309
              },
              {
                "x": 1569.9773242630386,
                "y": 0.8804424035073196
              },
              {
                "x": 1570.8390022675737,
                "y": 0.8766744901536515
              },
              {
                "x": 1571.700680272109,
                "y": 0.8734763267709285
              },
              {
                "x": 1572.5623582766439,
                "y": 0.8536294550738764
              },
              {
                "x": 1573.424036281179,
                "y": 0.8256067719411687
              },
              {
                "x": 1574.2857142857142,
                "y": 0.8164062328685268
              },
              {
                "x": 1575.1473922902494,
                "y": 0.8137040556158889
              },
              {
                "x": 1576.0090702947846,
                "y": 0.8057903214577048
              },
              {
                "x": 1576.8707482993198,
                "y": 0.8027963224071996
              },
              {
                "x": 1577.732426303855,
                "y": 0.7999070394868123
              },
              {
                "x": 1578.5941043083901,
                "y": 0.7989822140359669
              },
              {
                "x": 1579.455782312925,
                "y": 0.8050482117345933
              },
              {
                "x": 1580.3174603174602,
                "y": 0.8088691384321716
              },
              {
                "x": 1581.1791383219954,
                "y": 0.8258039337837039
              },
              {
                "x": 1582.0408163265306,
                "y": 0.856089616004195
              },
              {
                "x": 1582.9024943310658,
                "y": 0.8738772717704021
              },
              {
                "x": 1583.764172335601,
                "y": 0.8709568652460246
              },
              {
                "x": 1584.6258503401361,
                "y": 0.8671693106582983
              },
              {
                "x": 1585.487528344671,
                "y": 0.8637161966909669
              },
              {
                "x": 1586.3492063492063,
                "y": 0.8623073985556388
              },
              {
                "x": 1587.2108843537414,
                "y": 0.8606796944553783
              },
              {
                "x": 1588.0725623582766,
                "y": 0.8604731060196983
              },
              {
                "x": 1588.9342403628118,
                "y": 0.8688622171456718
              },
              {
                "x": 1589.795918367347,
                "y": 0.8744879359822886
              },
              {
                "x": 1590.6575963718822,
                "y": 0.8740256346114418
              },
              {
                "x": 1591.5192743764171,
                "y": 0.8922628673467542
              },
              {
                "x": 1592.3809523809523,
                "y": 0.8999818594829969
              },
              {
                "x": 1593.2426303854875,
                "y": 0.8605794624883781
              },
              {
                "x": 1594.1043083900227,
                "y": 0.8175796959560953
              },
              {
                "x": 1594.9659863945578,
                "y": 0.792446497038585
              },
              {
                "x": 1595.827664399093,
                "y": 0.7798909859258781
              },
              {
                "x": 1596.6893424036282,
                "y": 0.7721332209828478
              },
              {
                "x": 1597.5510204081631,
                "y": 0.779725444500057
              },
              {
                "x": 1598.4126984126983,
                "y": 0.8000803586014797
              },
              {
                "x": 1599.2743764172335,
                "y": 0.8276284785113766
              },
              {
                "x": 1600.1360544217687,
                "y": 0.8725710226338285
              },
              {
                "x": 1600.9977324263039,
                "y": 0.9321889691951444
              },
              {
                "x": 1601.859410430839,
                "y": 0.9540207704722476
              },
              {
                "x": 1602.7210884353742,
                "y": 0.9201200754380998
              },
              {
                "x": 1603.5827664399092,
                "y": 0.885071453918667
              },
              {
                "x": 1604.4444444444443,
                "y": 0.86132138162385
              },
              {
                "x": 1605.3061224489795,
                "y": 0.8511938970805504
              },
              {
                "x": 1606.1678004535147,
                "y": 0.8425490815851465
              },
              {
                "x": 1607.0294784580499,
                "y": 0.8435091122134796
              },
              {
                "x": 1607.891156462585,
                "y": 0.86002942013595
              },
              {
                "x": 1608.7528344671202,
                "y": 0.8785492707851368
              },
              {
                "x": 1609.6145124716554,
                "y": 0.8981562504625498
              },
              {
                "x": 1610.4761904761904,
                "y": 0.9378400062077606
              },
              {
                "x": 1611.3378684807255,
                "y": 0.9706544930303684
              },
              {
                "x": 1612.1995464852607,
                "y": 0.9357699096499807
              },
              {
                "x": 1613.061224489796,
                "y": 0.8677194065465801
              },
              {
                "x": 1613.922902494331,
                "y": 0.8065887337675866
              },
              {
                "x": 1614.7845804988663,
                "y": 0.7690087229350133
              },
              {
                "x": 1615.6462585034014,
                "y": 0.7488570566319908
              },
              {
                "x": 1616.5079365079364,
                "y": 0.7416255705465845
              },
              {
                "x": 1617.3696145124716,
                "y": 0.7524720801528183
              },
              {
                "x": 1618.2312925170068,
                "y": 0.7827300222352818
              },
              {
                "x": 1619.092970521542,
                "y": 0.8258299307943303
              },
              {
                "x": 1619.954648526077,
                "y": 0.881052690826795
              },
              {
                "x": 1620.8163265306123,
                "y": 0.9555031225878886
              },
              {
                "x": 1621.6780045351475,
                "y": 1
              },
              {
                "x": 1622.5396825396824,
                "y": 0.965441021682689
              },
              {
                "x": 1623.4013605442176,
                "y": 0.9105510169619403
              },
              {
                "x": 1624.2630385487528,
                "y": 0.86168787094779
              },
              {
                "x": 1625.124716553288,
                "y": 0.8287718266104407
              },
              {
                "x": 1625.9863945578231,
                "y": 0.8088642752352083
              },
              {
                "x": 1626.8480725623583,
                "y": 0.7988336006471312
              },
              {
                "x": 1627.7097505668935,
                "y": 0.8085824710663122
              },
              {
                "x": 1628.5714285714284,
                "y": 0.8338214311338076
              },
              {
                "x": 1629.4331065759636,
                "y": 0.8607003186077128
              },
              {
                "x": 1630.2947845804988,
                "y": 0.8991744124624205
              },
              {
                "x": 1631.156462585034,
                "y": 0.9635933687390634
              },
              {
                "x": 1632.0181405895692,
                "y": 0.9871012084267115
              },
              {
                "x": 1632.8798185941043,
                "y": 0.9506552882733559
              },
              {
                "x": 1633.7414965986395,
                "y": 0.8688074563914923
              },
              {
                "x": 1634.6031746031747,
                "y": 0.7962653551107709
              },
              {
                "x": 1635.4648526077096,
                "y": 0.7367921352353015
              },
              {
                "x": 1636.3265306122448,
                "y": 0.693185991642308
              },
              {
                "x": 1637.18820861678,
                "y": 0.6693767558046914
              },
              {
                "x": 1638.0498866213152,
                "y": 0.6654085412660187
              },
              {
                "x": 1638.9115646258504,
                "y": 0.6823603824334148
              },
              {
                "x": 1639.7732426303855,
                "y": 0.7206973731078631
              },
              {
                "x": 1640.6349206349207,
                "y": 0.7731394637602186
              },
              {
                "x": 1641.4965986394557,
                "y": 0.8392832081959162
              },
              {
                "x": 1642.3582766439908,
                "y": 0.9116290084906322
              },
              {
                "x": 1643.219954648526,
                "y": 0.9284874745631886
              },
              {
                "x": 1644.0816326530612,
                "y": 0.8777454213739387
              },
              {
                "x": 1644.9433106575964,
                "y": 0.8183293328202572
              },
              {
                "x": 1645.8049886621316,
                "y": 0.7663696473225838
              },
              {
                "x": 1646.6666666666667,
                "y": 0.7267080083093128
              },
              {
                "x": 1647.5283446712017,
                "y": 0.6987916902110214
              },
              {
                "x": 1648.3900226757369,
                "y": 0.6820064783179964
              },
              {
                "x": 1649.251700680272,
                "y": 0.6844832610602163
              },
              {
                "x": 1650.1133786848072,
                "y": 0.7021695284849803
              },
              {
                "x": 1650.9750566893424,
                "y": 0.7242587815417832
              },
              {
                "x": 1651.8367346938776,
                "y": 0.7603817862733592
              },
              {
                "x": 1652.6984126984128,
                "y": 0.8229936890564972
              },
              {
                "x": 1653.5600907029477,
                "y": 0.8504311974680506
              },
              {
                "x": 1654.421768707483,
                "y": 0.82985306455331
              },
              {
                "x": 1655.283446712018,
                "y": 0.7643293477503361
              },
              {
                "x": 1656.1451247165533,
                "y": 0.690024769069454
              },
              {
                "x": 1657.0068027210884,
                "y": 0.6278944662617564
              },
              {
                "x": 1657.8684807256236,
                "y": 0.5785700938767044
              },
              {
                "x": 1658.7301587301588,
                "y": 0.5459287355811242
              },
              {
                "x": 1659.591836734694,
                "y": 0.5326985099609924
              },
              {
                "x": 1660.453514739229,
                "y": 0.5369060083520044
              },
              {
                "x": 1661.315192743764,
                "y": 0.5599635322757641
              },
              {
                "x": 1662.1768707482993,
                "y": 0.6016081007695869
              },
              {
                "x": 1663.0385487528345,
                "y": 0.654638516192737
              },
              {
                "x": 1663.9002267573696,
                "y": 0.7188881482001264
              },
              {
                "x": 1664.7619047619048,
                "y": 0.765288400813978
              },
              {
                "x": 1665.62358276644,
                "y": 0.770033681846888
              },
              {
                "x": 1666.485260770975,
                "y": 0.7234053750613992
              },
              {
                "x": 1667.3469387755101,
                "y": 0.6670941154828499
              },
              {
                "x": 1668.2086167800453,
                "y": 0.6188969512076455
              },
              {
                "x": 1669.0702947845805,
                "y": 0.5813135826063194
              },
              {
                "x": 1669.9319727891157,
                "y": 0.5545983049846283
              },
              {
                "x": 1670.7936507936508,
                "y": 0.5386807850792269
              },
              {
                "x": 1671.655328798186,
                "y": 0.5388061532003238
              },
              {
                "x": 1672.517006802721,
                "y": 0.55272885866562
              },
              {
                "x": 1673.3786848072561,
                "y": 0.5723352644386798
              },
              {
                "x": 1674.2403628117913,
                "y": 0.6031248475298883
              },
              {
                "x": 1675.1020408163265,
                "y": 0.655684511483021
              },
              {
                "x": 1675.9637188208617,
                "y": 0.6864464486593046
              },
              {
                "x": 1676.8253968253969,
                "y": 0.679823902931291
              },
              {
                "x": 1677.687074829932,
                "y": 0.6394044542704104
              },
              {
                "x": 1678.548752834467,
                "y": 0.5712930530625455
              },
              {
                "x": 1679.4104308390022,
                "y": 0.512549145699685
              },
              {
                "x": 1680.2721088435374,
                "y": 0.46439206050610216
              },
              {
                "x": 1681.1337868480725,
                "y": 0.42789199204873507
              },
              {
                "x": 1681.9954648526077,
                "y": 0.4071014588460213
              },
              {
                "x": 1682.857142857143,
                "y": 0.4020118266354527
              },
              {
                "x": 1683.718820861678,
                "y": 0.4108776766813376
              },
              {
                "x": 1684.580498866213,
                "y": 0.43552355371134865
              },
              {
                "x": 1685.4421768707482,
                "y": 0.474221588042684
              },
              {
                "x": 1686.3038548752834,
                "y": 0.5212002666479546
              },
              {
                "x": 1687.1655328798186,
                "y": 0.5727668233808154
              },
              {
                "x": 1688.0272108843537,
                "y": 0.5986948284330925
              },
              {
                "x": 1688.888888888889,
                "y": 0.5942390007718757
              },
              {
                "x": 1689.750566893424,
                "y": 0.552452459476528
              },
              {
                "x": 1690.6122448979593,
                "y": 0.505052713885758
              },
              {
                "x": 1691.4739229024942,
                "y": 0.4649511579128493
              },
              {
                "x": 1692.3356009070294,
                "y": 0.4332090220813726
              },
              {
                "x": 1693.1972789115646,
                "y": 0.41011571907577216
              },
              {
                "x": 1694.0589569160998,
                "y": 0.39641669497357096
              },
              {
                "x": 1694.920634920635,
                "y": 0.3951993581830606
              },
              {
                "x": 1695.7823129251701,
                "y": 0.4044637933679819
              },
              {
                "x": 1696.6439909297053,
                "y": 0.3978581245204711
              },
              {
                "x": 1697.5056689342402,
                "y": 0.40795501362072045
              },
              {
                "x": 1698.3673469387754,
                "y": 0.45490677539291574
              },
              {
                "x": 1699.2290249433106,
                "y": 0.5068658683251669
              }
            ],
            "timestampType": 1
          }
        }
      ],
      "keyframeLock": "frames",
    }
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});

test('posneg() functions', async () => {
  const fixture = {
    "prompts": {
      "format": "v2",
      "enabled": true,
      "commonPrompt": {
        "name": "Common",
        "positive": "",
        "negative": "",
        "allFrames": true,
        "from": 0,
        "to": 119,
        "overlap": {
          "inFrames": 0,
          "outFrames": 0,
          "type": "none",
          "custom": "prompt_weight_1"
        }
      },
      "promptList": [
        {
          "name": "Prompt 1",
          "positive": "hello\n${posneg(\"positive phrase\", prompt_weight_1)}\n${posneg(\"negative phrase\", -prompt_weight_1)}\n${posneg_lora(\"positive_lora\", prompt_weight_1)}\n${posneg_lora(\"negative_lora\", -prompt_weight_1)}",
          "negative": "hello\n${posneg(\"np positive phrase\", -prompt_weight_2)}\n${posneg(\"np negative phrase\", prompt_weight_2)}\n${posneg_lora(\"np_positive_lora\", -prompt_weight_2)}\n${posneg_lora(\"np_negative_lora\", prompt_weight_2)}",
          "allFrames": true,
          "from": 0,
          "to": 119,
          "overlap": {
            "inFrames": 0,
            "outFrames": 0,
            "type": "none",
            "custom": "prompt_weight_1"
          }
        }
      ]
    },
    "managedFields": [
      "prompt_weight_1",
      "prompt_weight_2"
    ],
    "displayedFields": [
      "prompt_weight_1",
      "prompt_weight_2"
    ],
    "keyframes": [
      {
        "frame": 0,
        "prompt_weight_1_i": "sin(1b)",
        "prompt_weight_2_i": "sin(-2b)"
      },
      {
        "frame": 20
      }
    ],
    "timeSeries": [],
    "keyframeLock": "frames",
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});


test('common prompts', async () => {
  const fixture = {
    "prompts": {
      "format": "v2",
      "enabled": true,
      "commonPrompt": {
        "name": "Common",
        "positive": "promptc.p",
        "negative": "promptc.n",
        "allFrames": true,
        "from": 0,
        "to": 119,
        "overlap": {
          "inFrames": 0,
          "outFrames": 0,
          "type": "none",
          "custom": "prompt_weight_1"
        }
      },
      "promptList": [
        {
          "name": "Prompt 1",
          "positive": "prompt1.p",
          "negative": "prompt1.n",
          "allFrames": false,
          "from": 0,
          "to": 13,
          "overlap": {
            "inFrames": 0,
            "outFrames": 5,
            "type": "linear",
            "custom": "prompt_weight_1"
          }
        },
        {
          "positive": "prompt2.p",
          "negative": "prompt2.n",
          "from": 8,
          "to": 20,
          "allFrames": false,
          "name": "Prompt 2",
          "overlap": {
            "inFrames": 5,
            "outFrames": 0,
            "type": "linear",
            "custom": "prompt_weight_2"
          }
        }
      ]
    },
    "managedFields": [
      "seed",
    ],
    "displayedFields": [
      "seed",
    ],
    "keyframes": [
      {
        "frame": 0,
        "seed": 0,
        "seed_i": "S+f",
      },
      {
        "frame": 20
      }
    ],
    "timeSeries": [],
    "keyframeLock": "frames",
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});


test('info_match_gap, info_match_progress and bez offset', async () => {
  const fixture = {
    "prompts": {
      "format": "v2",
      "enabled": true,
      "commonPrompt": {
        "name": "Common",
        "positive": "",
        "negative": "",
        "allFrames": true,
        "from": 0,
        "to": 119,
        "overlap": {
          "inFrames": 0,
          "outFrames": 0,
          "type": "none",
          "custom": "prompt_weight_1"
        }
      },
      "promptList": [
        {
          "name": "Prompt 1",
          "positive": "",
          "negative": "",
          "allFrames": true,
          "from": 0,
          "to": 119,
          "overlap": {
            "inFrames": 0,
            "outFrames": 0,
            "type": "none",
            "custom": "prompt_weight_1"
          }
        }
      ]
    },
    "managedFields": [
      "translation_z",
      "prompt_weight_1",
      "prompt_weight_2"
    ],
    "displayedFields": [
      "translation_z",
      "prompt_weight_1",
      "prompt_weight_2"
    ],
    "keyframes": [
      {
        "frame": 0,
        "info": "trigger",
        "translation_z_i": "bez(\n  c=\"easeOut6\",\n  from=info_match_count(\"trigger\")*S,\n  to=(info_match_count(\"trigger\")+1)*S,\n  in=2b,\n  os=(info_match_progress(\"trigger\"))\n)",
        "translation_z": 5,
        "rotation_3d_z_i": "",
        "prompt_weight_1_i": "info_match_gap(\"trigger\")",
        "prompt_weight_2_i": "info_match_progress(\"trigger\")"
      },
      {
        "frame": 10,
        "info": "trigger"
      },
      {
        "frame": 20,
        "info": null
      },
      {
        "frame": 30,
        "info": "trigger"
      },
      {
        "frame": 40,
        "info": null
      },
      {
        "frame": 50,
        "info": "trigger"
      },
      {
        "frame": 60,
        "info": "trigger"
      },
      {
        "frame": 70,
        "info": null
      },
      {
        "frame": 80,
        "info": null
      },
      {
        "frame": 90,
        "info": "trigger"
      },
      {
        "frame": 100,
        "info": "trigger"
      }
    ],
    "timeSeries": [],
    "keyframeLock": "frames",
  };
  await loadAndRender(fixture);
  expect(screen.getByTestId("output")).toMatchSnapshot();
});

