//@ts-ignore
import { linear, polynomial } from 'everpolate';
//@ts-ignore
import Spline from 'cubic-spline';
import BezierEasing from "bezier-easing";
import { toFixedNumber, toFixedCeil, toFixedFloor, frameToBeat, frameToSec, secToFrame, beatToFrame } from '../utils/maths';
import seedrandom from 'seedrandom';
import { InterpolationType, TimeSeries } from './parseq-timeseries';
//@ts-ignore
import {Noise} from 'noisejs';

//const noise = new Noise(Math.random());

export type InvocationContext = {
  fieldName: string;
  activeKeyframe: number;
  activeNode?: ParseqAstNode;
  definedFrames: number[];
  definedValues: number[];
  allKeyframes: { //TODO - should be using ParseqKeyframe type
    frame: number,
    info?: string
  }[];
  FPS: number;
  BPM: number;
  variableMap: Map<string, number | string>;
  frame: number;
  timeSeries : [{
    alias:string;
    ts:TimeSeries;
  }] | [],
  promptType?:boolean;
}

type InputLocation = {
  line: number | undefined;
  col: number | undefined;
}

export abstract class ParseqAstNode {
  constructor(protected start: InputLocation,
    protected end: InputLocation,
    protected children: ParseqAstNode[],
    protected value?: string | number) {
    // TODO - fix all cases where nodes have missing position info.
    if (!start) {
      start = { line: undefined, col: undefined };
    }
    if (!end) {
      start = { line: undefined, col: undefined };
    }
  }

  // Store aribtrary state in the AST node. Useful for
  // functions that depend on the result of a previous invocation.
  protected nodeState: Map<string, any> = new Map();
  public hasState(key: string): boolean {
    return this.nodeState.has(key);
  } 
  public setState(key: string, value: any) {
    this.nodeState.set(key, value);
  }
  public getState(key: string) {
    return this.nodeState.get(key);
  }
  public getValue() {
    return this.value;
  }  

  public getOrComputeState(key: string, compute: () => object): object {
    if (this.nodeState.has(key)) {
      //@ts-ignore - we know this is an object
      return this.nodeState.get(key);
    } else {
      const value = compute();
      this.nodeState.set(key, value);
      return value;
    }
  }

  public invoke(ctx: InvocationContext): number | string {

    ctx.activeNode = this;

    this.preInvoke(ctx);
    const retval = this.innerInvoke(ctx);
    this.postInvoke(ctx);

    return retval;
  }

  public preInvoke(ctx: InvocationContext) {
    //console.log("Calling node: ", this.debug());
  }

  public postInvoke(ctx: InvocationContext) {
    //console.log("Called node: ", this.debug());
  }  
  
  protected abstract innerInvoke(ctx: InvocationContext): string | number;

  public debug(): any {
    const currentNode = `${this.constructor.name}:{${this.value ?? ''}} (${this.start?.line}:${this.start?.col}->${this.end?.line}:${this.end?.col})`;

    if (this.children.length > 0) {
      const children = this.children.flatMap(child => child.debug ? child.debug() : child);
      return [currentNode, children];
    } else {
      return currentNode;
    }
  }
}

export class NumberLiteralAst extends ParseqAstNode {
  innerInvoke(ctx: InvocationContext): number {
    return Number(this.value ?? 0);
  }
}

export class StringLiteralAst extends ParseqAstNode {
  innerInvoke(ctx: InvocationContext): string {
    return String(this.value ?? '');
  }
}
export class BooleanLiteralAst extends ParseqAstNode {
  innerInvoke(ctx: InvocationContext): number {
    return this.value ? 1 : 0;
  }
}

export class NegationAst extends ParseqAstNode {
  innerInvoke(ctx: InvocationContext): number | string {
    const negatable = this.children[0].invoke(ctx);
    if (typeof negatable === 'string') {
      return "-" + negatable;
    } else {
      return -negatable;
    }
  }
}

export class NumberWithUnitAst extends ParseqAstNode {
  innerInvoke(ctx: InvocationContext): number | string {
    const unit = this.value;
    const number = Number(this.children[0].invoke(ctx));
    switch (unit) {
      case 'f':
        return number;
      case 's':
        return number * ctx.FPS;
      case 'b':
        return number * (ctx.FPS * 60) / ctx.BPM;
      default:
        throw new Error(`Unrecognised conversion unit ${unit} at ${this.start?.line}:${this.start?.col}`);
    }
  }
}


export class VariableReferenceAst extends ParseqAstNode {

  private variableName = String(this.value);

  innerInvoke(ctx: InvocationContext): number | string {
    switch (this.variableName) {
      case 'L':
        return linearInterpolation(ctx.definedFrames, ctx.definedValues, ctx.frame);
      case 'P':
        return polyInterpolation(ctx.definedFrames, ctx.definedValues, ctx.frame);
      case 'S':
        return getActiveKeyframeValue(ctx);
      case 'C':
        return cubicSplineInterpolation(ctx.definedFrames, ctx.definedValues, ctx.frame);
      case 'f':
        return ctx.frame;
      case 'b':
        return frameToBeat(ctx.frame, ctx.FPS, ctx.BPM);
      case 's':
        return frameToSec(ctx.frame, ctx.FPS);
      case 'k': // offset since last active keyframe
        return ctx.frame - ctx.activeKeyframe;
      case 'prev_keyframe': // deprecated, use 'active_keyframe', which is a more accurate name.
      case 'active_keyframe':
        return ctx.activeKeyframe;
      case 'next_keyframe':
        return getNextKeyframe(ctx);
      case 'prev_keyframe_value': // deprecated, use 'active_keyframe_value', which is a more accurate name.
      case 'active_keyframe_value':
        return getActiveKeyframeValue(ctx);
      case 'next_keyframe_value':
        return getNextKeyframeValue(ctx);
      case 'PI':
        return Math.PI
      case 'E':
        return Math.E;
      case 'SQRT2':
        return Math.SQRT2;
      case 'SQRT1_2':
        return Math.SQRT1_2;
      case 'LN2':
        return Math.LN2;
      case 'LN10':
        return Math.LN10;
      case 'LOG2E':
        return Math.LOG2E;
      case 'LOG10E':
        return Math.LOG10E;
      default:
        if (this.variableName && ctx.variableMap.has(this.variableName)) {
          return ctx.variableMap.get(this.variableName) ?? 0;
        } else if (this.variableName) {
          const t = ctx.timeSeries.find((t => t.alias === this.variableName));
          if (t?.ts) {
            const timeSeries = new TimeSeries(t.ts.data, t.ts.timestampType);
            return timeSeries.getValueAt(ctx.frame, ctx.FPS, InterpolationType.Step)??0;
          }
        }
      throw new Error(`Unrecognised variable ${this.variableName} at ${this.start?.line}:${this.start?.col}`);
      
    }
  }
}

export class BinaryOpAst extends ParseqAstNode {
  private leftNode = this.children[0];
  private rightNode = this.children[1];

  innerInvoke(ctx: InvocationContext): number | string {
    const left = this.leftNode.invoke(ctx);
    const right = this.rightNode.invoke(ctx);
    switch (this.value) {
      case '+':
        //@ts-ignore - fall back to JS type juggling.
        return left + right;
      case '-':
        //@ts-ignore - fall back to JS type juggling.
        return left - right;
      case '*':
        //@ts-ignore - fall back to JS type juggling.
        return left * right;
      case '/':
        if (right===0) {
          throw new Error(`Divide by zero at ${this.start?.line}:${this.start?.col}.`);
        }
        //@ts-ignore - fall back to JS type juggling.
        return left / right;
        
      case '%':
        //@ts-ignore - fall back to JS type juggling.
        return left % right;
      case '^':
        //@ts-ignore - fall back to JS type juggling.
        return left ** right;
      case '==':
        /* eslint-disable eqeqeq */
        return left == right ? 1 : 0;
      case '!=':
        /* eslint-disable eqeqeq */
        return left != right ? 1 : 0;
      case '<':
        return left < right ? 1 : 0;
      case '<=':
        return left <= right ? 1 : 0;
      case '>':
        return left > right ? 1 : 0;
      case '>=':
        return left >= right ? 1 : 0;
      case 'and':
      case '&&':
        //@ts-ignore - fall back to JS type juggling.
        return left > 0 && right > 0 ? 1 : 0;
      case 'or':
      case '||':
        //@ts-ignore - fall back to JS type juggling.
        return left > 0 || right > 0 ? 1 : 0;
      case ':':
        return "(" + left + ":" + right + ")";
      default:
        throw new Error(`Unknown binary operator '${JSON.stringify(this.value)}' at ${this.start?.line}:${this.start?.col}.`);
    }
  }

}

export class IfAst extends ParseqAstNode {

  private conditionNode = this.children[0];
  private consequentNode = this.children[1];
  private alternateNode = this.children[2] || null;

  innerInvoke(ctx: InvocationContext): number | string {
    //@ts-ignore - fall back to JS type juggling.
    if (this.conditionNode.invoke(ctx) > 0) {
      return this.consequentNode.invoke(ctx);
    } else if (this.alternateNode) {
      return this.alternateNode.invoke(ctx);
    } else {
      return 0;
    }
  }
}

export class FunctionCallAst extends ParseqAstNode {

  private funcDef: ParseqFunction;

  constructor(protected start: InputLocation,
    protected end: InputLocation,
    protected children: ParseqAstNode[],
    protected value: string | number) {
    super(start, end, children, value);
     
    this.funcDef = functionLibrary[value] || functionLibrary['missingFunction'];
  }

  isNamedArgs(): boolean {
    // All arguments are either named or unnamed, you can't mix & match (enforced by grammar).
    // So it's sufficient to check the first arg.
    return this.children.length > 0 && this.children[0] instanceof NamedArgAst;
  }

  innerInvoke(ctx: InvocationContext): number | string {
    this.validateArgs();
    const args = this.evaluateArgs(ctx);
    return this.funcDef.call(ctx, args, this);
  }


  private validateArgs() {
    // Check that all required args are present
    const requiredArgs = this.funcDef.argDefs.filter(arg => arg.required);
    const missingArgs: boolean = this.isNamedArgs() ?
      requiredArgs.some(arg => arg.names.every(name => !this.children.some(child => (child as NamedArgAst).getName() === name)))
      : this.children.length < requiredArgs.length;
    if (missingArgs) {
      throw new Error(`1 or more missing required arguments for function '${this.value} (${this.funcDef.description})'. Required arguments: ${requiredArgs.map(arg => arg.names.join('/')).join(', ')}`);
    }

    // Check that all args are known
    let extraArgs: { extras: number; names: string[]; };
    if (this.isNamedArgs()) {
      const extraArgNames = this.children.map(child => (child as NamedArgAst).getName())
        .filter(name => !this.funcDef.argDefs.some(arg => arg.names.includes(name)));
      extraArgs = {
        extras: extraArgNames.length,
        names: extraArgNames
      };
    } else {
      extraArgs = {
        extras: this.children.length - this.funcDef.argDefs.length,
        names: []
      };
    }
    if (extraArgs.names.length > 0) {
      throw new Error(`1 or more unrecognised arguments for function '${this.value} (${this.funcDef.description})': ${extraArgs.names.join(', ')}. Supported arguments: ${this.funcDef.argDefs.map(arg => arg.names.join('/')).join(', ')}`);
    } else if (extraArgs.extras > 0) {
      throw new Error(`Too many arguments for function '${this.value} (${this.funcDef.description})'. Expected ${this.funcDef.argDefs.length} arguments, got ${this.children.length}`);
    }

    // Check that no duplicate args are present
    if (this.isNamedArgs()) {
      const duplicateArgNames = this.funcDef.argDefs.filter(arg => this.children.filter(child => arg.names.includes((child as NamedArgAst).getName())).length > 1)
        .map(arg => arg.names.join('/'));

      if (duplicateArgNames.length > 0) {
        throw new Error(`Duplicate arguments for function '${this.value} (${this.funcDef.description})': ${duplicateArgNames.join(', ')}`);
      }
    }
  }

  private evaluateArgs = (ctx: InvocationContext): (number | string)[] => {
    // Evaluate arguments in order of definition (checking type before returning)
    return this.funcDef.argDefs.map((argDef, idx) => {
      const argNode = this.isNamedArgs() ?
        this.children.find(child => argDef.names.includes((child as NamedArgAst).getName()))
        : this.children[idx];
      if (argNode) {
        const argVal = argNode.invoke(ctx);
        if (typeof argVal !== argDef.type) {
          throw new Error(`Invalid argument type for argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'. Expected type '${argDef.type}', got '${typeof argVal}'`);
        } else {
          return argVal;
        }
      } else {
        if (argDef.required) {
          throw new Error(`Missing required argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'`);
        } else {
          if (typeof argDef.default === 'function') {
            return argDef.default(ctx);
          } else {
            return argDef.default;
          }
        }
      }
    });
  }


}

export class NamedArgAst extends ParseqAstNode {
  getName(): string {
    return this.value as string ?? '';
  }
  innerInvoke(ctx: InvocationContext): number | string {
    return this.children[0].invoke(ctx);
  }
}

export class UnnamedArgAst extends ParseqAstNode {
  innerInvoke(ctx: InvocationContext): number | string {
    return this.children[0].invoke(ctx);
  }
}

type ArgDef = {
  names: string[];
  description: string;
  type: string;
  required: boolean;
  default: number | string | ((ctx: InvocationContext) => number | string);
}

type ParseqFunction = {
  description: string;
  argDefs: ArgDef[];
  call(ctx: InvocationContext, args: (number | string)[], node: ParseqAstNode): number | string;
}



const oscillatorArgs = [
  { description: "period", names: ["period", "p"], type: "number", required: true, default: 0 },
  { description: "phase shift", names: ["phase", "ps"], type: "number", required: false, default: 0 },
  { description: "amplitude", names: ["amp", "a"], type: "number", required: false, default: 1 },
  { description: "centre", names: ["centre", "c"], type: "number", required: false, default: 0 },
  { description: "limit: number of periods to repeat", names: ["limit", "li"], type: "number", required: false, default: 0 },
  { description: "pulse width", names: ["pulse", "pw"], type: "number", required: false, default: 5 },
]

const functionLibrary: { [key: string]: ParseqFunction } = {

  "missingFunction": {
    description: "invoked when function is not found",
    argDefs: [
      { description: "term a", names: ["a"], type: "number", required: false, default: 0 },
      { description: "term b", names: ["b"], type: "number", required: false, default: 0 },
      { description: "term c", names: ["c"], type: "number", required: false, default: 0 },
      { description: "term d", names: ["d"], type: "number", required: false, default: 0 },
      { description: "term e", names: ["e"], type: "number", required: false, default: 0 },
      { description: "term f", names: ["f"], type: "number", required: false, default: 0 },
      { description: "term g", names: ["g"], type: "number", required: false, default: 0 },
    ],
    call: (ctx, args, node) => {
      const t = ctx.timeSeries.find((t => t.alias === node.getValue()));
      if (t?.ts) {
        const timeSeries = new TimeSeries(t.ts.data, t.ts.timestampType);
        return timeSeries.getValueAt(Number(args[0]), ctx.FPS, args[1] ? InterpolationType.Linear : InterpolationType.Step)??0;
      } else {
        throw new Error(`Unknown function: '${node.getValue()}'`)
      }
    }
  },

  /////////////////////
  // Maths
  /////////////////////

  "min": {
    description: "returns the smaller of 2 arguments 'a' and 'b'",
    argDefs: [
      { description: "term a", names: ["a"], type: "number", required: true, default: 0 },
      { description: "term b", names: ["b"], type: "number", required: true, default: 0 }
    ],
    call: (ctx, args) => Math.min(...args.map(arg => Number(arg)))
  },
  "max": {
    description: "returns the greater of 2 arguments 'a' and 'b'",
    argDefs: [
      { description: "term a", names: ["a"], type: "number", required: true, default: 0 },
      { description: "term b", names: ["b"], type: "number", required: true, default: 0 }
    ],
    call: (ctx, args) => Math.max(...args.map(arg => Number(arg)))
  },
  "abs": {
    description: "returns absolute value of 'v'",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.abs(Number(args[0]))
  },
  "round": {
    description: "returns 'v' rounded to precision 'p' decimal places (default 0)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
      { description: "precision", names: ["p"], type: "number", required: false, default: 0 }
    ],
    call: (ctx, args) => toFixedNumber(Number(args[0]), Number(args[1]))
  },
  "floor": {
    description: "returns 'v' rounded down to precision 'p' decimal places (default 0)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
      { description: "precision", names: ["p"], type: "number", required: false, default: 0 }
    ],
    call: (ctx, args) => toFixedFloor(Number(args[0]), Number(args[1]))
  },
  "ceil": {
    description: "returns 'v' rounded up to precision 'p' decimal places (default 0)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
      { description: "precision", names: ["p"], type: "number", required: false, default: 0 }
    ],
    call: (ctx, args) => toFixedCeil(Number(args[0]), Number(args[1]))
  },
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

  /////////////////////
  // Oscillators
  /////////////////////
  "sin": {
    description: "returns position on a sine wave",
    argDefs: oscillatorArgs,
    call: (ctx, args) => oscillator("sin", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "sq": {
    description: "returns position on a square wave",
    argDefs: oscillatorArgs,
    call: (ctx, args) => oscillator("sq", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "saw": {
    description: "returns position on a sawtooth wave",
    argDefs: oscillatorArgs,
    call: (ctx, args) => oscillator("saw", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "tri": {
    description: "returns position on a triangle wave",
    argDefs: oscillatorArgs,
    call: (ctx, args) => oscillator("tri", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },
  "pulse": {
    description: "returns position on a pulse wave",
    argDefs: oscillatorArgs,
    call: (ctx, args) => oscillator("pulse", Number(args[0]), Number(args[1]), Number(args[2]),
      Number(args[3]), Number(args[4]), Number(args[5]), ctx)
  },

  /////////////////////
  // conversion
  /////////////////////  
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
  }, "posneg": {
    description: "Weight term, and move to positive prompt if weigth is positive, negative prompt otherwise.",
    argDefs: [
      { description: "term", names: ["term", "t"], type: "string", required: true, default: "" },
      { description: "weight", names: ["weight", "w"], type: "number", required: true, default: 1 },
      { description: "positive prompt weight override", names: ["posweight", "pw"], type: "number", required: false, default: NaN },
      { description: "negative prompt weight override", names: ["negweight", "nw"], type: "number", required: false, default: NaN }

    ],
    call: (ctx, args) => {
      const [term, weight, pweight, nweight]  = [String(args[0]), Number(args[1]), Number(args[2]), Number(args[3])];

      if (ctx.promptType === undefined) {
        throw new Error("posneg() can only be used in a prompt.");
      }

      return posNegHelper(term, weight, pweight, nweight, ctx.promptType, '(', ')');      
    }
  },

  "posneg_lora": {
    description: "Weight lora, and move to positive prompt if weigth is positive, negative prompt otherwise.",
    argDefs: [
      { description: "lora", names: ["term", "t"], type: "string", required: true, default: "" },
      { description: "weight", names: ["weight", "w"], type: "number", required: true, default: 1 },
      { description: "positive prompt weight override", names: ["posweight", "pw"], type: "number", required: false, default: NaN },
      { description: "negative prompt weight override", names: ["negweight", "nw"], type: "number", required: false, default: NaN }

    ],
    call: (ctx, args) => {
      const [term, weight, pweight, nweight]  = [String(args[0]), Number(args[1]), Number(args[2]), Number(args[3])];

      if (ctx.promptType === undefined) {
        throw new Error("posneg() can only be used in a prompt.");
      }

      return posNegHelper(term, weight, pweight, nweight, ctx.promptType, '<lora:', '>');      
    }
  },  

  /////////////////////
  // Info matching
  /////////////////////
  "info_match": {
    description: "Returns 1 if the info label of the current active keyframe matches the supplied regex, 0 otherwise.",
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
  "info_match_last": { //should be info_match_prev :(
    description: "Returns the frame number of the last keyframe that matched the regex, or -1 if none.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const lastMatch = ctx.allKeyframes
        .findLast((kf: { frame: number, info?: string }) => kf.frame <= ctx.frame && kf.info?.match(pattern))
      return lastMatch ? lastMatch.frame : -1;
    }
  },
  "info_match_next": {
    description: "Returns the frame number of the next keyframe that matched the regex, or -1 if none.",
    argDefs: [
      { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" }
    ],
    call: (ctx, args) => {
      const pattern = String(args[0]);
      const lastMatch = ctx.allKeyframes
        .find((kf: { frame: number, info?: string }) => kf.frame > ctx.frame && kf.info?.match(pattern))
      return lastMatch ? lastMatch.frame : -1;
    }
  },

}



// function FunctionCallFactory(start: InputLocation, end: InputLocation, args: ParseqAstNode[], name: string): FunctionCallAst {
// }

function getNextKeyframe(ctx: InvocationContext): number {
  // TODO this can be simplified. We can just find the first frame that is greater than the current frame
  // in definedFrames. But need some more tests before messing with this.
  const idx = ctx.definedFrames.findIndex(v => v > ctx.frame);
  const pos = idx !== -1 ? ctx.definedFrames[idx] : ctx.definedFrames.at(-1);
  if (pos === undefined) {
    throw new Error("No next keyframe. Unexpected failure, please report a bug.");
  }
  return pos;
}

function getActiveKeyframeValue(ctx: InvocationContext): number {
  const idx = ctx.definedFrames.findLastIndex(v => v <= ctx.frame);
  const val = idx !== -1 ? ctx.definedValues[idx] : ctx.definedValues.at(0);
  if (val === undefined) {
    throw new Error("No active keyframe. Unexpected failure, please report a bug.");
  }
  return val;
}

function getNextKeyframeValue(ctx: InvocationContext): number {
  const idx = ctx.definedFrames.findIndex(v => v > ctx.frame);
  const val = idx !== -1 ? ctx.definedValues[idx] : ctx.definedValues.at(-1) || NaN;
  if (val === undefined) {
    throw new Error("No next keyframe. Unexpected failure, please report a bug.");
  }
  return val;
}

function linearInterpolation(definedFrames: number[], definedValues: number[], frame: number) {
  return linear(frame, definedFrames, definedValues)[0];
}

function cubicSplineInterpolation(definedFrames: number[], definedValues: number[], frame: number) {
  // TODO: this is expensive and we recompute it unnecessarily. Consider caching the spline.
  // We don't currently have a natural scope/context in which to cache it. Consider adding one in next refactor.
  const spline = new Spline(definedFrames, definedValues);
  return spline.at(frame);
}

function polyInterpolation(definedFrames: number[], definedValues: number[], frame: number) {
  return polynomial(frame, definedFrames, definedValues)[0];
}

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

type oscillatorType = 'sin' | 'tri' | 'saw' | 'sq' | 'pulse';

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

function posNegHelper(term : string, weight : number, pweight : number, nweight : number, promptType : boolean, prefix:string, suffix:string) {
  
  const moveNegToPos = !promptType && weight < 0;
  const movePosToNeg = promptType && weight < 0;

  let canonicalWeight;
  if (moveNegToPos) {
    canonicalWeight = !isNaN(pweight) ?  pweight : Math.abs(weight);
  } else if (movePosToNeg) {
    canonicalWeight = !isNaN(nweight) ?  nweight : Math.abs(weight);
  } else if (promptType) {
    canonicalWeight = !isNaN(pweight) ?  pweight : Math.abs(weight);
  } else {
    canonicalWeight = !isNaN(nweight) ?  nweight : Math.abs(weight);
  }
   
  const weightedTerm = `${prefix}${term}:${canonicalWeight.toFixed(4)}${suffix}`;

  if (moveNegToPos||movePosToNeg) {
    return `__PARSEQ_MOVE__${weightedTerm}__PARSEQ_END_MOVE__`
  } else  {
    return weightedTerm
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

