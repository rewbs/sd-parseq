import nearley from 'nearley';
import getGrammar from './parseq-lang.js';
import { linear, polynomial, step } from 'everpolate';
import Spline from 'cubic-spline';


export function defaultInterpolation(definedFrames, definedValues, frame) {
  return linear_interpolation(definedFrames, definedValues, frame);
}

function linear_interpolation(definedFrames, definedValues, frame) {
  return linear(frame, definedFrames, definedValues)[0];
}

function cubic_spline_interpolation(definedFrames, definedValues, frame) {
  const spline = new Spline(definedFrames, definedValues);
  return spline.at(frame);
}

function poly_interpolation(definedFrames, definedValues, frame) {
  return polynomial(frame, definedFrames, definedValues)[0];
}

function step_interpolation(definedFrames, definedValues, frame) {
  return step(frame, definedFrames, definedValues)[0];
}

export class InterpreterContext {
  constructor (context) {
    this.fieldName = context.fieldName;
    this.definedFrames = context.definedFrames;
    this.definedValues = context.definedValues;
    this.FPS = context.FPS;
    this.BPM = context.BPM;
  }
}

export function parse(input) {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(getGrammar()));
    const parsed = parser.feed(input);
    return parsed.results[0][0];
}

// Evaluation of parseq lang
// Returns: a function that takes a frame number and returns a float value
export function interpret(ast, context) {
  //console.log("Interpreting: ", ast, context);

  if (typeof ast === 'number') {
    // Node was interpreted down to a constant.
    return _ => ast
  }

  // TODO rewrite in Typescript to avoid this manual type checking nonsense.
  if (context === "undefined"
    || context.fieldName === "undefined"
    || context.thisKf === "undefined"
    || context.definedFrames === "undefined"
    || context.definedValues === "undefined") {
    throw new Error(`Invalid context when interpreting ${ast}: ${context}`);
  }

  // TODO replace this with proper polymorphic evaluatable AST nodes
  switch (ast.type) {
    case 'number_literal':
      return _ => ast.value;
    case 'var_reference':
      switch(ast.var_name.value) {
        case 'L':
          return f => linear_interpolation(context.definedFrames, context.definedValues, f);
        case 'P':
          return f => poly_interpolation(context.definedFrames, context.definedValues, f);
        case 'S':
          return f => step_interpolation(context.definedFrames, context.definedValues, f);
        case 'C':
          return f => cubic_spline_interpolation(context.definedFrames, context.definedValues, f);
        case 'f':
          return f => f;
        default:
          throw new Error(`Unrecognised variable ${ast.var_name.value} at ${ast.var_name.start.line}:${ast.var_name.start.col}`);
      }
    case 'number_with_unit':
      switch (ast.right.value) {
        case 'f':
          return f => interpret(ast.left, context)(f);
        case 's':
          return f => interpret(ast.left, context)(f) * context.FPS;
        case 'b':
          return f => interpret(ast.left, context)(f) * (context.FPS*60)/context.BPM
        default:
          throw new Error(`Unrecognised conversion unit ${ast.right.value} at ${ast.right.start.line}:${ast.right.start.col}`);
      }
    case 'negation':
      let term = interpret(ast.value, context)
      return f => - term(f);   
    case 'call_expression_named_args':
      switch(ast.fun_name.value) {
        case 'sin': 
        case 'sq':          
        case 'tri':          
        case 'saw':
        case 'pulse':
          let [period, phase, amp, centre, pulse] = get_waveform_arguments(ast.arguments).map(arg => interpret(arg, context));
          return f => wave(ast.fun_name.value, period(f), phase(f)+f, amp(f), centre(f), pulse(f));
        case 'min':
          let l1 = interpret(named_argument_extractor(ast.arguments, ['left', 'l'], null), context);
          let r1 = interpret(named_argument_extractor(ast.arguments, ['right', 'r'], null), context);          
          return f => Math.min(l1(f), r1(f)) 
        case 'max':  
          let l2 = interpret(named_argument_extractor(ast.arguments, ['left', 'l'], null), context);          
          let r2 =interpret( named_argument_extractor(ast.arguments, ['right', 'r'], null), context);           
          return f => Math.max(l2(f), r2(f))
        default:
          throw new Error(`Unrecognised function ${ast.fun_name.value} at ${ast.right.start.line}:${ast.right.start.col}`);
      }
      case 'call_expression':
        switch(ast.fun_name.value) {
          case 'sin': 
          case 'sq':          
          case 'tri':          
          case 'saw':
          case 'pulse':  
            let [period, phase = _ => 0, amp = _ => 1, centre = _ => 0, pulse = _ => 5] = ast.arguments.map(arg => interpret(arg, context));
            return f => wave(ast.fun_name.value, period(f), phase(f)+f, amp(f), centre(f), pulse(f))
          case 'min':
            return f => Math.min(interpret(ast.arguments[0], context)(f), interpret(ast.arguments[1], context)(f));
          case 'max':  
            return f => Math.max(interpret(ast.arguments[0], context)(f), interpret(ast.arguments[1], context)(f));
          default:
            throw new Error(`Unrecognised function ${ast.fun_name.value} at ${ast.right.start.line}:${ast.right.start.col}`);
        }      
    case "binary_operation":
      let left = interpret(ast.left, context);
      let right = interpret(ast.right, context);
      switch (ast.operator.value) {
        case '+': return f => left(f)+right(f)
        case '-': return f => left(f)-right(f)
        case '*': return f => left(f)*right(f)
        case '/': return f => left(f)/right(f)
        case '%': return f => left(f)%right(f)        
        default: throw new Error(`Unrecognised operator ${ast.operator.value} at ${ast.right.start.line}:${ast.right.start.col}`);
      }
    default:
      throw new Error(`Unrecognised expression ${ast.type} at ${ast.start.line}:${ast.start.col}`);
  }
}

function wave(wave, period, pos, amp, centre, pulsewidth) {
  switch(wave) {
    case 'sin': return centre + Math.sin(pos * Math.PI * 2 / period) * amp;
    case 'tri': return centre + Math.asin(Math.sin(pos * Math.PI * 2 / period)) * (2 * amp) / Math.PI;
    case 'saw': return centre + (pos % period) * amp / period
    case 'sq':  return centre + (Math.sin(pos * Math.PI * 2 / period) >= 0 ? 1 : -1) * amp;    
    case 'pulse':  return centre + amp *((pos%period) < pulsewidth ? 1 : 0);
    default:  throw new Error(`Unrecognised waveform ${wave}`);
  }
  
} 

function named_argument_extractor(args, argNames, defaultValue) {
    let matchingArgs = args.filter( arg => argNames.includes(arg.name.value));
    if (matchingArgs.length === 0) {
      if (defaultValue != null) {
        return defaultValue;
      } else {
        throw new Error(`Mandatory argument missing: ${argNames.join(' or ')}`);
      }
    } else if (matchingArgs.length > 1) {
      throw new Error(`Cannot have multiple arguments called: ${argNames}`);
    } else {
      return matchingArgs[0].value;
    }  
  }

function get_waveform_arguments(args) {
  return [
    named_argument_extractor(args, ['period', 'p'], null),
    named_argument_extractor(args, ['phase', 'ps'],  0),
    named_argument_extractor(args, ['amp', 'a'],  1),
    named_argument_extractor(args, ['centre', 'c'], 0),
    named_argument_extractor(args, ['pulsewidth', 'pulse', 'pw'], 5)
  ]
}

