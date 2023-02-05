import { render, screen } from '@testing-library/react';
import App from './App';
//@ts-ignore
import { defaultInterpolation, interpret, InterpreterContext, parse } from './parseq-lang-interpreter';

const basicContext =  {
  definedVariables: {},
  definedFrames: [0,5,10],
  definedValues: [5,0,10],
  fieldName: 'test',
  BPM: 140,
  FPS: 30,
};

const runParseq = (formula: string) => {
  var activeKeyframe = 0;
  return [ ...Array(11).keys() ].map((i) => 
    {
      activeKeyframe = basicContext.definedFrames.includes(i) ? i : activeKeyframe;
      return interpret(parse(formula), {
        ...basicContext,
        activeKeyframe,
      })(i)
    });
}

const runTest = (label:string, formula: string, expected: number[]) => {
  const testTag = label + ': ' + formula;
  test(testTag, () => {
    const results = runParseq(formula);
    expect(JSON.stringify(results))
      .toEqual(JSON.stringify(expected));
  });
}


runTest('built-in', 'L', [5,4,3,2,1,0,2,4,6,8,10]);
runTest('built-in', 'S', [5,5,5,5,5,0,0,0,0,0,10]);
runTest('built-in', 'round(C,2)', [5,3.28,1.74,0.56,-0.08,0,0.92,2.56,4.74,7.28,10]);
runTest('built-in', 'P', [5,2.8,1.2,0.2,-0.2,0,0.8,2.2,4.2,6.8,10]);
runTest('built-in', 'f', [0,1,2,3,4,5,6,7,8,9,10]);
runTest('built-in', 'k', [0,1,2,3,4,0,1,2,3,4,0]);
runTest('built-in', 'active_keyframe', [0,0,0,0,0,5,5,5,5,5,10]);
runTest('built-in', 'next_keyframe', [5,5,5,5,5,10,10,10,10,10,10]);
runTest('built-in', 'active_keyframe_value', [5,5,5,5,5,0,0,0,0,0,10]);
runTest('built-in', 'next_keyframe_value', [0,0,0,0,0,10,10,10,10,10,10]);

runTest('units', '1f', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('units', '1s', [30,30,30,30,30,30,30,30,30,30,30]);
runTest('units', '1b', [12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858,12.857142857142858]);

runTest('negation', '-1', [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]);
runTest('negation', '-f', [-0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10]);
runTest('negation', '-(2*f)', [-0,-2,-4,-6,-8,-10,-12,-14,-16,-18,-20]);

runTest('sin-unnamed-args', 'round(sin(10),2)', [0,0.59,0.95,0.95,0.59,0,-0.59,-0.95,-0.95,-0.59,-0]);
runTest('sin-unnamed-args', 'round(sin(10, 1),2)', [0.59,0.95,0.95,0.59,0,-0.59,-0.95,-0.95,-0.59, -0, 0.59]); //phase shift
runTest('sin-unnamed-args', 'round(sin(10, 1, 2),2)', [1.18,1.9,1.9,1.18, 0,-1.18,-1.9,-1.9,-1.18, -0,1.18]); //amplitude
runTest('sin-unnamed-args', 'round(sin(10, 1, 2, 10),2)', [11.18,11.9,11.9,11.18,10,8.82,8.1,8.1,8.82,10,11.18]); //centre
runTest('sin-unnamed-args', 'round(sin(5, 1, 2, 10, 0.5),2)', [11.9,11.18,8.82,0,0,11.9,11.18,8.82,0,0,11.9]); // fractional limit
runTest('sin-unnamed-args', 'round(sin(5, 1, 2, 10, 0.5, 99),2)', [11.9,11.18,8.82,0,0,11.9,11.18,8.82,0,0,11.9]);  //pulse should be ignored

runTest('sq-unnamed-args', 'round(sq(10),2)', [1,1,1,1,1,1,-1,-1,-1,-1,-1]);
runTest('sq-unnamed-args', 'round(sq(10, 1),2)', [1,1,1,1,1,-1,-1,-1,-1,-1,1]);  //phase shift
runTest('sq-unnamed-args', 'round(sq(10, 1, 2),2)', [2,2,2,2,2,-2,-2,-2,-2,-2,2]); //amplitude
runTest('sq-unnamed-args', 'round(sq(10, 1, 2, 10),2)', [12,12,12,12,12,8,8,8,8,8,12]); //centre
runTest('sq-unnamed-args', 'round(sq(5, 1, 2, 10, 0.5),2)', [12,12,8,0,0,12,12,8,0,0,12]); // fractional limit
runTest('sq-unnamed-args', 'round(sq(5, 1, 2, 10, 0.5, 99),2)', [12,12,8,0,0,12,12,8,0,0,12]);  //pulse should be ignored

runTest('tri-unnamed-args', 'round(tri(10),2)', [0,0.4,0.8,0.8,0.4,0,-0.4,-0.8,-0.8,-0.4,-0]);
runTest('tri-unnamed-args', 'round(tri(10, 1),2)', [0.4,0.8,0.8,0.4,0,-0.4,-0.8,-0.8,-0.4,0,0.4]);  //phase shift
runTest('tri-unnamed-args', 'round(tri(10, 1, 2),2)', [0.8,1.6,1.6,0.8,0,-0.8,-1.6,-1.6,-0.8,0,0.8]); //amplitude
runTest('tri-unnamed-args', 'round(tri(10, 1, 2, 10),2)', [10.8,11.6,11.6,10.8,10,9.2,8.4,8.4,9.2,10,10.8]); //centre
runTest('tri-unnamed-args', 'round(tri(5, 1, 2, 10, 0.5),2)', [11.6,10.8,9.2,0,0,11.6,10.8,9.2,0,0,11.6]); // fractional limit
runTest('tri-unnamed-args', 'round(tri(5, 1, 2, 10, 0.5, 99),2)', [11.6,10.8,9.2,0,0,11.6,10.8,9.2,0,0,11.6]);  //pulse should be ignored

runTest('saw-unnamed-args', 'round(saw(10),2)', [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0]);
runTest('saw-unnamed-args', 'round(saw(10, 1),2)', [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0,0.1]);  //phase shift
runTest('saw-unnamed-args', 'round(saw(10, 1, 2),2)', [0.2,0.4,0.6,0.8,1,1.2,1.4,1.6,1.8,0,0.2]); //amplitude
runTest('saw-unnamed-args', 'round(saw(10, 1, 2, 10),2)', [10.2,10.4,10.6,10.8,11,11.2,11.4,11.6,11.8,10,10.2]); //centre
runTest('saw-unnamed-args', 'round(saw(5, 1, 2, 10, 0.5),2)', [10.4,10.8,11.2,0,0,10.4,10.8,11.2,0,0,10.4]); // fractional limit
runTest('saw-unnamed-args', 'round(saw(5, 1, 2, 10, 0.5, 99),2)', [10.4,10.8,11.2,0,0,10.4,10.8,11.2,0,0,10.4]);  //pulse should be ignored


runTest('addition', '1+1', [2,2,2,2,2,2,2,2,2,2,2]);

runTest('precedence', '1+1*5', [6,6,6,6,6,6,6,6,6,6,6]);

