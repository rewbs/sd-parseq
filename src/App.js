import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import { linear, polynomial, step } from 'everpolate';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import nearley from 'nearley';
import grammar from './grammar.js';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css';


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

const App = () => {

  const gridRef = useRef();

  //////////////////////////////////////////
  // App State
  //////////////////////////////////////////
  const default_keyframes = [
    {
      frame: 0, seed: -1, scale: 7.5, denoise: 0.6, rotx: 0, roty: 0, rotz: 0, panx: 0,
      pany: 0, zoom: 0, loopback_frames: 1, loopback_decay: 0.25,
      prompt_1_weight: 1, prompt_2_weight: 0, prompt_3_weight: 0, prompt_4_weight: 0
    },
    {
      frame: 199, seed: -1, scale: 7.5, denoise: 0.6, rotx: 0, roty: 0, rotz: 0, panx: 0,
      pany: 0, zoom: 0, loopback_frames: 1, loopback_decay: 0.25,
      prompt_1_weight: 0, prompt_2_weight: 1, prompt_3_weight: 0, prompt_4_weight: 0
    }
  ];
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
        console.log(frameIdMap)
      }
    },
    ...interpolatableFields.flatMap(field => [
      {
        field: field
      },
      {
        headerName: '➟',
        field: field + '_i',
      }
    ])
  ]);
  const [renderedData, setRenderedData] = useState([]);
  const [frameIdMap, setFrameIdMap] = useState(new Map());
  const [displayFields, setDisplayFields] = React.useState(interpolatableFields);
  const [visFields, setVisFields] = React.useState(['denoise', 'prompt_1_weight', 'prompt_2_weight']);
  const [prompts, setPrompts] = React.useState([...Array(numPrompts)].map((i) => ({ positive: "", negative: "" })));

  // DefaultColDef sets props common to all Columns
  const defaultColDef = useMemo(() => ({
    editable: true,
    resizable: true,
    suppressKeyboardEvent: (params) => {
      return params.event.ctrlKey && (
        params.event.key === 'a'
        || params.event.key === 'd'
        || params.event.key === 'enter'
      );
    }
  }));

  //////////////////////////////////////////
  // Grid action callbacks 
  const addRow = useCallback((frame) => {
    while (gridRef.current.api.getRowNode(frameIdMap.get(frame)) !== undefined) {
      ++frame;
    }
    console.log("frame to add:", frame)
    const res = gridRef.current.api.applyTransaction({
      add: [{ "frame": frame }],
      addIndex: frame,
    });
    frameIdMap.set(frame, res.add[0].id);
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
  }, []);

  const deleteRow = useCallback((rowId) => {
    console.log("frame to delete:", rowId)
    let rowData = gridRef.current.api.getRowNode(rowId).data;
    console.log(rowData);
    frameIdMap.delete(rowData.frame);
    const res = gridRef.current.api.applyTransaction({
      remove: [rowData]
    });
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
  }, []);

  const onCellValueChanged = useCallback((event) => {
    gridRef.current.api.onSortChanged();
    setQueryParamState();
  });

  const onGridReady = params => {
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
  };

  const onCellKeyPress = useCallback((e) => {
    if (e.event) {
      var keyPressed = e.event.key;
      if (keyPressed === 'a' && e.event.ctrlKey) {
        addRow(parseInt(e.node.data.frame) + 1);
      } else if (keyPressed === 'd' && e.event.ctrlKey) {
        deleteRow(e.node.id);
      } else if (keyPressed === 'enter' && e.event.ctrlKey) {
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
    gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (rowNode.data.frame) {
        frameIdMap.set(rowNode.data.frame, rowNode.rowId);
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
    console.log(columnsToShow);

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
  }, []);

  function setQueryParamState() {
    const url = new URL(window.location);
    let qp = { prompts: prompts, keyframes: getKeyframes() };
    url.searchParams.set('parsec', JSON.stringify(qp));
    window.history.replaceState({}, '', url);
  }  

  //////////////////////////////////////////
  // Main render action callback
  const render = useCallback((event) => {
    gridRef.current.api.onSortChanged();

    let keyframes = getKeyframes();

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
          if (declaredRow.data[field + '_i'] !== undefined) {
            const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
            parser.feed(declaredRow.data[field + '_i']);
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
        if (rendered_frames[frame]['prompt_' + (p + 1) + '_weight'] != 0) {
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
      "header": {
        "generated_by": "sd_parseq",
        "version": version,
        "generated_at": new Date().toUTCString(),
      },
      "prompts": prompts,
      "keyframes": keyframes,
      "rendered_frames": rendered_frames
    }

    setRenderedData(data)
  });

  //////////////////////////////////////////
  // Render utils

  // Returns array of objects with values for all interpolation types for each frame.
  // TODO: this upfront calculation can be optimised away
  function computeAllInterpolations(gridRef, field) {
    var allFrames = getAllFrames(gridRef);
    var declaredPoints = getDeclaredPoints(field, parseFloat); //TODO add per-field parser
    var field_linear = linear(allFrames, [...declaredPoints.keys()], [...declaredPoints.values()]);
    var field_poly = polynomial(allFrames, [...declaredPoints.keys()], [...declaredPoints.values()]);
    var field_step = step(allFrames, [...declaredPoints.keys()], [...declaredPoints.values()]);
  
    return allFrames.map((frame) => {
      return {
        ['linear']: field_linear[frame],
        ['poly']: field_poly[frame],
        ['step']: field_step[frame],
      }
    });
  }

  // Evaluation of parsec interpolation lang
  function interpret(ast, allInterps, field) {
    switch (ast.operator) {
      case 'L':
        return f => {
          return allInterps[field][f]['linear'];
        }
      case 'P':
        return f => allInterps[field][f]['poly'];
      case 'S':
        return f => allInterps[field][f]['step'];
      case 'osc':
        return f => {
          //let [centre, phase, period, amp] = ast.operands.map(parseFloat);
          let [centre, phase, period, amp] = ast.operands;
          return parseFloat(centre) + Math.sin((parseFloat(phase) + parseFloat(f)) * Math.PI * 2 / parseFloat(period)) * parseFloat(amp);
        };
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

  return (
    <Grid container spacing={2} sx={{
      '--Grid-borderWidth': '1px',
      borderTop: 'var(--Grid-borderWidth) solid',
      borderLeft: 'var(--Grid-borderWidth) solid',
      borderColor: 'divider',
      '& > div': {
        borderRight: 'var(--Grid-borderWidth) solid',
        borderBottom: 'var(--Grid-borderWidth) solid',
        borderColor: 'divider',
      },
    }}>
      <CssBaseline />
      <Grid xs={8}>
        <h3>Prompts</h3>
        <FormControl fullWidth>
          {prompts.map((prompt, i) => <div>
            <TextField
              id={"positive_prompt_" + i}
              label={"Positive prompt " + (i + 1)}
              multiline
              rows={2}
              // value={prompt.positive}
              style={{ width: '50%' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              onChange={handleChangePrompts}
              variant="outlined" />
            <TextField
              id={"negative_prompt_" + i}
              label={"Negative prompt " + (i + 1)}
              multiline
              rows={2}
              // value={prompt.negative}
              style={{ width: '50%' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              onChange={handleChangePrompts}
              variant="outlined" />
          </div>
          )}

        </FormControl>
      </Grid>
      <Grid xs={4}>
        <h3>Options</h3>
        {/* <Tooltip2 title="Drop or duplicate frames from the input to process frames at this rate (leave blank to use all frames from the input):"> */}
        <TextField
          id={"input_fps"}
          label={"Input FPS"}
          InputProps={{ style: { fontSize: '0.75em' } }}
          variant="outlined" /><br />
        {/* </Tooltip2> */}
        {/* <Tooltip2 title="Render generated video at this frame rate (leave blank to use same as original input video)"> */}
        <TextField
          id={"output_fps"}
          label={"Output FPS"}
          InputProps={{ style: { fontSize: '0.75em' } }}
          variant="outlined" /><br />
        {/* </Tooltip2>             */}
        <TextField
          id={"cc_window_width"}
          label={"CC window width"}
          InputProps={{ style: { fontSize: '0.75em' } }}
          variant="outlined" /><br />
        <TextField
          id={"cc_window_delay"}
          label={"CC window delay"}
          InputProps={{ style: { fontSize: '0.75em' } }}
          variant="outlined" />
      </Grid>
      <Grid xs={10}>
        <h3>Keyframes and parameter flow</h3>
        <div className="ag-theme-alpine" style={{ width: '100%', height: 300 }}>
          <AgGridReact
            ref={gridRef} // Ref for accessing Grid's API
            rowData={default_keyframes} // Row Data for Rows
            columnDefs={columnDefs} // Column Defs for Columns
            defaultColDef={defaultColDef} // Default Column Properties
            animateRows={true} // Optional - set to 'true' to have rows animate when sorted
            onCellValueChanged={onCellValueChanged} // TODO - validation
            onCellKeyPress={onCellKeyPress}
            onGridReady={onGridReady}
          //onCellClicked={cellClickedListener} // Optional - registering for Grid Event
          />
        </div>
        <button onClick={addRow}>Add row (ctrl-a)</button>
        <button onClick={deleteRow}>Delete row (ctrl-d)</button>
        <button onClick={render}>Render (ctrl-enter)</button>
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
        <h3>Visualise parameter flow</h3>
        <LineChart width={800} height={300} data={renderedData.rendered_frames}>
          {visFields.map((field) => <Line type="monotone" dataKey={field} dot="{ stroke: '#8884d8' }" stroke='#8884d8' activeDot={{ r: 8 }} />)}
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis dataKey="frame" />
          <YAxis />
          <Tooltip />
        </LineChart>
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
      <Grid xs={6}>
        <h3>Output</h3>
        <TextField
          style={{ width: '100%' }}
          id="filled-multiline-static"
          label="Rendered output"
          multiline
          rows={10}
          InputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
          value={JSON.stringify(renderedData, null, 4)}
          variant="filled"
        />
      </Grid>
      <Grid xs={6}>
        Buttons and status
      </Grid>
    </Grid>
  );
};

export default App;

