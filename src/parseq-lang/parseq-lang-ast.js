"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnnamedArgAst = exports.NamedArgAst = exports.FunctionCallAst = exports.IfAst = exports.BinaryOpAst = exports.VariableReferenceAst = exports.NumberWithUnitAst = exports.NegationAst = exports.BooleanLiteralAst = exports.StringLiteralAst = exports.NumberLiteralAst = exports.ParseqAstNode = void 0;
//@ts-ignore
const everpolate_1 = require("everpolate");
//@ts-ignore
const cubic_spline_1 = __importDefault(require("cubic-spline"));
const bezier_easing_1 = __importDefault(require("bezier-easing"));
const maths_1 = require("../utils/maths");
class ParseqAstNode {
    constructor(start, end, children, value) {
        this.start = start;
        this.end = end;
        this.children = children;
        this.value = value;
        // TODO - fix all cases where nodes have missing position info.
        if (!start) {
            start = { line: undefined, col: undefined };
        }
        if (!end) {
            start = { line: undefined, col: undefined };
        }
    }
    debug() {
        const currentNode = `${this.constructor.name}:{${this.value ?? ''}} (${this.start?.line}:${this.start?.col}->${this.end?.line}:${this.end?.col})`;
        if (this.children.length > 0) {
            const children = this.children.flatMap(child => child.debug ? child.debug() : child);
            return [currentNode, children];
        }
        else {
            return currentNode;
        }
    }
}
exports.ParseqAstNode = ParseqAstNode;
class NumberLiteralAst extends ParseqAstNode {
    invoke(ctx) {
        return Number(this.value ?? 0);
    }
}
exports.NumberLiteralAst = NumberLiteralAst;
class StringLiteralAst extends ParseqAstNode {
    invoke(ctx) {
        return String(this.value ?? '');
    }
}
exports.StringLiteralAst = StringLiteralAst;
class BooleanLiteralAst extends ParseqAstNode {
    invoke(ctx) {
        return this.value ? 1 : 0;
    }
}
exports.BooleanLiteralAst = BooleanLiteralAst;
class NegationAst extends ParseqAstNode {
    invoke(ctx) {
        const negatable = this.children[0].invoke(ctx);
        if (typeof negatable === 'string') {
            return "-" + negatable;
        }
        else {
            return -negatable;
        }
    }
}
exports.NegationAst = NegationAst;
class NumberWithUnitAst extends ParseqAstNode {
    invoke(ctx) {
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
exports.NumberWithUnitAst = NumberWithUnitAst;
class VariableReferenceAst extends ParseqAstNode {
    constructor() {
        super(...arguments);
        this.variableName = String(this.value);
    }
    invoke(ctx) {
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
                return (0, maths_1.frameToBeat)(ctx.frame, ctx.FPS, ctx.BPM);
            case 's':
                return (0, maths_1.frameToSec)(ctx.frame, ctx.FPS);
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
            default:
                if (this.variableName && ctx.variableMap.has(this.variableName)) {
                    return ctx.variableMap.get(this.variableName) ?? 0;
                }
                else {
                    throw new Error(`Unrecognised variable ${this.variableName} at ${this.start?.line}:${this.start?.col}`);
                }
        }
    }
}
exports.VariableReferenceAst = VariableReferenceAst;
class BinaryOpAst extends ParseqAstNode {
    constructor() {
        super(...arguments);
        this.leftNode = this.children[0];
        this.rightNode = this.children[1];
    }
    invoke(ctx) {
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
                //@ts-ignore - fall back to JS type juggling.
                return left / right;
            case '%':
                //@ts-ignore - fall back to JS type juggling.
                return left % right;
            case '^':
                //@ts-ignore - fall back to JS type juggling.
                return left ** right;
            case '==':
                return left == right ? 1 : 0;
            case '!=':
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
exports.BinaryOpAst = BinaryOpAst;
class IfAst extends ParseqAstNode {
    constructor() {
        super(...arguments);
        this.conditionNode = this.children[0];
        this.consequentNode = this.children[1];
        this.alternateNode = this.children[2] || null;
    }
    invoke(ctx) {
        //@ts-ignore - fall back to JS type juggling.
        if (this.conditionNode.invoke(ctx) > 0) {
            return this.consequentNode.invoke(ctx);
        }
        else if (this.alternateNode) {
            return this.alternateNode.invoke(ctx);
        }
        else {
            return 0;
        }
    }
}
exports.IfAst = IfAst;
class FunctionCallAst extends ParseqAstNode {
    constructor(start, end, children, value) {
        super(start, end, children, value);
        this.start = start;
        this.end = end;
        this.children = children;
        this.value = value;
        this.evaluateArgs = (ctx) => {
            // Evaluate arguments in order of definition (checking type before returning)
            return this.funcDef.argDefs.map((argDef, idx) => {
                const argNode = this.isNamedArgs() ?
                    this.children.find(child => argDef.names.includes(child.getName()))
                    : this.children[idx];
                if (argNode) {
                    const argVal = argNode.invoke(ctx);
                    if (typeof argVal !== argDef.type) {
                        throw new Error(`Invalid argument type for argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'. Expected type '${argDef.type}', got '${typeof argVal}'`);
                    }
                    else {
                        return argVal;
                    }
                }
                else {
                    if (argDef.required) {
                        throw new Error(`Missing required argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'`);
                    }
                    else {
                        if (typeof argDef.default === 'function') {
                            return argDef.default(ctx);
                        }
                        else {
                            return argDef.default;
                        }
                    }
                }
            });
        };
        this.funcDef = functionLibrary[value];
    }
    isNamedArgs() {
        // All arguments are either named or unnamed, you can't mix & match (enforced by grammar).
        // So it's sufficient to check the first arg.
        return this.children.length > 0 && this.children[0] instanceof NamedArgAst;
    }
    invoke(ctx) {
        this.validateArgs();
        const args = this.evaluateArgs(ctx);
        return this.funcDef.call(ctx, args);
    }
    validateArgs() {
        // Check that all required args are present
        const requiredArgs = this.funcDef.argDefs.filter(arg => arg.required);
        const missingArgs = this.isNamedArgs() ?
            requiredArgs.some(arg => arg.names.every(name => !this.children.some(child => child.getName() === name)))
            : this.children.length < requiredArgs.length;
        if (missingArgs) {
            throw new Error(`Missing required argument(s) for function '${this.value} (${this.funcDef.description})'. Required arguments: ${requiredArgs.map(arg => arg.names.join('/')).join(', ')}`);
        }
        // Check that all args are known
        let extraArgs;
        if (this.isNamedArgs()) {
            const extraArgNames = this.children.map(child => child.getName())
                .filter(name => !this.funcDef.argDefs.some(arg => arg.names.includes(name)));
            extraArgs = {
                extras: extraArgNames.length,
                names: extraArgNames
            };
        }
        else {
            extraArgs = {
                extras: this.children.length - this.funcDef.argDefs.length,
                names: []
            };
        }
        if (extraArgs.names.length > 0) {
            throw new Error(`Unrecognised argument(s) for function '${this.value} (${this.funcDef.description})': ${extraArgs.names.join(', ')}. Supported arguments: ${this.funcDef.argDefs.map(arg => arg.names.join('/')).join(', ')}`);
        }
        else if (extraArgs.extras > 0) {
            throw new Error(`Too many arguments for function '${this.value} (${this.funcDef.description})'. Expected ${this.funcDef.argDefs.length} arguments, got ${this.children.length}`);
        }
        // Check that no duplicate args are present
        if (this.isNamedArgs()) {
            const duplicateArgNames = this.funcDef.argDefs.filter(arg => this.children.filter(child => arg.names.includes(child.getName())).length > 1)
                .map(arg => arg.names.join('/'));
            if (duplicateArgNames.length > 0) {
                throw new Error(`Duplicate arguments for function '${this.value} (${this.funcDef.description})': ${duplicateArgNames.join(', ')}`);
            }
        }
    }
}
exports.FunctionCallAst = FunctionCallAst;
class NamedArgAst extends ParseqAstNode {
    getName() {
        return this.value ?? '';
    }
    invoke(ctx) {
        return this.children[0].invoke(ctx);
    }
}
exports.NamedArgAst = NamedArgAst;
class UnnamedArgAst extends ParseqAstNode {
    invoke(ctx) {
        return this.children[0].invoke(ctx);
    }
}
exports.UnnamedArgAst = UnnamedArgAst;
const oscillatorArgs = [
    { description: "period", names: ["period", "p"], type: "number", required: true, default: 0 },
    { description: "phase shift", names: ["phase", "ps"], type: "number", required: false, default: 0 },
    { description: "amplitude", names: ["amp", "a"], type: "number", required: false, default: 1 },
    { description: "centre", names: ["centre", "c"], type: "number", required: false, default: 0 },
    { description: "limit: number of periods to repeat", names: ["limit", "li"], type: "number", required: false, default: 0 },
    { description: "pulse width", names: ["pulse", "pw"], type: "number", required: false, default: 5 },
];
const functionLibrary = {
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
        call: (ctx, args) => (0, maths_1.toFixedNumber)(Number(args[0]), Number(args[1]))
    },
    "floor": {
        description: "returns 'v' rounded down to precision 'p' decimal places (default 0)",
        argDefs: [
            { description: "value", names: ["v"], type: "number", required: true, default: 0 },
            { description: "precision", names: ["p"], type: "number", required: false, default: 0 }
        ],
        call: (ctx, args) => (0, maths_1.toFixedFloor)(Number(args[0]), Number(args[1]))
    },
    "ceil": {
        description: "returns 'v' rounded up to precision 'p' decimal places (default 0)",
        argDefs: [
            { description: "value", names: ["v"], type: "number", required: true, default: 0 },
            { description: "precision", names: ["p"], type: "number", required: false, default: 0 }
        ],
        call: (ctx, args) => (0, maths_1.toFixedCeil)(Number(args[0]), Number(args[1]))
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
        ],
        call: (ctx, args) => bezier(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]), Number(args[6]), ctx)
    },
    "slide": {
        description: "returns position on a linear slide with configurable starting and ending points.",
        argDefs: [
            { description: "start y", names: ["from", "start", "s"], type: "number", required: false, default: (ctx) => getActiveKeyframeValue(ctx) },
            { description: "end y", names: ["to", "end", "t"], type: "number", required: false, default: (ctx) => getNextKeyframeValue(ctx) },
            { description: "duration in frames (span)", names: ["span", "in", "s"], type: "number", required: false, default: (ctx) => getNextKeyframe(ctx) - ctx.activeKeyframe }
        ],
        call: (ctx, args) => slide(Number(args[0]), Number(args[1]), Number(args[2]), ctx)
    },
    /////////////////////
    // Oscillators
    /////////////////////
    "sin": {
        description: "returns position on a sine wave",
        argDefs: oscillatorArgs,
        call: (ctx, args) => oscillator("sin", Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]), ctx)
    },
    "sq": {
        description: "returns position on a square wave",
        argDefs: oscillatorArgs,
        call: (ctx, args) => oscillator("sq", Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]), ctx)
    },
    "saw": {
        description: "returns position on a sawtooth wave",
        argDefs: oscillatorArgs,
        call: (ctx, args) => oscillator("saw", Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]), ctx)
    },
    "tri": {
        description: "returns position on a triangle wave",
        argDefs: oscillatorArgs,
        call: (ctx, args) => oscillator("tri", Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]), ctx)
    },
    "pulse": {
        description: "returns position on a pulse wave",
        argDefs: oscillatorArgs,
        call: (ctx, args) => oscillator("pulse", Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]), ctx)
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
                .findLast((kf) => kf.frame <= ctx.frame);
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
                .length;
        }
    },
    "info_match_last": {
        description: "Returns the frame number of the last keyframe that matched the regex, or -1 if none.",
        argDefs: [
            { description: "regex", names: ["regex", "r"], type: "string", required: true, default: "" }
        ],
        call: (ctx, args) => {
            const pattern = String(args[0]);
            const lastMatch = ctx.allKeyframes
                .findLast((kf) => kf.frame <= ctx.frame && kf.info?.match(pattern));
            return lastMatch ? lastMatch.frame : -1;
        }
    },
};
// function FunctionCallFactory(start: InputLocation, end: InputLocation, args: ParseqAstNode[], name: string): FunctionCallAst {
// }
function getNextKeyframe(ctx) {
    // TODO this can be simplified. We can just find the first frame that is greater than the current frame
    // in definedFrames. But need some more tests before messing with this.
    const idx = ctx.definedFrames.findIndex(v => v > ctx.frame);
    const pos = idx !== -1 ? ctx.definedFrames[idx] : ctx.definedFrames.at(-1);
    if (pos === undefined) {
        throw new Error("No next keyframe. Unexpected failure, please report a bug.");
    }
    return pos;
}
function getActiveKeyframeValue(ctx) {
    const idx = ctx.definedFrames.findLastIndex(v => v <= ctx.frame);
    const val = idx !== -1 ? ctx.definedValues[idx] : ctx.definedValues.at(0);
    if (val === undefined) {
        throw new Error("No active keyframe. Unexpected failure, please report a bug.");
    }
    return val;
}
function getNextKeyframeValue(ctx) {
    const idx = ctx.definedFrames.findIndex(v => v > ctx.frame);
    const val = idx !== -1 ? ctx.definedValues[idx] : ctx.definedValues.at(-1) || NaN;
    if (val === undefined) {
        throw new Error("No next keyfram. Unexpected failure, please report a bug.");
    }
    return val;
}
function linearInterpolation(definedFrames, definedValues, frame) {
    return (0, everpolate_1.linear)(frame, definedFrames, definedValues)[0];
}
function cubicSplineInterpolation(definedFrames, definedValues, frame) {
    // TODO: this is expensive and we recompute it unnecessarily. Consider caching the spline.
    // We don't currently have a natural scope/context in which to cache it. Consider adding one in next refactor.
    const spline = new cubic_spline_1.default(definedFrames, definedValues);
    return spline.at(frame);
}
function polyInterpolation(definedFrames, definedValues, frame) {
    return (0, everpolate_1.polynomial)(frame, definedFrames, definedValues)[0];
}
function slide(from, to, over, ctx) {
    const x = ctx.frame - ctx.activeKeyframe;
    const start_y = from;
    const end_y = to;
    const range_x = over;
    if (range_x === 0) {
        return start_y;
    }
    else if (x >= range_x) {
        return end_y;
    }
    else {
        const slope = (end_y - start_y) / range_x;
        return start_y + slope * x;
    }
}
function bezier(x1, y1, x2, y2, from, to, over, ctx) {
    const start_x = ctx.activeKeyframe;
    const range_x = over;
    const start_y = from;
    const end_y = to;
    const range_y = end_y - start_y;
    const x = ctx.frame - start_x;
    if (range_x === 0) {
        return start_y;
    }
    else if (x >= range_x) {
        return end_y;
    }
    else {
        const bezier = (0, bezier_easing_1.default)(x1, y1, x2, y2);
        return start_y + bezier(x / range_x) * range_y;
    }
}
function oscillator(osc, period, phase, amp, centre, limit, pulsewidth, ctx) {
    if (limit > 0 && (ctx.frame - ctx.activeKeyframe) > limit * period) {
        return 0;
    }
    const pos = ctx.frame + phase;
    switch (osc) {
        case 'sin': return centre + Math.sin(pos * Math.PI * 2 / period) * amp;
        case 'tri': return centre + Math.asin(Math.sin(pos * Math.PI * 2 / period)) * (2 * amp) / Math.PI;
        case 'saw': return centre + (pos % period) * amp / period;
        case 'sq': return centre + (Math.sin(pos * Math.PI * 2 / period) >= 0 ? 1 : -1) * amp;
        case 'pulse': return centre + amp * ((pos % period) < pulsewidth ? 1 : 0);
    }
}
