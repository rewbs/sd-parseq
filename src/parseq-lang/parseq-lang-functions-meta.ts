import { getDefaultFieldValue } from "../parseq-renderer";
import { beatToFrame, frameToBeat } from "../utils/maths";
import { ParseqFunction } from "./parseq-lang-functions";

const functionLibrary: { [key: string]: ParseqFunction } = {
  "computed_at": {
    description: "Get the value computed for this field at a given frame.",
    argDefs: [
      { description: "frame", names: ["f"], type: "number", required: false, default: (ctx) => ctx.activeKeyframe, defaultDescription: "frame number of the active keyframe" },
      { description: "default value if requested frame is <0", names: ["d"], type: "number", required: false, default: (ctx) => getDefaultFieldValue(ctx.fieldName), defaultDescription: "the default value for this field" },
    ],
    call: (ctx, args) => {
      const prior_frame = Number(args[0]);
      if (prior_frame > ctx.frame) {
        throw new Error("computed_at(prior_frame) - prior_frame must be below the current frame number.")
      } else if (prior_frame < 0) {
        return Number(args[1])
      } else {
        return ctx.computed_values[prior_frame];
      }
    }
  },
  "start_of_beat": {
    description: "Get the frame number of the start of the beat at the given frame.",
    argDefs: [
      { description: "frame", names: ["f"], type: "number", required: false, default: (ctx) => ctx.frame, defaultDescription: "the current frame"},
      { description: "rounding mode: `d`=down, `u`=up, `r`=round", names: ["round", "r"], type: "string", required: false, default: 'r' },
    ],
    call: (ctx, args) => {
      let rounding: (x: number) => number;
      switch (args[1]) {
        case 'd':
          rounding = Math.floor;
          break;
        case 'u':
          rounding = Math.ceil;
          break;
        case 'r':
          rounding = Math.round;
          break;
        default:
          throw new Error("Unknow rounding mode: " + args[1]);
      }
      const wholeBeat = Math.floor(frameToBeat(Number(args[0]), ctx.FPS, ctx.BPM));
      return rounding(beatToFrame(wholeBeat, ctx.FPS, ctx.BPM));
    }
  },
  "recompute_if": {
    description: "If the supplied condition is true, return the second param, else return the value of the second param when condition was last true. If condition is false and has never been true, return -1 or overridden default.",
    argDefs: [
      { description: "condition", names: ["if"], type: "number", required: true, default: 0},
      { description: "compute", names: ["compute", "c"], type: "number", required: true, default: 0},
      { description: "default", names: ["default", "d"], type: "number", required: false, default: -1},
      // Need to think about this one some more – it won't be auto-recomputed if referenced directly.
      //{ description: "varname", names: ["varname", "v"], type: "string", required: false, default: 'r' },
    ],
    call: (ctx, args) => {
      const condition = Number(args[0]);
      const newValue = Number(args[1]);
      const def = Number(args[2]);
      const stored = ctx.activeNode?.getState('stored_var');
      let retval;
      if (condition > 0) {
         ctx.activeNode?.setState('stored_var', { stored_var: newValue });
         retval = newValue;
      } else if (stored?.stored_var !== undefined) {
        retval = stored.stored_var;
      } else {
        retval = def;
      }
      return retval;
    }
  },
  "dangerous": {
    description: "Get value of a field at a given frame, IF it has already been calculated, else -1. WARNING: there's no guarantee of field computation ordering, and there's no protection from of cyclical references.",
    argDefs: [
      { description: "field name", names: ["name", "n"], type: "string", required: true, default: 0},
      { description: "frame", names: ["frame", "f"], type: "number", required: false, default: (ctx) => ctx.frame},
    ],
    call: (ctx, args) => {
      if (ctx.rendered_frames
        && ctx.rendered_frames[Number(args[1])]
        && ctx.rendered_frames[Number(args[1])][args[0]]) {
          return ctx.rendered_frames[Number(args[1])][args[0]];
      } else {
        return -1;
      }
      
    }
  }  
}

export default functionLibrary;