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
  }
}

export default functionLibrary;