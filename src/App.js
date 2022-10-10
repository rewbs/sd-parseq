import React, { useState, useRef, useEffect, useMemo, useCallback} from 'react';
import { render } from 'react-dom';
import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import { linear, step, polynomial } from 'everpolate'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css'

const interpolatableFields = ['seed', 'denoise', 'scale', 'rotx', 'roty', 'rotz', 'panx', 'pany', 'zoom', 'loopback_frames', 'loopback_decay'];
const App = () => {

const gridRef = useRef();
const [rowData, setRowData] = useState();
const [rawData, setRawData] = useState([]);
const [frameIdMap, setFrameIdMap] = useState(new Map());
const [selectedField, setSelectedField] = useState("denoise");

const [columnDefs, setColumnDefs] = useState([
    // {
    //   headerName:'rowId',
    //   comparator: (valueA, valueB, nodeA, nodeB, isDescending) => valueA - valueB,
    //   valueGetter: 'node.id',
    // },  
    {
      headerName:'Frame #',
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
    {
      field: 'seed'
    },
    interpolationColumn('seed'),
    {
      field: 'scale'
    },
    interpolationColumn('scale'),    
    {
      field: 'denoise'
    },
    interpolationColumn('denoise'),
    {
      field: 'rotx'
    },
    interpolationColumn('rotx'),
    {
      field: 'roty'
    },
    interpolationColumn('roty'),
    {
      field: 'rotz'
    },
    interpolationColumn('rotz'),
    {
      field: 'panx'
    },
    interpolationColumn('panx'),
    {
      field: 'pany'
    },
    interpolationColumn('pany'),
    {
      field: 'zoom'
    },
    interpolationColumn('zoom'),    
    {
      field: 'loopback_frames'
    },
    interpolationColumn('loopback_frames'),
    {
      field: 'loopback_decay'
    },
    interpolationColumn('loopback_decay'),       
    {
      field: 'prompt',
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true,
      cellEditorParams: {
          rows: 10,
          cols: 50
      }      
    }
]);

// DefaultColDef sets props common to all Columns
const defaultColDef = useMemo( ()=> ({
    editable: true,
    resizable: true,
    suppressKeyboardEvent: (params) => {
      return params.event.key === '+'
      || (params.event.key === '\\');
    }
  }));

// Example of consuming Grid Event
const cellClickedListener = useCallback( event => {
  console.log('cellClicked', event);
}, []);

// Load initial data
useEffect(() => {
  setRowData([
    {frame:0, seed: -1, scale:7.5, denoise:0.6, rotx:0, roty:0, rotz:0, panx:0,
      pany:0, zoom:0, loopback_frames:1, loopback_decay:0.5,
      prompt:"hello fafsafsa fasfaa"},
    {frame:199, seed: -1, scale:7.5, denoise:0.6, rotx:0, roty:0, rotz:0, panx:0,
      pany:0, zoom:0, loopback_frames:1, loopback_decay:0.5,
      prompt:"hello fafsafsa fasfaa"}
  ]);
}, []);

const addRow = useCallback((frame) => {
  
  while (gridRef.current.api.getRowNode(frameIdMap.get(frame)) != undefined) {
   ++frame; 
  }

  console.log("frame to add:", frame)
  const res = gridRef.current.api.applyTransaction({
    add: [{"frame": frame}],
    addIndex: frame,
  });
  frameIdMap.set(frame, res.add[0].id);
  gridRef.current.api.onSortChanged();
  gridRef.current.api.sizeColumnsToFit();    

  console.log(frameIdMap);
}, []);

const deleteRow = useCallback((rowId) => {
  console.log("frame to delete:", rowId)
  let rowData = gridRef.current.api.getRowNode(rowId).data;
  console.log(rowData);
  frameIdMap.delete(rowData.frame);
  const res = gridRef.current.api.applyTransaction({
    remove: [ rowData ]
  });
  gridRef.current.api.onSortChanged();
  gridRef.current.api.sizeColumnsToFit();
}, []);

const onCellValueChanged = useCallback((event) => {
  gridRef.current.api.onSortChanged();
});


const render = useCallback((event) => {
  gridRef.current.api.onSortChanged();

  var allInterps = {};
  interpolatableFields.forEach((field) => {
    console.log("Computing interpolations for: ", field);
    allInterps[field] = computeAllInterpolations(gridRef, field);
  });

  var data = [];
  var lastPrompt = ""
  interpolatableFields.forEach((field) => {
    var previousInterp = 'linear';
    getAllFrames(gridRef).forEach((frame, i) => {

      let declaredRow = gridRef.current.api.getRowNode(frameIdMap.get(frame));
      console.log(declaredRow);
      var interp = previousInterp;
      if (declaredRow != undefined && declaredRow.data[field+'_i']  != undefined) {
        console.log("interp for frame", frame, "is", declaredRow.data[field+'_i']);
        if (declaredRow.data[field+'_i'] == '∿') {
          interp = 'poly';
        } else if  (declaredRow.data[field+'_i'] == '⎍') {
          interp = 'step';
        } else {
          interp = 'linear';
        }
      }
      console.log("interp for frame", frame, "is", interp);
      data[i] =  {
        ... data[i] || {},
        frame: frame,
        prompt: (declaredRow != undefined && declaredRow.data.prompt != undefined) ? declaredRow.data.prompt : lastPrompt,
        [field]: allInterps[field][frame][interp]
      }
      previousInterp = interp;
      lastPrompt = data[i].prompt;
    });
  });
  
  console.log(data);
  setRawData(data);

});


const renderLineChart = (
  <LineChart width={800} height={300} data={rawData}>
    <Line type="monotone" dataKey={selectedField} dot="{ stroke: '#8884d8' }" stroke='#8884d8' activeDot={{r: 8}}/>
    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
    <XAxis dataKey="frame" />
    <YAxis />
    <Tooltip />
  </LineChart>
);

const onCellKeyPress = useCallback((e) => {
  if (e.event) {
    var keyPressed = e.event.key;
    if (keyPressed === '+') {
      addRow(parseInt(e.node.data.frame) + 1);
    } else if (keyPressed === '\\') {
      console.log(e.node);
      deleteRow(e.node.id);
    }
  }
}, []);

const selectChange = useCallback((e) => {
  console.log(e.target.value);
  setSelectedField(e.target.value);
}, []);

 return (
<Grid container spacing={2}>
<CssBaseline />  
  <Grid xs={12}>
     {/* On div wrapping Grid a) specify theme CSS Class Class and b) sets Grid size */}
     <div className="ag-theme-alpine" style={{width: '100%', height: 300}}>

       <AgGridReact
           ref={gridRef} // Ref for accessing Grid's API
           rowData={rowData} // Row Data for Rows
           columnDefs={columnDefs} // Column Defs for Columns
           defaultColDef={defaultColDef} // Default Column Properties
           animateRows={true} // Optional - set to 'true' to have rows animate when sorted
           onCellValueChanged={onCellValueChanged} // TODO - validation
           onCellKeyPress={onCellKeyPress}
           //onCellClicked={cellClickedListener} // Optional - registering for Grid Event
           />
     </div>
     <button onClick={addRow}>Add row (+)</button>
     <button onClick={deleteRow}>Delete row (\)</button>
     <button onClick={render}>Render</button>
  </Grid>
  <Grid xs={4}>
    <TextField
          style={{width: '100%'}}
          id="filled-multiline-static"
          label="Rendered output"
          multiline
          rows={10}
          InputProps={{ style: { fontFamily: 'Monospace',fontSize: '0.75em' } }}
          value={JSON.stringify(rawData, null, 4)}
          variant="filled"
      />      
  </Grid>
  <Grid xs={8}>
    {<div> {renderLineChart} </div>}
    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">Field</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        label="field"
        onChange={selectChange}
      >
        {interpolatableFields.map((field, i) => <MenuItem value={field}>{field}</MenuItem>)}
      </Select>
    </FormControl>     
  </Grid>    
</Grid>
 );
};

export default App;

function interpolationColumn(field) {
  return {
    headerName: '➟',
    field: field+'_i',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['/', '∿', '⎍'],
    }
  };
}

// Returns array of objects with values for all interpolation types for each frame.
function computeAllInterpolations(gridRef, field) {
  var allFrames = getAllFrames(gridRef);
  var declaredPoints = getDeclaredPoints(gridRef, field, parseFloat); //TODO add per-field parser
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

// Returns array of every frame to render, from [startFrame, ..., endFrame]
function getAllFrames(gridRef) {
  var declaredFrames = [];
  gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
    declaredFrames.push(rowNode.data.frame);
  });

  var minFrame = Math.min(...declaredFrames);
  var maxFrame = Math.max(...declaredFrames);
  return Array.from(Array(maxFrame - minFrame + 1).keys()).map((i) => i + minFrame);
}

// Returns map of (declaredFrame => declaredValue) for field.
function getDeclaredPoints(gridRef, field, parser) {
  var vals = new Map();
  gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
    var frame = rowNode.data['frame'];
    var fieldValue = parser(rowNode.data[field]);
    if (fieldValue != undefined && !isNaN(fieldValue)) {
      vals.set(frame, fieldValue)
    }
  });
  return vals;
}
