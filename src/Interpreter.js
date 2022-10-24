import {TextField, Button} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parse, interpret, InterpreterContext } from './parseq-lang-interpreter'

const Interpreter = () => {

  const testKeyframes = [
    {frame: 0, denoise: 0.5},
    {frame: 50, denoise: 0.2},
    {frame: 99, denoise: 1}
  ]

  var input;
  const [outputText, setOutputText] = useState();
  const [dataToGraph, setDataToGraph] = useState();

  function componentDidMount(prevProps) {
    setOutputText("");
    setDataToGraph([]);
  }    

  const handleChangeInput = useCallback((e) => {
    input = e.target.value;
    setOutputText(`[Received: ${input}]`);
  }, []);

  const handleSubmit = useCallback((e) => {

    const fieldName = "denoise";
    const context = new InterpreterContext({
      fieldName: fieldName,
      thisKf: 0,
      definedFrames: testKeyframes.filter(kf => typeof kf[fieldName] !== "undefined").map(kf => kf.frame),
      definedValues: testKeyframes.filter(kf => typeof kf[fieldName] !== "undefined").map(kf => kf[fieldName]),
      FPS: 20,
      BPM: 140,
    });

    setOutputText(`Parsing: ${input}`);
    let parsed;
    try {       
      parsed = parse(input);      
    } catch(error){
        setOutputText(`Parsing: ${input}\n\nError: ${error}`);    
        console.error(error);
        return;
    }
    
    setOutputText(`Parsing done. Interpreting: ${input}`);    

    const frameFetcher = interpret(parsed, context)
    if (!frameFetcher) {
      setOutputText(`Interpreting: ${input} for ${context.fieldName}:${context.thisKf} \n\nFailed, see console.`);    
      return;
    }

    setOutputText(`Interpreting done  for ${context.fieldName}:${context.thisKf}. Ready to invoke: ${input}`);    

    let result = [];
    let output_text = "";
    for (let frame=0; frame<100; frame++) {
      try {
        let computedValue = frameFetcher(frame);
        output_text += `${frame}: ${computedValue}\n`
        result.push({
          "frame": frame,
          "denoise": computedValue
        })
      } catch (error) {
        setOutputText(`Evaluating ${input} for ${context.fieldName}:${context.thisKf} with frame ${frame}:\n\nError: ${error}`);    
        console.error(error);        
        return
      }
    }
    
    setDataToGraph(result);
    setOutputText(output_text);
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
    <ResponsiveContainer width="100%" height={300}>
          <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }} data={dataToGraph}>
            <Line type="monotone" dataKey='denoise' dot={'{ stroke: red}'} stroke='red' activeDot={{ r: 8 }} />
            <Legend layout="horizontal" wrapperStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #d5d5d5', borderRadius: 3, lineHeight: '40px' }} />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <ReferenceLine y={0} stroke="black" />
            <XAxis dataKey="frame" />
            <YAxis />
            <Tooltip />
          </LineChart>
    </ResponsiveContainer>    
    <TextField
      fullWidth
      id={"output"}
      label={"Output"}
      value={outputText}
      multiline
      rows={100}
      style={{margin: '10px' }}
      InputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
      variant="filled" />
</div>

  )
}

export default Interpreter;