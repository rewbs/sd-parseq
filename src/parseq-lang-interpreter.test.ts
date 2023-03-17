//@ts-ignore
import { InvocationContext } from './parseq-lang/parseq-lang-ast';
import { interpret, parse } from './parseq-lang-interpreter';

const basicContext : InvocationContext =  {
  definedFrames: [0,5,10],
  definedValues: [5,0,10],
  fieldName: 'test',
  BPM: 140,
  FPS: 30,
  allKeyframes: [],
  variableMap: new Map(),
  activeKeyframe: 0,
  frame: 0
};

const runParseq = (formula: string) => {
  var activeKeyframe = 0;
  return [ ...Array(11).keys() ].map((i, f) => 
    {
      activeKeyframe = basicContext.definedFrames.includes(i) ? i : activeKeyframe;
      const parsed = parse(formula);

      return interpret(parsed, {...basicContext, activeKeyframe, frame: f })
    });
}

const runTest = (label:string, formula: string, expected: (number|string)[]) => {
  const testTag = label + ': ' + formula;
  //  eslint-disable-next-line jest/valid-title
  test(testTag, () => {
    const results = runParseq(formula);
    expect(JSON.stringify(results))
      .toEqual(JSON.stringify(expected));
  });
}

runTest('literal', '4.5', [4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5]);
runTest('literal', '-4.5', [-4.5,-4.5,-4.5,-4.5,-4.5,-4.5,-4.5,-4.5,-4.5,-4.5,-4.5]);
runTest('literal', '"foo"', ["foo","foo","foo","foo","foo","foo","foo","foo","foo","foo","foo"]);
runTest('literal', '-"foo"', ["-foo","-foo","-foo","-foo","-foo","-foo","-foo","-foo","-foo","-foo","-foo"]);

runTest('min', 'min(1,2)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('max', 'max(1,30)', [30,30,30,30,30,30,30,30,30,30,30]);

runTest('built-in', 'L', [5,4,3,2,1,0,2,4,6,8,10]);
runTest('built-in', 'S', [5,5,5,5,5,0,0,0,0,0,10]);
runTest('built-in', 'round(C,2)', [5,3.28,1.74,0.56,-0.08,0,0.92,2.56,4.74,7.28,10]);
runTest('built-in', 'P', [5,2.8,1.2,0.2,-0.2,0,0.8,2.2,4.2,6.8,10]);
runTest('built-in', 'f', [0,1,2,3,4,5,6,7,8,9,10]);
runTest('built-in', 'round(b,2)', [0,0.08,0.16,0.23,0.31,0.39,0.47,0.54,0.62,0.7,0.78]);
runTest('built-in', 'round(s,2)', [0,0.03,0.07,0.1,0.13,0.17,0.2,0.23,0.27,0.3,0.33]);
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

runTest('pulse-unnamed-args', 'round(pulse(10),2)', [1,1,1,1,1,0,0,0,0,0,1]);
runTest('pulse-unnamed-args', 'round(pulse(10, 1),2)', [1,1,1,1,0,0,0,0,0,1,1]);  //phase shift
runTest('pulse-unnamed-args', 'round(pulse(10, 1, 2),2)', [2,2,2,2,0,0,0,0,0,2,2]); //amplitude
runTest('pulse-unnamed-args', 'round(pulse(10, 1, 2, 10),2)', [12,12,12,12,10,10,10,10,10,12,12]); //centre
runTest('pulse-unnamed-args', 'round(pulse(5, 0, 2, 10, 0.5, 1),2)', [12,10,10,0,0,12,10,10,0,0,12]); // limit
runTest('pulse-unnamed-args', 'round(pulse(5, 0, 2, 10, 0, 2),2)', [12,12,10,10,10,12,12,10,10,10,12]);  //pulse width


runTest('sin-named-args', 'round(sin(p=10),2)', [0,0.59,0.95,0.95,0.59,0,-0.59,-0.95,-0.95,-0.59,-0]);
runTest('sin-named-args', 'round(sin(p=10, ps=1),2)', [0.59,0.95,0.95,0.59,0,-0.59,-0.95,-0.95,-0.59, -0, 0.59]); //phase shift
runTest('sin-named-args', 'round(sin(p=10, ps=1, a=2),2)', [1.18,1.9,1.9,1.18, 0,-1.18,-1.9,-1.9,-1.18, -0,1.18]); //amplitude
runTest('sin-named-args', 'round(sin(p=10, ps=1, a=2, c=10),2)', [11.18,11.9,11.9,11.18,10,8.82,8.1,8.1,8.82,10,11.18]); //centre
runTest('sin-named-args', 'round(sin(p=5, ps=1, a=2, c=10, li=0.5),2)', [11.9,11.18,8.82,0,0,11.9,11.18,8.82,0,0,11.9]); // fractional limit
runTest('sin-named-args', 'round(sin(p=5, ps=1, a=2, c=10, li=0.5, pw=99),2)', [11.9,11.18,8.82,0,0,11.9,11.18,8.82,0,0,11.9]);  //pulse should be ignored

runTest('sq-named-args', 'round(sq(p=10),2)', [1,1,1,1,1,1,-1,-1,-1,-1,-1]);
runTest('sq-named-args', 'round(sq(p=10, ps=1),2)', [1,1,1,1,1,-1,-1,-1,-1,-1,1]);  //phase shift
runTest('sq-named-args', 'round(sq(p=10, ps=1, a=2),2)', [2,2,2,2,2,-2,-2,-2,-2,-2,2]); //amplitude
runTest('sq-named-args', 'round(sq(p=10, ps=1, a=2, c=10),2)', [12,12,12,12,12,8,8,8,8,8,12]); //centre
runTest('sq-named-args', 'round(sq(p=5, ps=1, a=2, c=10, li=0.5),2)', [12,12,8,0,0,12,12,8,0,0,12]); // fractional limit
runTest('sq-named-args', 'round(sq(p=5, ps=1, a=2, c=10, li=0.5, pw=99),2)', [12,12,8,0,0,12,12,8,0,0,12]);  //pulse should be ignored

runTest('tri-named-args', 'round(tri(p=10),2)', [0,0.4,0.8,0.8,0.4,0,-0.4,-0.8,-0.8,-0.4,-0]);
runTest('tri-named-args', 'round(tri(p=10, ps=1),2)', [0.4,0.8,0.8,0.4,0,-0.4,-0.8,-0.8,-0.4,0,0.4]);  //phase shift
runTest('tri-named-args', 'round(tri(p=10, ps=1, a=2),2)', [0.8,1.6,1.6,0.8,0,-0.8,-1.6,-1.6,-0.8,0,0.8]); //amplitude
runTest('tri-named-args', 'round(tri(p=10, ps=1, a=2, c=10),2)', [10.8,11.6,11.6,10.8,10,9.2,8.4,8.4,9.2,10,10.8]); //centre
runTest('tri-named-args', 'round(tri(p=5, ps=1, a=2, c=10, li=0.5),2)', [11.6,10.8,9.2,0,0,11.6,10.8,9.2,0,0,11.6]); // fractional limit
runTest('tri-named-args', 'round(tri(p=5, ps=1, a=2, c=10, li=0.5, pw=99),2)', [11.6,10.8,9.2,0,0,11.6,10.8,9.2,0,0,11.6]);  //pulse should be ignored

runTest('saw-named-args', 'round(saw(p=10),2)', [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0]);
runTest('saw-named-args', 'round(saw(p=10, ps=1),2)', [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0,0.1]);  //phase shift
runTest('saw-named-args', 'round(saw(p=10, ps=1, a=2),2)', [0.2,0.4,0.6,0.8,1,1.2,1.4,1.6,1.8,0,0.2]); //amplitude
runTest('saw-named-args', 'round(saw(p=10, ps=1, a=2, c=10),2)', [10.2,10.4,10.6,10.8,11,11.2,11.4,11.6,11.8,10,10.2]); //centre
runTest('saw-named-args', 'round(saw(p=5, ps=1, a=2, c=10, li=0.5),2)', [10.4,10.8,11.2,0,0,10.4,10.8,11.2,0,0,10.4]); // fractional limit
runTest('saw-named-args', 'round(saw(p=5, ps=1, a=2, c=10, li=0.5, pw=99),2)', [10.4,10.8,11.2,0,0,10.4,10.8,11.2,0,0,10.4]);  //pulse should be ignored

runTest('pulse-named-args', 'round(pulse(p=10),2)', [1,1,1,1,1,0,0,0,0,0,1]);
runTest('pulse-named-args', 'round(pulse(p=10, ps=1),2)', [1,1,1,1,0,0,0,0,0,1,1]);  //phase shift
runTest('pulse-named-args', 'round(pulse(p=10, ps=1, a=2),2)', [2,2,2,2,0,0,0,0,0,2,2]); //amplitude
runTest('pulse-named-args', 'round(pulse(p=10, ps=1, a=2, c=10),2)', [12,12,12,12,10,10,10,10,10,12,12]); //centre
runTest('pulse-named-args', 'round(pulse(p=5, ps=0, a=2, c=10, li=0.5, pw=1),2)', [12,10,10,0,0,12,10,10,0,0,12]); // limit
runTest('pulse-named-args', 'round(pulse(p=5, ps=0, a=2, c=10, li=0, pw=2),2)', [12,12,10,10,10,12,12,10,10,10,12]);  //pulse width

runTest('addition', '1+1', [2,2,2,2,2,2,2,2,2,2,2]);

runTest('condtional', 'if (1 ) 2', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('condtional', 'if (0 ) 2', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('condtional', 'if (0) 2 else 3', [3,3,3,3,3,3,3,3,3,3,3]);
runTest('condtional', 'if (0) 2 else if (1) 3 else 4', [3,3,3,3,3,3,3,3,3,3,3]);
runTest('condtional', 'if (0) 2 else if (0) 3 else 4', [4,4,4,4,4,4,4,4,4,4,4]);
runTest('condtional', 'if (0 or 1) 2', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('condtional', 'if (0 and 1) 2', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('condtional', 'if (0 or 1 ) 2', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('condtional', 'if ( 0 or 1) 2', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('condtional', 'if ( 0 or 1 ) 2', [2,2,2,2,2,2,2,2,2,2,2]);

runTest('precedence', '1+1*5', [6,6,6,6,6,6,6,6,6,6,6]);

runTest('round', 'round(1)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('round', 'round(1.4)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('round', 'round(1.5)', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('round', 'round(1,2)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('round', 'round(1.444,2)', [1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44]);
runTest('round', 'round(1.555,2)', [1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56]);
runTest('round', 'round(v=1)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('round', 'round(v=1.4)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('round', 'round(v=1.5)', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('round', 'round(v=1,p=2)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('round', 'round(v=1.444,p=2)', [1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44]);
runTest('round', 'round(v=1.555,p=2)', [1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56]);

runTest('ceil', 'ceil(1)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('ceil', 'ceil(1.4)', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('ceil', 'ceil(1.5)', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('ceil', 'ceil(1,2)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('ceil', 'ceil(1.444,2)', [1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45]);
runTest('ceil', 'ceil(1.555,2)', [1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56]);
runTest('ceil', 'ceil(v=1)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('ceil', 'ceil(v=1.4)', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('ceil', 'ceil(v=1.5)', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('ceil', 'ceil(v=1,p=2)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('ceil', 'ceil(v=1.444,p=2)', [1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45,1.45]);
runTest('ceil', 'ceil(v=1.555,p=2)', [1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56,1.56]);

runTest('floor', 'floor(1)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(1.4)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(1.5)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(1,2)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(1.444,2)', [1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44]);
runTest('floor', 'floor(1.555,2)', [1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55]);
runTest('floor', 'floor(v=1)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(v=1.4)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(v=1.5)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(v=1,p=2)', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('floor', 'floor(v=1.444,p=2)', [1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44,1.44]);
runTest('floor', 'floor(v=1.555,p=2)', [1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55,1.55]);


runTest('binary-ops', '1+2', [3,3,3,3,3,3,3,3,3,3,3]);
runTest('binary-ops', '"a"+2', ["a2","a2","a2","a2","a2","a2","a2","a2","a2","a2","a2"]);
runTest('binary-ops', '3+"b"', ["3b","3b","3b","3b","3b","3b","3b","3b","3b","3b","3b"]);
runTest('binary-ops', '1-2', [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]);
runTest('binary-ops', '"a"-2', [NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN]);
runTest('binary-ops', '2*2', [4,4,4,4,4,4,4,4,4,4,4]);
runTest('binary-ops', '"a"*2', [NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN]);
runTest('binary-ops', '6/3', [2,2,2,2,2,2,2,2,2,2,2]);
runTest('binary-ops', '"a"/3', [NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN]);
runTest('binary-ops', '5%2', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '5^4', [625,625,625,625,625,625,625,625,625,625,625]);
runTest('binary-ops', '5==5', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '4==5', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a"=="a"', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"a"=="b"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"2"==2', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '5!=5', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '4!=5', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"a"!="a"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a"!="b"', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"2"!=2', [0,0,0,0,0,0,0,0,0,0,0]);

runTest('binary-ops', '3<4', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '4<4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '5<4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a"<4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a"<"b"', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"b"<"b"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"c"<"b"', [0,0,0,0,0,0,0,0,0,0,0]);

runTest('binary-ops', '3<=4', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '4<=4', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '5<=4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a"<=4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a"<="b"', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"b"<="b"', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"c"<="b"', [0,0,0,0,0,0,0,0,0,0,0]);

runTest('binary-ops', '3>=4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '4>=4', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '5>=4', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"a">=4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a">="b"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"b">="b"', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"c">="b"', [1,1,1,1,1,1,1,1,1,1,1]);

runTest('binary-ops', '3>4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '4>4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '5>4', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"a">4', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a">"b"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"b">"b"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"c">"b"', [1,1,1,1,1,1,1,1,1,1,1]);

runTest('binary-ops', 'false and false', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'false and true', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'true and false', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'true and true', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '0 and 0', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '0 and 1', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '1 and 0', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '1 and 1', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"" and ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"" and "a"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" and ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" and "a"', [0,0,0,0,0,0,0,0,0,0,0]);

runTest('binary-ops', 'false && false', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'false && true', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'true && false', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'true && true', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '0 && 0', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '0 && 1', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '1 && 0', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '1 && 1', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"" && ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"" && "a"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" && ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" && "a"', [0,0,0,0,0,0,0,0,0,0,0]);

runTest('binary-ops', 'false or false', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'false or true', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', 'true or false', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', 'true or true', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '0 or 0', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '0 or 1', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '1 or 0', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '1 or 1', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"" or ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"" or "a"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" or ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" or "a"', [0,0,0,0,0,0,0,0,0,0,0]);

runTest('binary-ops', 'false || false', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', 'false || true', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', 'true || false', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', 'true || true', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '0 || 0', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '0 || 1', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '1 || 0', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '1 || 1', [1,1,1,1,1,1,1,1,1,1,1]);
runTest('binary-ops', '"" || ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"" || "a"', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" || ""', [0,0,0,0,0,0,0,0,0,0,0]);
runTest('binary-ops', '"a" || "a"', [0,0,0,0,0,0,0,0,0,0,0]);

runTest('binary-ops', '"cat" : 0.5', ["(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)","(cat:0.5)",]);