import React, { useState, useRef, useEffect, useMemo, useCallback} from 'react';
import { render } from 'react-dom';
import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import { linear, step, polynomial } from 'everpolate'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css'

const App = () => {

 const gridRef = useRef(); // Optional - for accessing Grid's API
 const [rowData, setRowData] = useState(); // Set rowData to Array of Objects, one Object per Row

 // Each Column Definition results in one Column.
 const [columnDefs, setColumnDefs] = useState([
    {
      headerName:'rowId',
      comparator: (valueA, valueB, nodeA, nodeB, isDescending) => valueA - valueB,
      valueGetter: 'node.id',
    },  
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
    {
      headerName:'➟',
      field: 'seed_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'denoise'
    },
    {
      headerName:'➟',
      field: 'denoise_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'rotx'
    },
    {
      headerName:'➟',
      field: 'rotx_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'roty'
    },
    {
      headerName:'➟',
      field: 'roty_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'rotz'
    },
    {
      headerName:'➟',
      field: 'rotz_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'panx'
    },
    {
      headerName:'➟',
      field: 'panx_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'pany'
    },
    {
      headerName:'➟',
      field: 'pany_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'zoom'
    },
    {
      headerName:'➟',
      field: 'zoom_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'blend'
    },
    {
      headerName:'➟',
      field: 'blend_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
    {
      field: 'bd'
    },
    {
      headerName:'➟',
      field: 'bd_i',
      cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['.', '⎍', '/', '∿'],
        }
    },
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

 // Example load data from sever
 useEffect(() => {
  setRowData([
    {frame:0, seed: -1, denoise:0.6, rotx:0, roty:0, rotz:0, panx:0, pany:0, zoom:0, blend:3, bd:0.5, prompt:"hello fafsafsa fasfaa"},
    {frame:10, seed: -1, denoise:0.6, rotx:0, roty:0, rotz:0, panx:0, pany:0, zoom:0, blend:3, bd:0.5, prompt:"hello fafsafsa fasfaa"}
  ]);

 }, []);

 const addRow = useCallback((frame) => {
  console.log("frame to add:", frame)
  if (gridRef.current.api.getRowNode(frameIdMap.get(frame)) == undefined) {
    const res = gridRef.current.api.applyTransaction({
      add: [{"frame": frame}],
      addIndex: frame,
    });
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();    
  } else {
    console.log("frame already exists");
  }
}, []);

const deleteRow = useCallback((frame) => {
  console.log("frame to delete:", frame)
  const res = gridRef.current.api.applyTransaction({
    remove: [{frame: frame}]
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
  ['denoise', 'rotx', 'roty', 'rotz', 'panx', 'pany', 'zoom', 'blend', 'bd'].forEach((field) => {
    console.log("Computing interpolations for: ", field);
    allInterps[field] = computeAllInterpolations(gridRef, field);
  });


  var data = [];  
  ['denoise', 'rotx', 'roty', 'rotz', 'panx', 'pany', 'zoom', 'blend', 'bd'].forEach((field) => {
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
        [field]: allInterps[field][frame][interp]
      }
      previousInterp = interp;
    });
  });
  
  console.log(data);
  setRawData(data);

});

const [rawData, setRawData] = useState([]);

const [frameIdMap, setFrameIdMap] = useState(new Map());

const renderLineChart = (
  <LineChart width={600} height={300} data={rawData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
    <Line type="monotone" dataKey="denoise" dot="{ stroke: '#8884d8' }" stroke='#8884d8' activeDot={{r: 8}}/>
    <Line type="monotone" dataKey="zoom" dot="{ stroke: '#4884d8' }" activeDot={{r: 8}}/>
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
      deleteRow(e.node.data.frame);
    }
  }
}, []);

// const getRowId = useMemo(() => {
//   return (params) => params.data.frame;
// }, []);

 return (
   <div>

     {/* On div wrapping Grid a) specify theme CSS Class Class and b) sets Grid size */}
     <div className="ag-theme-alpine" style={{width: '100%', height: 500}}>

       <AgGridReact
           ref={gridRef} // Ref for accessing Grid's API

           rowData={rowData} // Row Data for Rows

           columnDefs={columnDefs} // Column Defs for Columns
           defaultColDef={defaultColDef} // Default Column Properties

           animateRows={true} // Optional - set to 'true' to have rows animate when sorted
           rowSelection='multiple' // Options - allows click selection of rows
          onCellValueChanged={onCellValueChanged} // TODO - validation
           onCellKeyPress={onCellKeyPress}
          //  getRowId={getRowId}

           //onCellClicked={cellClickedListener} // Optional - registering for Grid Event
           />
     </div>
     <button onClick={addRow}>Add row (+)</button>
     <button onClick={deleteRow}>Delete row (\)</button>
     <button onClick={render}>Render</button>

     <div>
      <pre>{JSON.stringify(rawData)}</pre>
     </div>     
     {<div> {renderLineChart} </div>}
   </div>

 );
};

export default App;

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
    vals.set(frame, fieldValue)
  });
  return vals;
}

const zip = (a, b) => a.map((k, i) => [k, b[i]]);
