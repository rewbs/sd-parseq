import { InvocationContext } from "./parseq-lang-ast";
import { ParseqFunction } from "./parseq-lang-functions";


function frameOfPrevMatch(ctx: InvocationContext, pattern: string) {
  return ctx.allKeyframes
    .findLast((kf: { frame: number; info?: string; }) => kf.frame <= ctx.frame && kf.info?.match(pattern));
}

function frameOfNextMatch(ctx: InvocationContext, pattern: string) {
  return ctx.allKeyframes
    .find((kf: { frame: number; info?: string; }) => kf.frame > ctx.frame && kf.info?.match(pattern));
}


const info_match_prev : ParseqFunction = {
  description: "Returns the frame number of the last keyframe that matched the regex, or -1 if none.",
  argDefs: [
    { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" },
    { description: "default if no previous match", names: ["default", "d"], type: "string", required: false, default: -1 }
  ],
  call: (ctx, args) => {
    const pattern = String(args[0]);
    const prevMatch = frameOfPrevMatch(ctx, pattern);
    return prevMatch ? prevMatch.frame : Number(args[1]);
  }
};

const functionLibrary: { [key: string]: ParseqFunction } = {
  "info_match": {
    description: "Returns 1 if the info label of the current keyframe matches the supplied regex, 0 otherwise.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const activeKeyFrame = ctx.allKeyframes
        .findLast((kf: { frame: number, info?: string }) => kf.frame <= ctx.frame);
      return activeKeyFrame ? activeKeyFrame.info?.match(pattern) ? 1 : 0 : 0;
    }
  },
  "info_match_count": {
    description: "Returns the number of keyframes that have info labels that matched the supplied regex so far.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      return ctx.allKeyframes
        .filter((kf) => kf.frame <= ctx.frame && kf.info?.match(pattern))
        .length
    }
  },
  
  "info_match_prev": info_match_prev,
  "info_match_last": info_match_prev, // deprecated alias
  "info_match_next": {
    description: "Returns the frame number of the next keyframe that matched the regex, or -1 if none.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" },
      { description: "default if no next match", names: ["default", "d"], type: "number", required: false, default: -1 }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const nextMatch = frameOfNextMatch(ctx, pattern)
      return nextMatch ? nextMatch.frame : Number(args[1]);
    }
  },

  "info_match_gap": {
    description: "Returns the number of frames between the previous and next match (equivalent to `info_match_next()-info_match_prev()`), or `-1` if not between matches.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" },
      { description: "default if not between matches", names: ["default", "d"], type: "number", required: false, default: -1 }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const prevMatch = frameOfPrevMatch(ctx, pattern);
      const nextMatch = frameOfNextMatch(ctx, pattern)
      return (nextMatch && prevMatch) ? (nextMatch.frame - prevMatch.frame) : Number(args[1]);
    }
  },

  "info_match_progress": {
    description: "Returns a number between 0 and 1 reprenting how far the current frame is along the gap between (equivalent to `(f-info_match_prev()/info_match_gap())`, or `-1` if not between matches.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" },
      { description: "default if not between matches", names: ["default", "d"], type: "number", required: false, default: -1 }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const prevMatch = frameOfPrevMatch(ctx, pattern);
      const nextMatch = frameOfNextMatch(ctx, pattern)
      return (nextMatch && prevMatch) ? (ctx.frame - prevMatch.frame) / (nextMatch.frame - prevMatch.frame) : Number(args[1]);
    }
  },

  "info_match_since": {
    description: "Returns the number of frames since the previous keyframe that matched the regex, or an overridable fallback defaulting to `-1` if no next match. Equivalent to `f-info_match_prev()`.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" },
      { description: "default if not between matches", names: ["default", "d"], type: "number", required: false, default: -1 }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const prevMatch = frameOfPrevMatch(ctx, pattern);
      return (prevMatch) ? (ctx.frame - prevMatch.frame) : Number(args[1]);
    }
  },

  "info_match_until": {
    description: "Returns the number of frames until the next keyframe that matches the regex, or an overridable fallback defaulting to `-1` if no next match. Equivalent to `info_match_next()-f`.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" },
      { description: "default if not between matches", names: ["default", "d"], type: "number", required: false, default: -1 }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const nextMatch = frameOfNextMatch(ctx, pattern)
      return (nextMatch) ? (nextMatch.frame - ctx.frame) : Number(args[1]);
    }
  },  

}


export default functionLibrary;




