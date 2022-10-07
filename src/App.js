import React, { useState, useRef, useEffect, useMemo, useCallback} from 'react';
import { render } from 'react-dom';
import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import { linear, step, polynomial } from 'everpolate'

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css'

const App = () => {

 const gridRef = useRef(); // Optional - for accessing Grid's API
 const [rowData, setRowData] = useState(); // Set rowData to Array of Objects, one Object per Row

 // Each Column Definition results in one Column.
 const [columnDefs, setColumnDefs] = useState([
    {
      headerName:'Frame #',
      field: 'frame',
      comparator: (valueA, valueB, nodeA, nodeB, isDescending) => valueA - valueB,
      sort: 'asc'
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
     resizable: true
   }));

 // Example of consuming Grid Event
 const cellClickedListener = useCallback( event => {
   console.log('cellClicked', event);
 }, []);

 // Example load data from sever
 useEffect(() => {
  setRowData([{frame:0, seed: -1, denoise:0.6, rotx:0, roty:0, rotz:0, panx:0, pany:0, zoom:0, blend:3, bd:0.5, prompt:"hello fafsafsa fasfaa"}]);
 }, []);

 const addEmpty = useCallback((addIndex) => {
  const newItem = [{}];
  const res = gridRef.current.api.applyTransaction({
    add: newItem,
    addIndex: addIndex,
  });
  gridRef.current.api.sizeColumnsToFit();
}, []);

const onCellValueChanged = useCallback((event) => {
  console.log(event);
  gridRef.current.api.onSortChanged();

  var denoisePoints = getFieldColumn(gridRef, 'denoise', parseFloat);

  var firstFrame = Math.min(...denoisePoints.keys())
  var lastFrame = Math.max(...denoisePoints.keys())
  var length = lastFrame - firstFrame + 1
  var allFrames = Array.from({length:length},(v,k)=>k+firstFrame)

  console.log(denoisePoints)

  var denoise_linear = linear(allFrames, [...denoisePoints.keys()], [...denoisePoints.values()])
  var denoise_poly = polynomial(allFrames, [...denoisePoints.keys()], [...denoisePoints.values()])
  var denoise_step = step(allFrames, [...denoisePoints.keys()], [...denoisePoints.values()])

  var denoiseLinearMap = new Map(zip(allFrames, denoise_linear))
  var denoisePolyMap = new Map(zip(allFrames, denoise_poly))
  var denoiseStepMap = new Map(zip(allFrames, denoise_step))

  console.log(denoiseLinearMap)
  console.log(denoisePolyMap)
  console.log(denoiseStepMap)
  
  setRawData(denoiseLinearMap)

});



const [rawData, setRawData] = useState("foo");

 return (
   <div>

     {/* Example using Grid's API */}
     <button onClick={addEmpty}>Add row</button>

     {/* On div wrapping Grid a) specify theme CSS Class Class and b) sets Grid size */}
     <div className="ag-theme-alpine" style={{width: '100%', height: 500}}>

       <AgGridReact
           ref={gridRef} // Ref for accessing Grid's API

           rowData={rowData} // Row Data for Rows

           columnDefs={columnDefs} // Column Defs for Columns
           defaultColDef={defaultColDef} // Default Column Properties

           animateRows={true} // Optional - set to 'true' to have rows animate when sorted
           rowSelection='multiple' // Options - allows click selection of rows
           onCellValueChanged={onCellValueChanged}

           //onCellClicked={cellClickedListener} // Optional - registering for Grid Event
           />
     </div>
     <div>
     <pre>{rawData}</pre>
     </div>     
   </div>

 );
};

export default App;

function getFieldColumn(gridRef, field, parser) {

  var vals = new Map();
  gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
    var frame = rowNode.data['frame'];
    var fieldValue = parser(rowNode.data[field]);
    vals.set(frame, fieldValue)
  });
  return vals;
}

const zip = (a, b) => a.map((k, i) => [k, b[i]]);
