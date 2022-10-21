import nearley from 'nearley';
import grammar from './parseq-lang.js';
import {TextField, Button} from '@mui/material';
import { linear, polynomial, step } from 'everpolate';
import React, { useCallback, useState } from 'react';

const keyframes = [
  {frame: 0, denoise: 0.5},
  {frame: 50, denoise: 0.1},
  {frame: 99, denoise: 1}
]

const FPS = 20;
const BPM = 140;
const time_sig = '4/4';

function get_keyframes_interpolatable(field) {
  return {
    definedFrames: keyframes.map(kf => kf.frame),
    definedValues: keyframes.map(kf => kf[field])
  };
}

function linear_interpolation(field, frame) {
  let {definedFrames, definedValues} = get_keyframes_interpolatable(field);
  return linear(frame, definedFrames, definedValues);
}

function poly_interpolation(field, frame) {
  let {definedFrames, definedValues} = get_keyframes_interpolatable(field);
  return polynomial(frame, definedFrames, definedValues);
}

function step_interpolation(field, frame) {
  let {definedFrames, definedValues} = get_keyframes_interpolatable(field);
  return step(frame, definedFrames, definedValues);
}



// Evaluation of parsec interpolation lang
function interpret(ast, field) {
  switch (ast.type) {
    case 'var_reference':
      switch(ast.var_name.value) {
        case 'L':
          return f => linear_interpolation(field, f);
        case 'P':
          return f => poly_interpolation(field, f);
        case 'S':
          return f => step_interpolation(field,f);
        case 'f':
          return f => parseFloat(f);
        default:
          console.error(`Unrecognised variable ${ast.var_name.value} at ${ast.var_name.start.line}:${ast.var_name.start.col}`)
          return null;
      }
    case 'number_literal':
      return f => ast.value
    case 'number_with_unit':
      switch (ast.right.value) {
        case 'f':
          return f => interpret(ast.left, field);
        case 's':
          return f => interpret(ast.left, field);
        case 's':
          return f => interpret(ast.left, field);
        default:
          console.error(`Unrecognised conversion unit ${ast.right.value} at ${ast.right.start.line}:${ast.right.start.col}`)

      }
    // case 'sin':
    //   return f => {
    //     let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
    //     return centre + Math.sin((phase + parseFloat(f)) * Math.PI * 2 / period) * amp;
    //   };
    // case 'sq':
    //   return f => {
    //     let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
    //     return centre + (Math.sin((phase + parseFloat(f)) * Math.PI * 2 / period) >= 0 ? 1 : -1) * amp;
    //   };
    // case 'tri':
    //   return f => {
    //     let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
    //     return centre + Math.asin(Math.sin((phase + parseFloat(f)) * Math.PI * 2 / period)) * (2 * amp) / Math.PI;
    //   };
    // case 'saw':
    //   return f => {
    //     let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
    //     return centre + ((phase + parseFloat(f)) % period) * amp / period
    //   };
    // case 'min':
    //     return f => {
    //       let [left, right] = ast.operands.map(op => interpret(op, allInterps, field)()) 
    //       return Math.min(left,right)
    //     };
    // case 'max':
    //   return f => {
    //     let [left, right] = ast.operands.map(op => interpret(op, allInterps, field)()) 
    //     return Math.max(left,right)
    //   }          
    // case 'sum':
    //   return f => interpret(ast.leftOperand, allInterps, field)(f) + interpret(ast.rightOperand, allInterps, field)(f)
    // case 'sub':
    //   return f => interpret(ast.leftOperand, allInterps, field)(f) - interpret(ast.rightOperand, allInterps, field)(f)
    // case 'mul':
    //   return f => interpret(ast.leftOperand, allInterps, field)(f) * interpret(ast.rightOperand, allInterps, field)(f)
    // case 'div':
    //   return f => interpret(ast.leftOperand, allInterps, field)(f) / interpret(ast.rightOperand, allInterps, field)(f)

    default:
      console.error(`Unrecognised expression ${ast.type} at ${ast.start.line}:${ast.start.col}`)
      return null
  }
}


const Interpreter = () => {

  const [output, setOutput] = useState();
  var input;

  const handleChangeInput = useCallback((e) => {
    input = e.target.value;
    console.log(`Received: ${input}`);
  }, []);

  const handleSubmit = useCallback((e) => {
    setOutput(`Parsing: ${input}`);
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    try {       
      parser.feed(input);
    } catch(error){
        setOutput(`${output}\n\n${error}`);    
        console.error(error);
        return
    }
    var parsed = parser.results[0][0];
    
    setOutput(`${output}\n\nInterpreting: ${input}`);    
    
    const frameFetcher = interpret(parsed, "denoise")
    if (!frameFetcher) {
      setOutput(`${output}\n\nFailed, see console.`);    
      return;
    }

    // TODO handle parse errors

    let output_text = "Output:\n"
    for (let frame=0; frame<100; frame++) {
      console.log(frameFetcher(frame))
      output_text += `${frame}: ${frameFetcher(frame)}\n`
    }

    setOutput(`${output}\n\nRESULT:\n\n${output_text}`);
  }, []);

  return (<div >
    <TextField
      fullWidth
      id={"input"}
      label={"input"}
      multiline
      rows={4}
      style={{margin: '10px' }}
      InputProps={{ style: { fontFamily: 'Monospace' } }}
      onChange={handleChangeInput}
      variant="standard" />
    <Button variant="contained" style={{ marginRight: 10}} onClick={handleSubmit}>Interpret</Button>
    <TextField
      fullWidth
      id={"output"}
      label={"Output"}
      value={output}
      multiline
      rows={100}
      style={{margin: '10px' }}
      InputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
      variant="filled" />
</div>

  )
}

export default Interpreter;