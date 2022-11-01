import { AgGridReact } from 'ag-grid-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel, FormGroup, Tooltip as Tooltip2 } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import stc from 'string-to-color';
import { defaultInterpolation, interpret, InterpreterContext, parse } from './parseq-lang-interpreter';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css';


// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";

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
const version = "0.02"
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

// eslint-disable-next-line
const default_prompts = {
  positive: "A cat :${prompt_weight_1} AND a dog :${prompt_weight_2} AND a duck :${prompt_weight_3} AND a psychopath :${prompt_weight_4}",
  negative: "boring"
}
const default_options = {
  input_fps: "",
  bpm: 140,
  output_fps: 20,
  cc_window_width: 0,
  cc_window_slide_rate: 1,
  cc_use_input: false
}

function loadFromQueryString(key) {
  let qps = new URLSearchParams(window.location.search);
  let loadedStateStr = qps.get("parseq") || qps.get("parsec");
  if (loadedStateStr) {
    let loadedState = JSON.parse(loadedStateStr);
    return loadedState[key];
  }
}

const GridTooltip = (props) => {
  const data = props.api.getDisplayedRowAtIndex(props.rowIndex).data;
  return (
      <div style={{backgroundColor: '#d0ecd0'}}>
        <div>Frame: {data.frame}</div>
        <div>Seconds: {(data.frame / props.getFps()).toFixed(3)}</div>
        <div>Beat:  {(data.frame/props.getFps()/60*props.getBpm()).toFixed(3)}</div>        
      </div>
  );
};  

const ParseqUI = (props) => {

  const gridRef = useRef();
  const interpolatable_fields = props.interpolatable_fields;
  const default_keyframes = props.default_keyframes;

  //////////////////////////////////////////
  // App State
  //////////////////////////////////////////
  const [options, setOptions] = useState(loadFromQueryString('options') || default_options)
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
      },
      tooltipField: 'frame',
      tooltipComponent: GridTooltip,
      tooltipComponentParams: {getBpm: _ => options.bpm, getFps: _ => options.output_fps},
    },
    ...interpolatable_fields.flatMap(field => [
      {
        field: field,
        valueSetter: (params) => {
          params.data[field] = isNaN(parseFloat(params.newValue)) ? "" : parseFloat(params.newValue);
          setNeedsRender(true);
        }
      },
      {
        headerName: '➟',
        field: field + '_i',
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
        cellEditorParams: {
            maxLength: 1000,
            rows: 2,
            cols: 50
        }        
      }
    ])
  ]);
  const [renderedData, setRenderedData] = useState([]);
  const [graphableData, setGraphableData] = useState([]);  
  const [renderedErrorMessage, setRenderedErrorMessage] = useState("");

  const [frameToAdd, setFrameToAdd] = useState();
  const [frameToDelete, setFrameToDelete] = useState();
  const [needsRender, setNeedsRender] = useState(true);
  const [frameIdMap, setFrameIdMap] = useState(new Map());
  const [displayFields, setDisplayFields] = useState(interpolatable_fields);
  const [visFields, setVisFields] = useState(['noise', 'prompt_weight_1', 'prompt_weight_2', 'prompt_weight_3', 'prompt_weight_4']);
  const [prompts, setPrompts] = useState(loadFromQueryString('prompts') || default_prompts);
  const [graphAsPercentages, setGraphAsPercentages] = useState(true);


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
    },
    tooltipComponent: GridTooltip,
  }));

  //////////////////////////////////////////
  // Grid action callbacks 
  const addRow = useCallback((frame) => {
    if (isNaN(frame)) {
      console.error(`Invalid frame: ${frame}`)
      return;
    }

    while (gridRef.current.api.getRowNode(frameIdMap.get(frame)) !== undefined) {
      // Add frame in closest next free slot.
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
    if (isNaN(frame)) {
      console.error(`Invalid frame: ${frame}`)
      return;
    }
    if (typeof frameIdMap.get(frame) === "undefined") {
      console.error(`No such frame: ${frame}`)
      return;      
    }

    let keyframes = getKeyframes()
    if (keyframes.length<=2) {
      console.error("There must be at least 2 keyframes. Can't delete any more.")
      return;
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
    let [pos_or_neg, _] = id.split(/_/);
    prompts[pos_or_neg] = value;
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

  const handleChangeGraphType = useCallback((e) => {
    setGraphAsPercentages(e.target.checked);
    render()
  }, []);

  const [openAddRowDialog, setOpenAddRowDialog] = React.useState(false);
  const handleClickOpenAddRowDialog = () => {
    setOpenAddRowDialog(true);
  };
  const handleCloseAddRowDialog = (e) => {
    setOpenAddRowDialog(false);

    if (e.target.id==="add") {
      console.log(`add ${frameToAdd}`)
      addRow(parseInt(frameToAdd));
    }    

  };

  const [openDeleteRowDialog, setOpenDeleteRowDialog] = React.useState(false);
  const handleClickOpenDeleteRowDialog = () => {
    setOpenDeleteRowDialog(true);
  };
  const handleCloseDeleteRowDialog = (e) => {
    setOpenDeleteRowDialog(false);

    if (e.target.id==="delete") {
      console.log(`deleting ${frameToDelete}`)
      deleteRow(parseInt(frameToDelete));
    }

  };  

  function setQueryParamState() {
    const url = new URL(window.location);
    let qp = getPersistableState();
    url.searchParams.delete('parsec');
    url.searchParams.set('parseq', JSON.stringify(qp));
    window.history.replaceState({}, '', url);
  }

  function getPersistableState() {
    return {
      "meta": { "version": version },
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
    (interpolatable_fields.concat(['frame'])).forEach((field) => {
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

    // Calculate actual rendered value for all interpolatable fields
    interpolatable_fields.forEach((field) => {
      const filtered = keyframes.filter(kf => !(kf[field] === undefined || isNaN(kf[field]) ||  kf[field] === ""))
      const definedFrames = filtered.map(kf => kf.frame);
      const definedValues = filtered.map(kf => Number(kf[field]))
      let lastInterpolator = f => defaultInterpolation(definedFrames, definedValues, f);

      all_frame_numbers.forEach((frame, i) => {

        let declaredRow = gridRef.current.api.getRowNode(frameIdMap.get(frame));
        let interpolator = lastInterpolator;

        if (declaredRow !== undefined) {
          var toParse = declaredRow.data[field + '_i'];
          if (toParse) {
            let result; 
            try {       
              result = parse(toParse);
            } catch (error) {
                console.error(error);
                setRenderedErrorMessage(`Error parsing interpolation for ${field} at frame ${frame} (value: <pre>${toParse}</pre>): ` + error);
            }
            var context = new InterpreterContext({
              fieldName: field,
              thisKf: frame,
              definedFrames: definedFrames,
              definedValues: definedValues,
              FPS: options.output_fps,
              BPM: options.bpm,
            });

            try {
              interpolator = interpret(result, context);
            } catch (error) {
              console.error(error);
              setRenderedErrorMessage(`Error parsing interpolation for ${field} at frame ${frame} (${toParse}): ` + error);              
              interpolator = lastInterpolator;
            }
          }
        }
        let computed_value = 0;
        try {
          computed_value = interpolator(frame) 
        } catch (error) {
          console.error(error);
          setRenderedErrorMessage(`Error invoking interpolation for ${field} at frame ${frame} (${toParse}): ` + error);              
        }

        rendered_frames[frame] = {
          ...rendered_frames[frame] || {},
          frame: frame,
          [field]: computed_value
        }
        lastInterpolator = interpolator;
      });
    });

    // Calculate rendered prompt based on prompts and weights
    all_frame_numbers.forEach((frame) => {

      let positive_prompt = prompts.positive
                              .replace(/\$\{(.*?)\}/g, (_,weight) => rendered_frames[frame][weight])
                              .replace(/(\n)/g," ");
      let negative_prompt = prompts.negative
                              .replace(/\$\{(.*?)\}/g, (_,weight) => rendered_frames[frame][weight])
                              .replace(/(\n)/g," ");

      rendered_frames[frame] = {
        ...rendered_frames[frame] || {},
        positive_prompt: positive_prompt,
        negative_prompt: negative_prompt,
        deforum_prompt: `${positive_prompt} --neg ${negative_prompt}`
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

    var graphable_data = []
    interpolatable_fields.forEach((field) => {
      var maxValue = Math.max(...rendered_frames.map( rf => Math.abs(rf[field])))
      all_frame_numbers.forEach((frame) => {
        graphable_data[frame] = {
          ...graphable_data[frame] || {},
          "frame": frame,
          [field]: rendered_frames[frame][field],
          [field+"_pc"]: (maxValue !== 0) ? rendered_frames[frame][field]/maxValue*100 : rendered_frames[frame][field]
        }
      });
    });

    setRenderedData(data);
    setGraphableData(graphable_data);    
    setNeedsRender(false);
  });


  let addRowDialog = <Dialog open={openAddRowDialog} onClose={handleCloseAddRowDialog}>
  <DialogTitle><AddIcon />Add a keyframe</DialogTitle>
  <DialogContent>
    <DialogContentText>
    Add a keyframe at the following position:
    </DialogContentText>
    <TextField
      autoFocus
      margin="dense"
      id="add_keyframe_at"
      label="Frame"
      variant="standard"
      defaultValue={frameToAdd}
      onChange={(e) => setFrameToAdd(e.target.value)}
    />
  <DialogContentText>
  <small><small>TODO: warning here if frame doesn't exist</small></small>
  </DialogContentText>    
  </DialogContent>  
  <DialogActions>
    <Button id="cancel_add" onClick={handleCloseAddRowDialog}>Cancel</Button>
    <Button variant="contained"  id="add" onClick={handleCloseAddRowDialog}>Add</Button>
  </DialogActions>
</Dialog>

let deleteRowDialog = <Dialog open={openDeleteRowDialog} onClose={handleCloseDeleteRowDialog}>
<DialogTitle><DeleteIcon />Delete a keyframe</DialogTitle>
<DialogContent>
  <DialogContentText>
  Delete a keyframe at the following position. NB: this cannot be undone!:
  </DialogContentText>
  <TextField
    autoFocus
    margin="dense"
    id="delete_keyframe_at"
    label="Frame"
    variant="standard"
    defaultValue={frameToDelete}
    onChange={(e) => setFrameToDelete(e.target.value)}    
  />
  <DialogContentText>
    <small><small>TODO: warning here if frame doesn't exist</small></small>
  </DialogContentText>
</DialogContent>
<DialogActions>
  <Button id="cancel_delete" onClick={handleCloseDeleteRowDialog}>Cancel</Button>
  <Button variant="contained"  id="delete" onClick={handleCloseDeleteRowDialog}>Delete</Button>
</DialogActions>
</Dialog>


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
      <Grid xs={10}>
        <h3>Keyframes for parameter flow</h3>
        <Tooltip2 title="Output Frames per Second: generate video at this frame rate. You can specify interpolators based on seconds, e.g. sin(p=1s). Parseq will use your Output FPS to convert to the correct number of frames when you render.">
            <TextField
              id={"options_output_fps"}
              label={"Output FPS"}
              defaultValue={options['output_fps']}
              onChange={handleChangeOption}
              style={{ marginBottom: '10px', marginTop: '0px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              size="small"
              variant="standard" />
        </Tooltip2>
        <Tooltip2 title="Beats per Minute: you can specify wave interpolators based on beats, e.g. sin(p=1b). Parseq will use your BPM and Output FPS value to determine the number of frames per beat when you render.">
            <TextField
              id={"options_bpm"}
              label={"BPM"}
              defaultValue={options['bpm']}
              onChange={handleChangeOption}
              style={{ marginBottom: '10px', marginTop: '0px', marginLeft: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              size="small"
              variant="standard" />
        </Tooltip2>        
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
            tooltipShowDelay={0} />
        </div>
        <Button variant="outlined" style={{ marginRight: 10}} onClick={handleClickOpenAddRowDialog}>Add keyframe (ctrl-a)</Button>
        <Button variant="outlined" style={{ marginRight: 10}} onClick={handleClickOpenDeleteRowDialog}>Delete keyframe (ctrl-d)</Button>
        <Button variant="contained" style={{ marginRight: 10}} onClick={render}>Render (ctrl-r)</Button>
        {addRowDialog}
        {deleteRowDialog}
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
          {interpolatable_fields.map((field) => (
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
        <FormControlLabel control={
                <Checkbox defaultChecked={true}
                  id={"graph_as_percent"}
                  onChange={handleChangeGraphType}
                 />}
                label="Show as percentage of max" />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }} data={ graphableData }>
            {visFields.map((field) => <Line type="monotone" dataKey={ graphAsPercentages ? `${field}_pc` : field} dot={'{ stroke:' + stc(field) + '}'} stroke={stc(field)} activeDot={{ r: 8 }} />)}
            <Legend layout="horizontal" wrapperStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #d5d5d5', borderRadius: 3, lineHeight: '40px' }} />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            {getKeyframes().map((keyframe) => <ReferenceLine x={keyframe.frame} stroke="green" strokeDasharray="2 2" />)}
            <ReferenceLine y={0} stroke="black" />
            <XAxis dataKey="frame" />
            <YAxis />
            <Tooltip
              formatter = {(value, name, props) => {
                let fieldName = name.replace(/_pc$/, '');
                return [`${props.payload[fieldName].toFixed(3)} (${props.payload[fieldName+'_pc'].toFixed(3)}% of max used)`, fieldName];
              }}
              contentStyle={{ fontSize: '0.8em', fontFamily: 'Monospace' }}
              />
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
          {interpolatable_fields.map((field) => (
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
            <TextField
              id={"positive_prompt"}
              label={"Positive prompt"}
              multiline
              rows={4}
              defaultValue={prompts.positive}
              style={{marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              onChange={handleChangePrompts}
              size="small"
              variant="standard" />
            <TextField
              hiddenLabel
              id={"negative_prompt"}
              label={"Negative prompt"}
              multiline
              rows={4}
              defaultValue={prompts.negative}
              style={{marginTop: '10px', marginRight: '10px' }}
              InputProps={{ style: { fontSize: '0.75em' } }}
              onChange={handleChangePrompts}
              size="small"
              variant="standard" />
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

export default ParseqUI;