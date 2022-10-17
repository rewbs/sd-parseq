import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import { linear, polynomial, step } from 'everpolate';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Tooltip as Tooltip2 } from '@mui/material';
import { FormControlLabel, FormGroup, Checkbox, Alert, Button } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import nearley from 'nearley';
import grammar from './grammar.js';
import stc from 'string-to-color';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyCGr7xczPkoHFQW-GanSAoAZZFGfLrYiTI",
  authDomain: "sd-parseq.firebaseapp.com",
  projectId: "sd-parseq",
  storageBucket: "sd-parseq.appspot.com",
  messagingSenderId: "830535540412",
  appId: "1:830535540412:web:858dde0a82381e6f32bab9",
  measurementId: "G-TPY8W4RQ83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


//////////////////////////////////////////
// Config

const version = "0.01"
const numPrompts = 4;
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
const interpolatableFields = ['seed', 'denoise', 'prompt_1_weight', 'prompt_2_weight', 'prompt_3_weight', 'prompt_4_weight', 'scale', 'rotx', 'roty', 'rotz',
  'panx', 'pany', 'zoom', 'loopback_frames', 'loopback_decay',
];
const default_prompts = [...Array(numPrompts)].map((i) => ({ positive: "", negative: "" }))
const default_options = {
  input_fps: "",
  output_fps: "",
  cc_window_width: "0",
  cc_window_slide_rate: "1",
  cc_use_input: false
}
const default_keyframes = [
  {
    frame: 0, seed: 303, scale: 7.5, denoise: 0.6, rotx: 0, roty: 0, rotz: 0, panx: 0,
    pany: 0, zoom: 0, loopback_frames: 1, loopback_decay: 0.25,
    prompt_1_weight: 1, prompt_2_weight: 0, prompt_3_weight: 0, prompt_4_weight: 0
  },
  {
    frame: 199, seed: 303, scale: 7.5, denoise: 0.6, rotx: 0, roty: 0, rotz: 0, panx: 0,
    pany: 0, zoom: 0, loopback_frames: 1, loopback_decay: 0.25,
    prompt_1_weight: 0, prompt_2_weight: 1, prompt_3_weight: 0, prompt_4_weight: 0
  }
];


function loadFromQueryString(key) {
  let qps = new URLSearchParams(window.location.search);
  let loadedStateStr = qps.get("parsec");
  if (loadedStateStr) {
    let loadedState = JSON.parse(loadedStateStr);
    return loadedState[key];
  }
}

const App = () => {

  const gridRef = useRef();

  //////////////////////////////////////////
  // App State
  //////////////////////////////////////////
  const [columnDefs, setColumnDefs] = useState([
    {
      headerName: 'Frame #',
      field: 'frame',
      comparator: (valueA, valueB, nodeA, nodeB, isDescending) => valueA - valueB,
      sort: 'asc',
      valueSetter: (params) => {
        frameIdMap.delete(params.data.frame);
        var newValue = parseInt(params.newValue);
        params.data.frame = newValue;
        frameIdMap.set(newValue, params.node.id);
        setNeedsRender(true);
      }
    },
    ...interpolatableFields.flatMap(field => [
      {
        field: field,
        valueSetter: (params) => {
          params.data[field] = isNaN(parseFloat(params.newValue)) ? "" : parseFloat(params.newValue);
          setNeedsRender(true);
        }
      },
      {
        headerName: '➟',
        field: field + '_i'
      }
    ])
  ]);
  const [renderedData, setRenderedData] = useState([]);
  const [renderedErrorMessage, setRenderedErrorMessage] = useState("");
  const [needsRender, setNeedsRender] = useState(true);
  const [options, setOptions] = useState(loadFromQueryString('options') || default_options)
  const [frameIdMap, setFrameIdMap] = useState(new Map());
  const [displayFields, setDisplayFields] = useState(interpolatableFields);
  const [visFields, setVisFields] = useState(['denoise', 'prompt_1_weight', 'prompt_2_weight']);
  const [prompts, setPrompts] = useState(loadFromQueryString('prompts') || default_prompts);


  // DefaultColDef sets props common to all Columns
  const defaultColDef = useMemo(() => ({
    editable: true,
    resizable: true,
    suppressKeyboardEvent: (params) => {
      return params.event.ctrlKey && (
        params.event.key === 'a'
        || params.event.key === 'd'
        || params.event.key === 'r'
      );
    }
  }));

  //////////////////////////////////////////
  // Grid action callbacks 
  const addRow = useCallback((frame) => {
    if (isNaN(frame)) {
      // No frame selected, assume add after last row
      frame = getKeyframes().pop().frame;
    }
    while (gridRef.current.api.getRowNode(frameIdMap.get(frame)) !== undefined) {
      ++frame;
    }
    const res = gridRef.current.api.applyTransaction({
      add: [{ "frame": frame }],
      addIndex: frame,
    });
    frameIdMap.set(frame, res.add[0].id);
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
    setQueryParamState();
  }, []);

  const deleteRow = useCallback((frame) => {
    let keyframes = getKeyframes()
    if (keyframes.length<=2) {
      console.error("There must be at least 2 keyframes. Can't delete any more.")
      return;
    }
    if (isNaN(frame)) {
      // No frame selected, assume last row.
      frame = getKeyframes().pop().frame;
    }
    let rowData = gridRef.current.api.getRowNode(frameIdMap.get(frame)).data;
    frameIdMap.delete(rowData.frame);
    gridRef.current.api.applyTransaction({
      remove: [rowData]
    });
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
    setQueryParamState();
  }, []);

  const onCellValueChanged = useCallback((event) => {
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
    setQueryParamState();
  });

  const onGridReady = params => {
    getKeyframes();
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
    render();
  };

  const onCellKeyPress = useCallback((e) => {
    if (e.event) {
      var keyPressed = e.event.key;
      if (keyPressed === 'a' && e.event.ctrlKey) {
        addRow(parseInt(e.node.data.frame) + 1);
      } else if (keyPressed === 'd' && e.event.ctrlKey) {
        deleteRow(parseInt(e.node.data.frame));
      } else if (keyPressed === 'r' && e.event.ctrlKey) {
        render()
      }
    }
  }, []);

  //////////////////////////////////////////
  // Grid data accesss

  // Returns array of every frame to render, from [startFrame, ..., endFrame]
  function getAllFrames() {
    var declaredFrames = [];
    gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      declaredFrames.push(rowNode.data.frame);
    });

    var minFrame = Math.min(...declaredFrames);
    var maxFrame = Math.max(...declaredFrames);
    return Array.from(Array(maxFrame - minFrame + 1).keys()).map((i) => i + minFrame);
  }

  // Returns map of (declaredFrame => declaredValue) for field.
  function getDeclaredPoints(field, parser) {
    var vals = new Map();
    gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      var frame = rowNode.data['frame'];
      var fieldValue = parser(rowNode.data[field]);
      if (fieldValue !== undefined && !isNaN(fieldValue)) {
        vals.set(frame, fieldValue)
      }
    });
    return vals;
  }

  function getKeyframes() {
    let keyframes_local = [];
    if (!gridRef || !gridRef.current || !gridRef.current.api) {
      // Grid not yet initialised.
      return []
    }
    gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (rowNode.data.frame !== undefined) {
        frameIdMap.set(rowNode.data.frame, rowNode.id);
      }
      keyframes_local.push(rowNode.data);
    });
    return keyframes_local;
  }


  //////////////////////////////////////////
  // Other component event callbacks  
  const handleChangeDisplayFields = useCallback((e) => {
    let selectedToShow = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    setDisplayFields(selectedToShow);

    let columnsToShow = selectedToShow.flatMap(c => [c, c + '_i']);

    let allColumnIds = gridRef.current.columnApi.getColumns().map((col) => col.colId)

    gridRef.current.columnApi.setColumnsVisible(allColumnIds, false);
    gridRef.current.columnApi.setColumnsVisible(columnsToShow, true);
    gridRef.current.columnApi.setColumnsVisible(['frame'], true);
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();

  }, []);

  const handleChangeVisFields = useCallback((e) => {
    const value = e.target.value;
    setVisFields(typeof value === 'string' ? value.split(',') : value);
  }, []);

  const handleChangePrompts = useCallback((e) => {
    const value = e.target.value;
    const id = e.target.id;
    let [pos_or_neg, _, p] = id.split(/_/);
    prompts[p][pos_or_neg] = value;
    setPrompts(prompts);
    setQueryParamState();
    setNeedsRender(true);
  }, []);

  const handleChangeOption = useCallback((e) => {
    const id = e.target.id;
    let [_, optionId] = id.split(/options_/);
    
    const value = (optionId === 'cc_use_input') ? e.target.checked : e.target.value;
    options[optionId] = value;
    setOptions(options);
    setQueryParamState();
    setNeedsRender(true);
  }, []);

  function setQueryParamState() {
    const url = new URL(window.location);
    let qp = getPersistableState();
    url.searchParams.set('parsec', JSON.stringify(qp));
    window.history.replaceState({}, '', url);
  }

  function getPersistableState() {
    return {
      prompts: prompts,
      options: options,
      keyframes: getKeyframes(),
    };
  }
  

  //////////////////////////////////////////
  // Main render action callback
  const render = useCallback((event) => {
    gridRef.current.api.onSortChanged();
    setRenderedErrorMessage("");

    // Validation
    let keyframes = getKeyframes();
    if (keyframes.length<2) {
      setRenderedErrorMessage("There must be at least 2 keyframes.")
      return;
    }
    let firstKeyFrame = keyframes[0];
    let lastKeyFrame = keyframes[keyframes.length-1];
    let missingFieldsFirst = [];
    let missingFieldsLast = [];
    (interpolatableFields.concat(['frame'])).forEach((field) => {
      if (lastKeyFrame[field] === undefined || isNaN(lastKeyFrame[field]) ||  lastKeyFrame[field] === "") {
        missingFieldsLast.push(field)
      }
      if (firstKeyFrame[field] === undefined || isNaN(firstKeyFrame[field]) ||  firstKeyFrame[field] === "") {
        missingFieldsFirst.push(field)
      }
    });
    if (missingFieldsFirst.length > 0 || missingFieldsLast.length > 0) {
      setRenderedErrorMessage(`First and last frames must have values for all fields, else interpolation cannot be calculated. Missing from first frame: ${missingFieldsFirst}. Missing from last frame: ${missingFieldsLast}`);
      return;
    }


    var rendered_frames = [];
    var all_frame_numbers = getAllFrames();

    // Pre-calculate all interpolations for all fields
    // (TODO: optimise, do this lazily when required for render)
    var allInterps = {};
    interpolatableFields.forEach((field) => {
      console.log("Computing interpolations for: ", field);
      allInterps[field] = computeAllInterpolations(field);
    });

    // Calculate actual rendered value for all interpolatable fields
    interpolatableFields.forEach((field) => {
      var lastFetchFieldVal = f => allInterps[field][f]['linear']
      all_frame_numbers.forEach((frame, i) => {

        let declaredRow = gridRef.current.api.getRowNode(frameIdMap.get(frame));
        let fetchFieldVal = lastFetchFieldVal;

        if (declaredRow !== undefined) {
          if (declaredRow.data[field + '_i']) {
            const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
            try {       
              parser.feed(declaredRow.data[field + '_i']);
            } catch(error){
                console.error(error);
                setRenderedErrorMessage(`Error parsing interpolation for ${field} at frame ${frame} (value: <pre>${declaredRow.data[field + '_i']}</pre>): ` + error);
            }
           
            // TODO handle parse errors
            var result = parser.results[0][0];
            fetchFieldVal = interpret(result, allInterps, field) || lastFetchFieldVal;
          }
        }
        rendered_frames[frame] = {
          ...rendered_frames[frame] || {},
          frame: frame,
          [field]: fetchFieldVal(frame)
        }
        lastFetchFieldVal = fetchFieldVal;
      });
    });

    // Calculate rendered prompt based on prompts and weights
    all_frame_numbers.forEach((frame) => {
      let weighted_prompts_pos = [];
      let weighted_prompts_neg = [];
      for (var p = 0; p < numPrompts; p++) {
        let weight = rendered_frames[frame]['prompt_' + (p + 1) + '_weight'];
        if (rendered_frames[frame]['prompt_' + (p + 1) + '_weight'] > 0.001) {
          if (prompts[p].positive) {
            weighted_prompts_pos.push(prompts[p].positive + ' :' + weight)
          }
          if (prompts[p].negative) {
            weighted_prompts_neg.push(prompts[p].negative + ' :' + weight)
          }
        }
      }
      rendered_frames[frame] = {
        ...rendered_frames[frame] || {},
        positive_prompt: "" + weighted_prompts_pos.join(' AND '),
        negative_prompt: "" + weighted_prompts_neg.join(' AND ')
      }
    });

    // Calculate subseed & subseed strength based on fractional part of seed.
    // Not sure if this is correct interpretation of subseed.
    all_frame_numbers.forEach((frame) => {
      let subseed = Math.ceil(rendered_frames[frame]['seed'])
      let subseed_strength = rendered_frames[frame]['seed'] % 1
      let desined_subseed_strength = subseed_strength + (0.1 * Math.sin(subseed_strength * 2 * Math.PI))

      rendered_frames[frame] = {
        ...rendered_frames[frame] || {},
        subseed: subseed,
        subseed_strength: desined_subseed_strength
      }
    });

    const data = {
      "meta": {
        "generated_by": "sd_parseq",
        "version": version,
        "generated_at": new Date().toUTCString(),
      },
      "options": options,
      "prompts": prompts,
      "keyframes": keyframes,
      "rendered_frames": rendered_frames
    }

    setRenderedData(data);
    setNeedsRender(false);
  });

  //////////////////////////////////////////
  // Render utils

  // Returns array of objects with values for all interpolation types for each frame.
  // TODO: this upfront calculation can be optimised away
  function computeAllInterpolations(field) {
    var allFrames = getAllFrames();
    var declaredPoints = getDeclaredPoints(field, parseFloat); //TODO add per-field parser for clamping
    if (declaredPoints.size <2) {
      console.error("Need at least 2 points to interpolate!")
      return {};
    }
    var field_linear = linear(allFrames, [...declaredPoints.keys()], [...declaredPoints.values()]);
    var field_poly = polynomial(allFrames, [...declaredPoints.keys()], [...declaredPoints.values()]);
    var field_step = step(allFrames, [...declaredPoints.keys()], [...declaredPoints.values()]);

    return allFrames.map((frame) => {
      return {
        'linear': field_linear[frame],
        'poly': field_poly[frame],
        'step': field_step[frame],
      }
    });
  }

  // Evaluation of parsec interpolation lang
  function interpret(ast, allInterps, field) {
    switch (ast.operator) {
      case 'L':
        return f => allInterps[field][f]['linear'];
      case 'P':
        return f => allInterps[field][f]['poly'];
      case 'S':
        return f => allInterps[field][f]['step'];
      case 'f':
        return f => parseFloat(f);
      case 'constant':
        return f => parseFloat(ast.operand)
      case 'sin':
        return f => {
          let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
          return centre + Math.sin((phase + parseFloat(f)) * Math.PI * 2 / period) * amp;
        };
      case 'sq':
        return f => {
          let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
          return centre + (Math.sin((phase + parseFloat(f)) * Math.PI * 2 / period) >= 0 ? 1 : -1) * amp;
        };
      case 'tri':
        return f => {
          let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
          return centre + Math.asin(Math.sin((phase + parseFloat(f)) * Math.PI * 2 / period)) * (2 * amp) / Math.PI;
        };
      case 'saw':
        return f => {
          let [centre, phase, period, amp] = ast.operands.map(op => interpret(op, allInterps, field)()) 
          return centre + ((phase + parseFloat(f)) % period) * amp / period
        };
      case 'min':
          return f => {
            let [left, right] = ast.operands.map(op => interpret(op, allInterps, field)()) 
            return Math.min(left,right)
          };
      case 'max':
        return f => {
          let [left, right] = ast.operands.map(op => interpret(op, allInterps, field)()) 
          return Math.max(left,right)
        }          
      case 'sum':
        return f => interpret(ast.leftOperand, allInterps, field)(f) + interpret(ast.rightOperand, allInterps, field)(f)
      case 'sub':
        return f => interpret(ast.leftOperand, allInterps, field)(f) - interpret(ast.rightOperand, allInterps, field)(f)
      case 'mul':
        return f => interpret(ast.leftOperand, allInterps, field)(f) * interpret(ast.rightOperand, allInterps, field)(f)
      case 'div':
        return f => interpret(ast.leftOperand, allInterps, field)(f) / interpret(ast.rightOperand, allInterps, field)(f)
      default:
        return null
    }
  }


  //////////////////////////////////////////
  // Page
  return (
    <Grid container paddingLeft={5} paddingRight={5} spacing={2} sx={{
      '--Grid-borderWidth': '1px',
      borderTop: 'var(--Grid-borderWidth) solid',
      borderLeft: 'var(--Grid-borderWidth) solid',
      borderColor: 'divider',
      '& > div': {
        borderLeft: 'var(--Grid-borderWidth) solid',
        borderRight: 'var(--Grid-borderWidth) solid',
        borderBottom: 'var(--Grid-borderWidth) solid',
        borderColor: 'divider',
      },
    }}>
      <CssBaseline />
      <Grid xs={12}>
        <h2>Parseq v0.01 <small><small><small><a href="https://github.com/rewbs/sd-parseq">(what is this? How do I use it? Where do I report bugs?)</a></small></small></small></h2>
        
      </Grid>
      <Grid xs={10}>
        <h3>Keyframes for parameter flow</h3>
        <div className="ag-theme-alpine" style={{ width: '100%', height: 200 }}>
          <AgGridReact
            ref={gridRef}
            rowData={loadFromQueryString('keyframes') || default_keyframes}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            onCellValueChanged={onCellValueChanged}
            onCellKeyPress={onCellKeyPress}
            onGridReady={onGridReady}
            columnHoverHighlight={true}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={100}
            enableRangeSelection={true}
            enableFillHandle={true}
            enableCellChangeFlash={true}
          />
        </div>
        <Button variant="outlined" style={{ marginRight: 10}} onClick={addRow}>Add row (ctrl-a)</Button>
        <Button variant="outlined" style={{ marginRight: 10}} onClick={deleteRow}>Delete row (ctrl-d)</Button>
        <Button variant="contained" style={{ marginRight: 10}} onClick={render}>Render (ctrl-r)</Button>
      </Grid>
      <Grid xs={2}>
        Fields to display:
        <Select
          id="select-display-fields"
          multiple
          value={displayFields}
          onChange={handleChangeDisplayFields}
          input={<OutlinedInput id="select-display-fields" label="Chip" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {interpolatableFields.map((field) => (
            <MenuItem
              key={field}
              value={field}
            >
              {field}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid xs={10}>
        <h3>Visualised parameter flow</h3>
        { renderedErrorMessage ? <Alert severity="error">{renderedErrorMessage}</Alert> : <></> }
        { needsRender ? <Alert severity="info">Keyframes, prompts, or options have changed. Please hit render to update the output.</Alert> : <Alert severity="success">Output is up-to-date.</Alert>}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }} data={renderedData.rendered_frames}>
            {visFields.map((field) => <Line type="monotone" dataKey={field} dot={'{ stroke:' + stc(field) + '}'} stroke={stc(field)} activeDot={{ r: 8 }} />)}
            <Legend layout="horizontal" wrapperStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #d5d5d5', borderRadius: 3, lineHeight: '40px' }} />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            {getKeyframes().map((keyframe) => <ReferenceLine x={keyframe.frame} stroke="green" strokeDasharray="2 2" />)}
            <ReferenceLine y={0} stroke="black" />
            <XAxis dataKey="frame" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </Grid>
      <Grid xs={2}>
        Fields to display:
        <Select
          id="select-vis-fields"
          multiple
          value={visFields}
          onChange={handleChangeVisFields}
          input={<OutlinedInput id="select-vis-fields" label="Chip" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {interpolatableFields.map((field) => (
            <MenuItem
              key={field}
              value={field}
            >
              {field}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid xs={8}>
        <h3>Prompts</h3>
        <FormControl fullWidth>
          {prompts.map((prompt, i) => <div>
            <TextField
              id={"positive_prompt_" + i}
              label={"Positive prompt " + (i + 1)}
              multiline
              rows={2}
              defaultValue={prompt.positive}
              style={{ width: '40%', marginTop: '10px', marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              onChange={handleChangePrompts}
              size="small"
              variant="standard" />
            <TextField
              hiddenLabel
              id={"negative_prompt_" + i}
              label={"Negative prompt " + (i + 1)}
              multiline
              rows={2}
              defaultValue={prompt.negative}
              style={{ width: '40%', marginTop: '10px', marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              onChange={handleChangePrompts}
              size="small"
              variant="standard" />
          </div>
          )}

        </FormControl>
      </Grid>
      <Grid xs={4}>
        <h3>Options</h3>
        <FormGroup>
          <Tooltip2 title="Input FPS: if input is a video, drop or duplicate frames from the input to process frames at this rate (leave blank to use all frames from the input exactly once).">
            <TextField
              id={"options_input_fps"}
              label={"Input FPS"}
              defaultValue={options['input_fps']}
              onChange={handleChangeOption}
              style={{ marginTop: '10px', marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              size="small"
              variant="standard" />
          </Tooltip2>
          <Tooltip2 title="Output FPS: Generate video at this frame rate (leave blank to use same as original input video).">
            <TextField
              id={"options_output_fps"}
              label={"Output FPS"}
              defaultValue={options['output_fps']}
              onChange={handleChangeOption}
              style={{ marginTop: '10px', marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              size="small"
              variant="standard" />
          </Tooltip2>
        </FormGroup>
        <br />
        <FormGroup>
          <Tooltip2 title="Color-correction window width: How many frames to average over when computing the target color histogram. -1 means grow the window frames a processed, always starting at frame 0 and ending at the processed frame if slide rate is 1.">
            <TextField
              id={"options_cc_window_width"}
              label={"CC window width"}
              defaultValue={options['cc_window_width']}
              onChange={handleChangeOption}
              style={{ marginTop: '10px', marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              size="small"
              variant="standard" />
          </Tooltip2>
          <Tooltip2 title="Color-correction window slide rate: How fast to move the end of the window relative to the frame generation. For example, if the loopback is 80 frames long, a slide rate of 0.5 means that on the last generated frame, the window ends on frame 40.">
            <TextField
              id={"options_cc_window_slide_rate"}
              label={"CC window slide rate"}
              defaultValue={options['cc_window_slide_rate']}
              onChange={handleChangeOption}
              style={{ marginTop: '10px', marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              size="small"
              variant="standard" />
          </Tooltip2>
          <Tooltip2 title="Whether to always include the original input image or video first frame of the color-correction targer window. Set this to true and 'CC window width' to 0 to lock all generated frames to the input histogram.">
              <FormControlLabel control={
                <Checkbox defaultChecked={options['cc_use_input']}
                  id={"options_cc_use_input"}
                  onChange={handleChangeOption}
                 />}
                label="Always use input for CC" />
          </Tooltip2>
        </FormGroup>        
      </Grid>
      <Grid xs={6}>
        <h3>Output <small><small> - copy this and paste it in the Parseq script in the Stable Diffusion Web UI</small></small></h3>
        <Button variant="contained" onClick={render}>Render</Button>
        { needsRender ? <Alert severity="info">Keyframes, prompts, or options have changed. Please hit render to update the output.</Alert> : <Alert severity="success">Output is up-to-date.</Alert>}
        <TextField
          style={{ width: '100%' }}
          id="filled-multiline-static"
          label="Rendered output"
          multiline
          rows={20}
          InputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
          value={JSON.stringify(renderedData, null, 4)}
          variant="filled"
        />
      </Grid>
      <Grid xs={6}>
        <ul>
        <li>
        { renderedErrorMessage ? <Alert severity="error">{renderedErrorMessage}</Alert> : <></> }
        </li>
        <li><p>TODO: Better error messages /  warnings. For now check the console.</p></li>
        <li><a href="">Link to this page, including values for prompts, options, keyframes</a></li>
        </ul>
      </Grid>
    </Grid>
  );
};

export default App;


