import { toFixedNumber, toFixedFloor, toFixedCeil } from "../utils/maths";
import { ParseqFunction } from "./parseq-lang-functions";

const functionLibrary: { [key: string]: ParseqFunction } = {
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
  
  //////
  // Raw maths
  /////
  "_sin": {
    description: "Equivalent to Math.sin(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.sin(Number(args[0]))
  },
  "_cos": {
    description: "Equivalent to Math.cos(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.cos(Number(args[0]))
  },
  "_tan": {
    description: "Equivalent to Math.tan(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.tan(Number(args[0]))
  },
  "_asin": {
    description: "Equivalent to Math.asin(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.asin(Number(args[0]))
  },
  "_acos": {
    description: "Equivalent to Math.acos(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.acos(Number(args[0]))
  },
  "_atan": {
    description: "Equivalent to Math.atan(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.atan(Number(args[0]))
  },
  "_log": {
    description: "Equivalent to Math.log(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.log(Number(args[0]))
  },
  "_exp": {
    description: "Equivalent to Math.exp(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.exp(Number(args[0]))
  },
  "_sqrt": {
    description: "Equivalent to Math.sqrt(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.sqrt(Number(args[0]))
  },
  "_cbrt": {
    description: "Equivalent to Math.cbrt(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.cbrt(Number(args[0]))
  },
  "_clz32": {
    description: "Equivalent to Math.clz32(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.clz32(Number(args[0]))
  },
  "_expm1": {
    description: "Equivalent to Math.expm1(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.expm1(Number(args[0]))
  },
  "_log1p": {
    description: "Equivalent to Math.log1p(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.log1p(Number(args[0]))
  },
  "_log10": {
    description: "Equivalent to Math.log10(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.log10(Number(args[0]))
  },
  "_log2": {
    description: "Equivalent to Math.log2(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.log2(Number(args[0]))
  },
  "_sign": {
    description: "Equivalent to Math.sign(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.sign(Number(args[0]))
  },
  "_sinh": {
    description: "Equivalent to Math.sinh(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.sinh(Number(args[0]))
  },
  "_cosh": {
    description: "Equivalent to Math.cosh(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.cosh(Number(args[0]))
  },
  "_tanh": {
    description: "Equivalent to Math.tanh(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.tanh(Number(args[0]))
  },
  "_asinh": {
    description: "Equivalent to Math.asinh(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.asinh(Number(args[0]))
  },
  "_acosh": {
    description: "Equivalent to Math.acosh(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.acosh(Number(args[0]))
  },
  "_atanh": {
    description: "Equivalent to Math.atanh(v)",
    argDefs: [
      { description: "value", names: ["v"], type: "number", required: true, default: 0 },
    ],
    call: (ctx, args) => Math.atanh(Number(args[0]))
  },

}

export default functionLibrary;