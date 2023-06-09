import BezierEasing from "bezier-easing";
import { InvocationContext, getActiveKeyframeValue, getNextKeyframe, getNextKeyframeValue } from "./parseq-lang-ast";
import { ParseqFunction } from "./parseq-lang-functions";

import seedrandom from 'seedrandom';
//@ts-ignore
import { Noise } from 'noisejs';

function slide(from: number, to: number, over: number, offset: number, ctx: InvocationContext) {
  const x = ctx.frame - ctx.activeKeyframe;
  const start_y = from;
  const end_y = to;
  const range_x = over;
  const position = Math.abs(offset)<1  ? offset*(range_x) : x
  if (range_x === 0) {
    return start_y;
  } else if (x >= range_x) {
    return end_y;
  } else {
    const slope = (end_y - start_y) / range_x;
    return start_y + slope * position;
  }
}

function bezier(x1: number, y1: number, x2: number, y2: number,
  from: number, to: number, over: number, offset: number, ctx: InvocationContext) {
  const start_x = ctx.activeKeyframe;
  const range_x = over;
  const start_y = from;
  const end_y = to;
  const range_y = end_y - start_y;
  const x = ctx.frame - start_x;
  const position = Math.abs(offset)<1  ? offset : x / range_x
  if (range_x === 0) {
    return start_y;
  } else if (position>1) {
    return end_y;
  } else {
    const bezier = BezierEasing(x1, y1, x2, y2);
    return start_y + bezier(position) * range_y;
  }
}

function curveNameToControlPoints(curve: string): [number, number, number, number] {
  switch (curve) {
    case "ease": return [0.25, 0.1, 0.25, 1.0];
    case "ease-in":
    case "easeIn":
      return [0.42, 0.0, 1.0, 1.0];
    case "ease-out":
    case "easeOut":      
      return [0.0, 0.0, 0.58, 1.0];
    case "ease-in-out":
    case "easeInOut":
      return [0.42, 0.0, 0.58, 1.0];
    case "linear": return [0.0, 0.0, 1.0, 1.0];
    case "step-start":
    case "stepStart":      
      return [0.0, 0.0, 0.0, 1.0];
    case "step-end":
    case "stepEnd":      
      return [1.0, 0.0, 1.0, 1.0];
    case "easeInSine":
    case "easeIn1":
      return [0.12, 0, 0.39, 0];
    case "easeOutSine":
    case "easeOut1":
      return [0.61, 1, 0.88, 1];
    case "easeInOutSine":
    case "easeInOut1":      
      return [0.37, 0, 0.63, 1];
    case "easeInQuad":
    case "easeIn2":      
      return [0.11, 0, 0.5, 0];
    case "easeOutQuad":
    case "easeOut2":      
      return [0.5, 1, 0.89, 1];
    case "easeInOutQuad":
    case "easeInOut2":      
      return [0.45, 0, 0.55, 1];
    case "easeInCubic":
    case "easeIn3":      
      return [0.32, 0, 0.67, 0];
    case "easeOutCubic":
    case "easeOut3":      
      return [0.33, 1, 0.68, 1];
    case "easeInOutCubic":
    case "easeInOut3":      
      return [0.65, 0, 0.35, 1];
    case "easeInQuart":
    case "easeIn4":      
      return [0.5, 0, 0.75, 0];
    case "easeOutQuart":
    case "easeOut4":      
      return [0.25, 1, 0.5, 1];
    case "easeInOutQuart":
    case "easeInOut4":      
      return [0.76, 0, 0.24, 1];
    case "easeInQuint":
    case "easeIn5":      
      return [0.64, 0, 0.78, 0];
    case "easeOutQuint":
    case "easeOut5":      
      return [0.22, 1, 0.36, 1];
    case "easeInOutQuint":
    case "easeInOut5":      
      return [0.83, 0, 0.17, 1];
    case "easeInExpo":
    case "easeIn6":
      return [0.7, 0, 0.84, 0];
    case "easeOutExpo":
    case "easeOut6":      
      return [0.16, 1, 0.3, 1];
    case "easeInOutExpo":
    case "easeInOut6":      
      return [0.87, 0, 0.13, 1];
    case "easeInCirc":
      return [0.55, 0, 1, 0.45];
    case "easeOutCirc":
      return [0, 0.55, 0.45, 1];
    case "easeInOutCirc":
      return [0.85, 0, 0.15, 1];
    case "easeInBack":
      return [0.36, 0, 0.66, -0.56];
    case "easeOutBack":
      return [0.34, 1.56, 0.64, 1];
    case "easeInOutBack":
      return [0.68, -0.6, 0.32, 1.6];
    default:
      throw new Error(`Unknown curve type: ${curve}.`);
  }
}


const functionLibrary: { [key: string]: ParseqFunction } = {
  /////////////////////
  // Transitions
  /////////////////////  

  "rand": {
    description: "returns a random number between 'min' and 'max' (default 0 and 1), using seed 's' (default current time using high precison timer), holding that value for 'h' frames (default 1)",
    argDefs: [
      { description: "min", names: ["min", "n"], type: "number", required: false, default: 0 },
      { description: "max", names: ["max", "x"], type: "number", required: false, default: 1 },
      { description: "seed", names: ["seed", "s"], type: "number", required: false, default: () => window.performance.now() },
      { description: "hold", names: ["hold", "h"], type: "number", required: false, default: 1 },
    ],
    call: (ctx, args, node) => {
      const [ min, max, seed, hold ] = [ Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]) ];
      const lastComputedAt = Number(node.getState('randValueComputedAt'));
      if (isNaN(lastComputedAt)
          || Math.floor((lastComputedAt-ctx.activeKeyframe)/hold) < Math.floor((ctx.frame - ctx.activeKeyframe)/hold)
          || !node.hasState('randValue')) { 
        const generator : (() => number) = node.getOrComputeState('randGen', () => seedrandom(seed.toString())) as (() => number);
        const value = generator() * (max - min) + min;
        node.setState('randValue', value);
        node.setState('randValueComputedAt', ctx.frame);
        return value;
      } else {
        return node.getState('randValue');
      }
    }
  },
  "smrand": {
    description: "Simplex noise function (smooth random)",
    argDefs: [
      { description: "smoothing factor (1 for ragged, 100 for smooth)", names: ["smooth", "sm"], type: "number", required: false, default: 10 },
      { description: "min", names: ["min", "n"], type: "number", required: false, default: 0 },
      { description: "max", names: ["max", "x"], type: "number", required: false, default: 1 },
      { description: "seed", names: ["seed", "s"], type: "number", required: false, default: () => window.performance.now() },
      { description: "y (2d component of noise function)", names: ["y"], type: "number", required: false, default: 0 },
    ],
    call: (ctx, args, node) => {
      const [smoothing, min, max, seed, y] = [Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4])];
      const x = ctx.frame / (smoothing || 1);
      const noiseGen: Noise = node.getOrComputeState('noiseGen', () => new Noise(seed.toString()));
      return (noiseGen.simplex2(x, y)) * (max - min) / 2 + (max + min) / 2;
    }
  },
  "perlin": {
    description: "Simplex noise function (smooth random)",
    argDefs: [
      { description: "smoothing factor (1 for ragged, 100 for smooth)", names: ["smooth", "sm"], type: "number", required: false, default: 10 },
      { description: "min", names: ["min", "n"], type: "number", required: false, default: 0 },
      { description: "max", names: ["max", "x"], type: "number", required: false, default: 1 },
      { description: "seed", names: ["seed", "s"], type: "number", required: false, default: () => window.performance.now() },
      { description: "y (2d component of noise function)", names: ["y"], type: "number", required: false, default: 0 },
    ],
    call: (ctx, args, node) => {
      const [smoothing, min, max, seed, y] = [Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4])];
      const x = ctx.frame / (smoothing || 1);
      const noiseGen: Noise = node.getOrComputeState('noiseGen', () => new Noise(seed.toString()));
      return (noiseGen.perlin2(x, y)) * (max - min) + (max + min) / 2;
    }
  },
  "vibe": {
    description: "returns position on bezier curve for the current frame. x1, y1, x2 and y2 behave as with https://cubic-bezier.com/.",
    argDefs: [
      { description: "control point x1", names: ["x1"], type: "number", required: false, default: 0.5 },
      { description: "control point y1", names: ["y1"], type: "number", required: false, default: 0 },
      { description: "control point x2", names: ["x2"], type: "number", required: false, default: 0.5 },
      { description: "control point y2", names: ["y2"], type: "number", required: false, default: 1 },
      { description: "offset", names: ["offset","os"], type: "number", required: false, default: 2 },
      { description: "period min", names: ["pmin"], type: "number", required: false, default: 1 },
      { description: "period max", names: ["pmax"], type: "number", required: false, default: 20 },
      { description: "period (fixed)", names: ["p"], type: "number", required: false, default: NaN },
      { description: "amplitude min", names: ["min"], type: "number", required: false, default: 0 },
      { description: "amplitude max", names: ["max"], type: "number", required: false, default: 1 },
      { description: "seed", names: ["seed", "s"], type: "number", required: false, default: () => window.performance.now() },
      { description: "curve type (overriddes x1, y1, x2, y2 with preset values)", names: ["curve","c"], type: "string", required: false, default: "" },
    ],
    call: (ctx, args, node) => {
      const [pmin, pmax, p, min, max, seed, curve] = [Number(args[5]), Number(args[6]), Number(args[7]), Number(args[8]), Number(args[9]), Number(args[10]), String(args[11])];

      const initVibeStartFrame = Number(node.getState('vibeStartFrame'));
      const initVibePeriod = Number(node.getState('vibePeriod'));

      if (isNaN(initVibeStartFrame)
          || isNaN(initVibePeriod)
          || ctx.frame > initVibeStartFrame + initVibePeriod) { 
          // Starting new bezier
          const generator : (() => number) = node.getOrComputeState('randGen', () => seedrandom(seed.toString())) as (() => number);          
          node.setState('vibeStartFrame', ctx.frame);
          
          const oldEnd = node.getState('vibeEnd');
          const newStart = isNaN(oldEnd) ? getActiveKeyframeValue(ctx) : oldEnd ;
          node.setState('vibeStart', newStart);

          const newEnd = generator() * (max - min) + min;
          node.setState('vibeEnd', newEnd);

          const newPeriod = isNaN(p) ? Math.floor(generator() * (pmin - pmax) + pmin) : p;
          node.setState('vibePeriod', newPeriod);
      }

      const [vibeStart, vibeEnd, vibePeriod, vibeStartFrame] = [ node.getState('vibeStart'), node.getState('vibeEnd'), node.getState('vibePeriod'), node.getState('vibeStartFrame')];

      let [x1, y1, x2, y2] = [Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3])];
      if (curve) {
        [x1, y1, x2, y2] = curveNameToControlPoints(curve);
      }

      return bezier(x1, y1, x2, y2, vibeStart, vibeEnd, vibePeriod, (ctx.frame-vibeStartFrame)/vibePeriod, ctx); 
    }
  },

  /////////////////////
  // Transitions
  /////////////////////

  "bez": {
    description: "returns position on bezier curve for the current frame. x1, y1, x2 and y2 behave as with https://cubic-bezier.com/.",
    argDefs: [
      { description: "control point x1", names: ["x1"], type: "number", required: false, default: 0.5 },
      { description: "control point y1", names: ["y1"], type: "number", required: false, default: 0 },
      { description: "control point x2", names: ["x2"], type: "number", required: false, default: 0.5 },
      { description: "control point y2", names: ["y2"], type: "number", required: false, default: 1 },
      { description: "starting y position", names: ["from", "start", "s"], type: "number", required: false, default: (ctx) => getActiveKeyframeValue(ctx) },
      { description: "ending y position", names: ["to", "end", "t"], type: "number", required: false, default: (ctx) => getNextKeyframeValue(ctx) },
      { description: "duration of the bezier curve in frames", names: ["span", "in", "s"], type: "number", required: false, default: (ctx) => getNextKeyframe(ctx) - ctx.activeKeyframe },
      { description: "offset", names: ["offset","os"], type: "number", required: false, default: 2 },
      { description: "curve type (overriddes x1, y1, x2, y2 with preset values)", names: ["curve","c"], type: "string", required: false, default: "" },
    ],

    call: (ctx, args) => {
      let [x1, y1, x2, y2, from, to, span, offset, curve] = [Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]), Number(args[6]), Number(args[7]), String(args[8])];
      if (curve) {
        [x1, y1, x2, y2] = curveNameToControlPoints(curve);
      }

      return bezier(x1, y1, x2, y2, from, to, span, offset, ctx)
    }
  },
  "slide": {
    description: "returns position on a linear slide with configurable starting and ending points.",
    argDefs: [
      { description: "start y", names: ["from", "start", "s"], type: "number", required: false, default: (ctx) => getActiveKeyframeValue(ctx) },
      { description: "end y", names: ["to", "end", "t"], type: "number", required: false, default: (ctx) => getNextKeyframeValue(ctx) },
      { description: "duration in frames (span)", names: ["span", "in", "s"], type: "number", required: false, default: (ctx) => getNextKeyframe(ctx) - ctx.activeKeyframe },
      { description: "offset", names: ["offset","os"], type: "number", required: false, default: 2 },
    ],
    call: (ctx, args) => slide(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), ctx)
  },

}


export default functionLibrary;