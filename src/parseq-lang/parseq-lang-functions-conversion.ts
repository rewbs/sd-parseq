import { beatToFrame, frameToBeat, frameToSec, secToFrame } from "../utils/maths";
import { ParseqFunction } from "./parseq-lang-functions";

const functionLibrary: { [key: string]: ParseqFunction } = {

  "f2b": {
    description: "Converts a frame number to a beat position or number of beats.",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => frameToBeat(Number(args[0]), ctx.FPS, ctx.BPM)
  },
  "f2s": {
    description: "Converts a frame number to a second position or number of seconds.",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => frameToSec(Number(args[0]), ctx.FPS)
  },
  "b2f": {
    description: "Converts a number of beats to frames",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => beatToFrame(Number(args[0]), ctx.FPS, ctx.BPM)
  },
  "s2f": {
    description: "Converts a frame number to a second position or number of second.",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => secToFrame(Number(args[0]), ctx.FPS)
  },

}

export default functionLibrary;