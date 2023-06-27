//@ts-ignore
import { linear, polynomial } from 'everpolate';
//@ts-ignore
import Spline from 'cubic-spline';
import { frameToBeat, frameToSec } from '../utils/maths';
import { InterpolationType, TimeSeries } from './parseq-timeseries';
//@ts-ignore
import functionLibrary, { ParseqFunction } from './parseq-lang-functions';
import { ParseqRenderedFrames } from '../ParseqUI';

type InputLocation = {
  line: number | undefined;
  col: number | undefined;
}

////////////////////
// Invocation context - TODO convert to class
////////////////////

export type InvocationContext = {
  fieldName: string;
  activeKeyframe: number;
  activeNode?: ParseqAstNode;
  definedFrames: number[];
  definedValues: number[];
  computed_values: (number|string)[];
  allKeyframes: { //TODO - should be using ParseqKeyframe type
    frame: number,
    info?: string
  }[];
  FPS: number;
  BPM: number;
  variableMap: Map<string, number | string>;
  frame: number;
  timeSeries: [{
    alias: string;
    ts: TimeSeries;
  }] | [],
  promptType?: boolean;
  rendered_frames?: ParseqRenderedFrames;
}

export function getNextKeyframe(ctx: InvocationContext): number {
  // TODO this can be simplified. We can just find the first frame that is greater than the current frame
  // in definedFrames. But need some more tests before messing with this.
  const idx = ctx.definedFrames.findIndex(v => v > ctx.frame);
  const pos = idx !== -1 ? ctx.definedFrames[idx] : ctx.definedFrames.at(-1);
  if (pos === undefined) {
    throw new Error("No next keyframe. Unexpected failure, please report a bug.");
  }
  return pos;
}

export function getActiveKeyframeValue(ctx: InvocationContext): number {
  const idx = ctx.definedFrames.findLastIndex(v => v <= ctx.frame);
  const val = idx !== -1 ? ctx.definedValues[idx] : ctx.definedValues.at(0);
  if (val === undefined) {
    throw new Error("No active keyframe. Unexpected failure, please report a bug.");
  }
  return val;
}

export function getNextKeyframeValue(ctx: InvocationContext): number {
  const idx = ctx.definedFrames.findIndex(v => v > ctx.frame);
  const val = idx !== -1 ? ctx.definedValues[idx] : ctx.definedValues.at(-1) || NaN;
  if (val === undefined) {
    throw new Error("No next keyframe. Unexpected failure, please report a bug.");
  }
  return val;
}

////////////


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

  public getOrComputeState(key: string, compute: () => object): object | undefined {
    if (this.nodeState.has(key)) {
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
      case 'wb': // whole beat (beat without the fractional part)
        return Math.floor(frameToBeat(ctx.frame, ctx.FPS, ctx.BPM));
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
            return timeSeries.getValueAt(ctx.frame, ctx.FPS, InterpolationType.Step) ?? 0;
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
        if (right === 0) {
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