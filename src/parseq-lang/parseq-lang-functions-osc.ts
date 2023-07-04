import { InvocationContext } from "./parseq-lang-ast";
import { ParseqFunction } from "./parseq-lang-functions";

type oscillatorType = 'sin' | 'tri' | 'saw' | 'sq' | 'pulse';

const commonArgs = [
  { description: "The period of the oscillation, i.e. how long each repetition of the oscillation lasts. By default the unit is frames, but you can specify seconds or beats by appending the appropriate suffix (e.g. `sin(p=4b)` or `sin(p=5s)`).", names: ["period", "p"], type: "number", required: true, default: 0 },
  { description: "The phase shift or x-axis offset of the oscillation, i.e. how much to subtract from the frame number to get the frame's oscillation x position. A useful value is `-active_keyframe`, which will make the period start from the keyframe position.", names: ["phase", "ps"], type: "number", required: false, default: 0 },
  { description: "The amplitude of the oscillation. `sin(p=4b, a=2)` is equivalent to `sin(p=4b)*2`.", names: ["amp", "a"], type: "number", required: false, default: 1 },
  { description: "The centre or y-axis offset of the oscillation. `sin(p=4b, c=2)` is equivalent to `sin(p=4b)+2`", names: ["centre", "c"], type: "number", required: false, default: 0 },
  { description: "If `>0`, limits the number of periods repeated. Values 0 and below do nothing.", names: ["limit", "li"], type: "number", required: false, default: 0 },
  { description: "*pulse() function only, ignored for other oscillators.* The pulse width", names: ["pulse", "pw"], type: "number", required: false, default: 5 },
]

function oscillator(osc: oscillatorType, period: number, phase: number,
  amp: number, centre: number, limit: number, pulsewidth: number, ctx: InvocationContext): number {

  if (limit > 0 && (ctx.frame - ctx.activeKeyframe) > limit * period) {
    return 0;
  }

  const pos = ctx.frame + phase;
  switch (osc) {
    case 'sin': return centre + Math.sin(pos * Math.PI * 2 / period) * amp;
    case 'tri': return centre + Math.asin(Math.sin(pos * Math.PI * 2 / period)) * (2 * amp) / Math.PI;
    case 'saw': return centre + (pos % period) * amp / period
    case 'sq': return centre + (Math.sin(pos * Math.PI * 2 / period) >= 0 ? 1 : -1) * amp;
    case 'pulse': return centre + amp * ((pos % period) < pulsewidth ? 1 : 0);
  }

}

const functionLibrary: { [key: string]: ParseqFunction } = {

  /////////////////////
  // Oscillators
  /////////////////////
  "sin": {
    description: "returns position on a sine wave",
    argDefs: commonArgs,
    call: (ctx, args) => oscillator("sin", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "sq": {
    description: "returns position on a square wave",
    argDefs: commonArgs,
    call: (ctx, args) => oscillator("sq", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "saw": {
    description: "returns position on a sawtooth wave",
    argDefs: commonArgs,
    call: (ctx, args) => oscillator("saw", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "tri": {
    description: "returns position on a triangle wave",
    argDefs: commonArgs,
    call: (ctx, args) => oscillator("tri", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "pulse": {
    description: "returns position on a pulse wave",
    argDefs: commonArgs,
    call: (ctx, args) => oscillator("pulse", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
}

export default functionLibrary;