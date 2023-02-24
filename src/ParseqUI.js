import { deepCopy } from '@firebase/util';
import { Alert, Button, Checkbox, FormControlLabel, Stack, Tooltip as Tooltip2, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { AgGridReact } from 'ag-grid-react';
import equal from 'fast-deep-equal';
import clonedeep from 'lodash.clonedeep';
import range from 'lodash.range';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import ReactTimeAgo from 'react-time-ago';
import useDebouncedEffect from 'use-debounced-effect';
import { ExpandableSection } from './components/ExpandableSection';
import { InitialisationStatus } from "./components/InitialisationStatus";
import { Preview } from "./components/Preview";
import { Prompts } from "./components/Prompts";
import { UploadButton } from "./components/UploadButton";
import { templates } from './data/templates';
import { DocManagerUI, loadVersion, makeDocId, saveVersion } from './DocManager';
import { Editable } from './Editable';
import { parseqRender } from './parseq-renderer';
import { UserAuthContextProvider } from "./UserAuthContext";
import { fieldNametoRGBa, frameToBeats, frameToSeconds, getUTCTimeStamp, getVersionNumber } from './utils';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css';

//////////////////////////////////////////
// Config
const default_prompts = {
  // eslint-disable-next-line no-template-curly-in-string
  positive: `A lone (black cat:\${prompt_weight_1}) (white duck:\${prompt_weight_2}) at midday, centered, realistic, photorealism, crisp, natural colors, fine textures, highly detailed, volumetric lighting, studio photography:`,
  negative: `(black cat:\${prompt_weight_2}) (white duck:\${prompt_weight_1})
watermark, logo, text, signature, copyright, writing, letters,
low quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry,
cartoon, computer game, video game, painting, drawing, sketch,
disfigured, deformed, ugly`
}
const default_options = {
  input_fps: "",
  bpm: 140,
  output_fps: 20,
  cc_window_width: 0,
  cc_window_slide_rate: 1,
  cc_use_input: false
}

function queryStringGetOrCreate(key, creator) {
  let qps = new URLSearchParams(window.location.search);
  let val = qps.get(key);
  if (val) {
    return val;
  } else {
    val = creator();
    qps.set(key, val);
    window.history.replaceState({}, '', `${window.location.pathname}?${qps.toString()}`);
    return val;
  }
}

const GridTooltip = (props) => {
  const data = props.api.getDisplayedRowAtIndex(props.rowIndex).data;
  return (
    <div style={{ backgroundColor: '#d0ecd0' }}>
      <div>Frame: {data.frame}</div>
      <div>Seconds: {frameToSeconds(data.frame, props.getFps()).toFixed(3)}</div>
      <div>Beat:  {frameToBeats(data.frame, props.getFps(), props.getBpm()).toFixed(3)}</div>
      <div>Info:  {data.info ? data.info : ""}</div>
    </div>
  );
};

const ParseqUI = (props) => {
  //log.debug(Date.now(), "Re-initializing ParseqUI....");

  const activeDocId = queryStringGetOrCreate('docId', makeDocId)   // Will not change unless whole page is reloaded.
  const gridRef = useRef();
  const interpolatable_fields = props.interpolatable_fields;
  const default_keyframes = props.default_keyframes;
  const default_displayFields = props.default_displayFields;
  const preventInitialRender = new URLSearchParams(window.location.search).get("noRender") === "true" || false;

  const fillWithDefaults = useCallback((possiblyIncompleteContent) => {
    if (!possiblyIncompleteContent.prompts) {
      possiblyIncompleteContent.prompts = default_prompts;
    }
    if (!possiblyIncompleteContent.keyframes) {
      // Deep copy the default keyframes so that we can still refer to the original defaults in the future (e.g. when missing a field in firs or last keyframe)
      possiblyIncompleteContent.keyframes = deepCopy(default_keyframes);
    }
    if (!possiblyIncompleteContent.displayFields) {
      possiblyIncompleteContent.displayFields = default_displayFields;
    }
    // For options we want to merge the defaults with the existing options.
    possiblyIncompleteContent.options = { ...default_options, ...(possiblyIncompleteContent.options || {}) };

    return possiblyIncompleteContent;
  }, [default_displayFields, default_keyframes]);

  const freshLoadContentToState = useCallback((loadedContent) => {
    const filledContent = fillWithDefaults(loadedContent || {});
    setPrompts(filledContent.prompts);
    setOptions(filledContent.options);
    setDisplayFields([...filledContent.displayFields]);
    setKeyframes(filledContent.keyframes);
    refreshGridFromKeyframes(filledContent.keyframes);
  }, [fillWithDefaults]);

  //////////////////////////////////////////
  // App State
  //////////////////////////////////////////
  const [renderedData, setRenderedData] = useState([]);
  const [renderedErrorMessage, setRenderedErrorMessage] = useState("");
  const [lastRenderedState, setlastRenderedState] = useState("");
  const [graphAsPercentages, setGraphAsPercentages] = useState(false);
  const [graphPromptMarkers, setGraphPromptMarkers] = useState(false);
  const [showFlatSparklines, setShowFlatSparklines] = useState(false);
  const [keyframes, setKeyframes] = useState();
  const [displayFields, setDisplayFields] = useState();
  const [options, setOptions] = useState()
  const [prompts, setPrompts] = useState();
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [enqueuedRender, setEnqueuedRender] = useState(false);
  const [autoRender, setAutoRender] = useState(!preventInitialRender);
  const [autoUpload, setAutoUpload] = useState(false);
  const [initStatus, setInitStatus] = useState({});
  const [uploadStatus, setUploadStatus] = useState(<></>);
  const [lastRenderTime, setLastRenderTime] = useState(0);
  const [gridCursorPos, setGridCursorPos] = useState(0);
  const [rangeSelection, setRangeSelection] = useState({});

  const runOnceTimeout = useRef();
  const _frameToRowId_cache = useRef();

  const isInRangeSelection = useCallback((cell) => {
    return rangeSelection.anchor && rangeSelection.tip && cell
      && cell.rowIndex >= Math.min(rangeSelection.anchor.y, rangeSelection.tip.y)
      && cell.rowIndex <= Math.max(rangeSelection.anchor.y, rangeSelection.tip.y)
      && cell.column.instanceId >= Math.min(rangeSelection.anchor.x, rangeSelection.tip.x)
      && cell.column.instanceId <= Math.max(rangeSelection.anchor.x, rangeSelection.tip.x);
  }, [rangeSelection]);

  const isSameCellPosition = (cell1, cell2) => {
    return cell1 && cell2 && cell1.rowIndex === cell2.rowIndex
      && cell1.column.instanceId === cell2.column.instanceId;
  }

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: 'Frame #',
        field: 'frame',
        comparator: (valueA, valueB, nodeA, nodeB, isDescending) => valueA - valueB,
        sort: 'asc',
        valueSetter: (params) => {
          var newValue = parseInt(params.newValue);
          params.data.frame = newValue;
        },
        pinned: 'left',
        suppressMovable: true,
      },
      {
        headerName: 'Info',
        field: 'info',
        valueSetter: (params) => {
          params.data.info = params.newValue;
        },
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
        cellEditorParams: {
          maxLength: 1000,
          rows: 2,
          cols: 50
        },
        pinned: 'left',
        suppressMovable: true,
      },
      ...interpolatable_fields.flatMap(field => [
        {
          field: field,
          valueSetter: (params) => {
            params.data[field] = isNaN(parseFloat(params.newValue)) ? "" : parseFloat(params.newValue);
          },
          suppressMovable: true,
          cellStyle: params => {
            if (isInRangeSelection(params)) {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.4),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
              }
            } else {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.1),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
              }
            }
          }

        },
        {
          headerName: '➟' + field,
          field: field + '_i',
          cellEditor: 'agLargeTextCellEditor',
          cellEditorPopup: true,
          cellEditorParams: {
            maxLength: 1000,
            rows: 2,
            cols: 50
          },
          valueSetter: (params) => {
            params.data[field + '_i'] = params.newValue;
          },
          suppressMovable: true,
          cellStyle: params => {
            if (isInRangeSelection(params)) {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.4),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid black'
              }            
            } else {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.1),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid black'
              }
            }
          }
        }
      ])
    ]
  }, [interpolatable_fields, isInRangeSelection]);

  const defaultColDef = useMemo(() => ({
    editable: true,
    resizable: true,
    tooltipField: 'frame',
    tooltipComponent: GridTooltip,
    tooltipComponentParams: { getBpm: _ => options?.bpm, getFps: _ => options?.output_fps },
    suppressKeyboardEvent: (params) => {
      return params.event.ctrlKey && (
        params.event.key === 'a'
        || params.event.key === 'd'
        || params.event.key === 'r'
      );
    }
  }), [options]);

  // Ensures that whenever any data that might affect the output changes,
  // we save the doc and notify the user that a render is required.
  // This is debounced to 200ms to avoid repeated saves if edits happen
  // in quick succession.
  useDebouncedEffect(() => {
    if (autoSaveEnabled && prompts && options && displayFields && keyframes) {
      saveVersion(activeDocId, getPersistableState());
    }
  }, 200, [prompts, options, displayFields, keyframes, autoSaveEnabled]);

  useDebouncedEffect(() => {
    if (enqueuedRender) {
      if (prompts && options && displayFields && keyframes) {
        // This is the only place we should call render explicitly.
        render();
      } else {
        // Some data was not yet initialised, render again soon.
        setTimeout(render, 100);
      }
    }
  }, 200, [enqueuedRender, prompts, options, displayFields, keyframes]);

  // Run on first load, once all react components are ready and Grid is ready.
  runOnceTimeout.current = 0;
  useEffect(() => {
    function runOnce() {
      const qps = new URLSearchParams(window.location.search);
      const qsLegacyContent = qps.get("parseq") || qps.get("parsec");
      const qsTemplate = qps.get("templateId");
      const [qsImportRemote, qsRemoteImportToken] = [qps.get("importRemote"), qps.get("token")];
      if (qsLegacyContent) {
        // Attempt to load content from querystring 
        // This is to support *LEGACY* parsrq URLs. Doesn't work in all browsers with large data.
        freshLoadContentToState(JSON.parse(qsLegacyContent));
        setInitStatus({ severity: "success", message: "Successfully imported legacy Parseq data from query string." });
        const url = new URL(window.location);
        url.searchParams.delete('parsec');
        url.searchParams.delete('parseq');
        window.history.replaceState({}, '', url);
        setAutoSaveEnabled(true);
        if (!preventInitialRender) {
          setEnqueuedRender(true);
        }
      } else if (qsTemplate) {
        if (templates[qsTemplate]) {
          freshLoadContentToState(templates[qsTemplate].template);
          setInitStatus({ severity: "success", message: `Started new document from template "${qsTemplate}".` });
          const url = new URL(window.location);
          url.searchParams.delete('templateId');
          window.history.replaceState({}, '', url);
          setAutoSaveEnabled(true);
          if (!preventInitialRender) {
            setEnqueuedRender(true);
          }
        } else {
          setInitStatus({ severity: "error", message: `Could not find template "${qsTemplate}", using default starting document.` });
        }
      } else if (qsImportRemote && qsRemoteImportToken) {
        setInitStatus({ severity: "warning", message: "Importing remote document..." });
        const encodedImport = encodeURIComponent(qsImportRemote);
        const importUrl = `https://firebasestorage.googleapis.com/v0/b/sd-parseq.appspot.com/o/shared%2F${encodedImport}?alt=media&token=${qsRemoteImportToken}`
        fetch(importUrl).then((response) => {
          if (response.ok) {
            response.json().then((json) => {
              freshLoadContentToState(json);
              setInitStatus({ severity: "success", message: "Successfully imported remote document." });
              const url = new URL(window.location);
              url.searchParams.delete('importRemote');
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url);
              setAutoSaveEnabled(true);
              if (!preventInitialRender) {
                setEnqueuedRender(true);
              }
            }).catch((error) => {
              console.error(error);
              setInitStatus({ severity: "error", message: `Failed to import document ${qsImportRemote}: ${error.toString()}` });
            });
          } else {
            console.error(response);
            setInitStatus({ severity: "error", message: `Failed to import document ${qsImportRemote}. Status: ${response.status}` });
          }
        }).catch((error) => {
          console.error(error);
          setInitStatus({ severity: "error", message: `Failed to import document ${qsImportRemote}: ${error.toString()}` });
        });
      } else {
        loadVersion(activeDocId).then((loadedContent) => {
          freshLoadContentToState(loadedContent);
          setAutoSaveEnabled(true);
          if (!preventInitialRender) {
            setEnqueuedRender(true);
          }
        });
      }
    }
    if (gridRef.current.api) {
      clearTimeout(runOnceTimeout.current);
      runOnce();
    } else {
      //log.debug("Couldn't do init, try again in 100ms.");
      clearTimeout(runOnceTimeout.current);
      runOnceTimeout.current = setTimeout(runOnce, 100);
    }
    // empty dependency array to force one off execution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frameToRowId = useCallback((frame) => {
    if (_frameToRowId_cache.current === undefined) {
      // Refresh cache.
      _frameToRowId_cache.current = new Map();
      gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
        if (rowNode.data) {
          _frameToRowId_cache.current.set(rowNode.data.frame, rowNode.id)
        }
      });
    }
    return _frameToRowId_cache.current.get(frame);
  }, [_frameToRowId_cache]);

  //////////////////////////////////////////
  // Grid action callbacks 
  const addRow = useCallback((frame) => {
    //console.log(_frameToRowId_cache);

    if (isNaN(frame)) {
      console.error(`Invalid keyframe: ${frame}`)
      return;
    }
    while (frameToRowId(frame) !== undefined) {
      // Add frame in closest next free slot.
      ++frame;
    }
    gridRef.current.api.applyTransaction({
      add: [{ "frame": frame }],
      addIndex: frame,
    });
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
    refreshKeyframesFromGrid();

    if (autoRender) {
      setEnqueuedRender(true);
    }
  }, [autoRender, frameToRowId]);

  const mergeKeyframes = useCallback((incomingKeyframes) => {
    //console.log(dataToMerge);

    // compute merged keyframes
    var keyframes_local = incomingKeyframes.map((incomingKeyframe) => {
      var existingKeyframe = keyframes.find((candidateKeyframe) => candidateKeyframe.frame === incomingKeyframe.frame);
      if (existingKeyframe) {
        // Keyframe already exists at this position, so merge it.
        return {
          ...existingKeyframe,
          ...incomingKeyframe,
          "info": "Merged: " + (existingKeyframe.info ? existingKeyframe.info : "(?)") + " + " + (incomingKeyframe.info ? incomingKeyframe.info : "(?)"),
        };
      } else {
        return incomingKeyframe;
      }
    }).concat(keyframes.filter((existingKeyframe) => !incomingKeyframes.find((incomingKeyframe) => incomingKeyframe.frame === existingKeyframe.frame)))
      .sort((a, b) => a.frame - b.frame);

    setKeyframes(keyframes_local);

    refreshGridFromKeyframes(keyframes_local)
    if (autoRender) {
      setEnqueuedRender(true);
    }

  }, [keyframes, autoRender]);


  // Resize grid to fit content
  useEffect(() => {
    if (keyframes) {
      const gridContainer = document.querySelector(".ag-theme-alpine");
      if (gridContainer) {
        gridContainer.style.height = 24 * keyframes.length + "px";
      }
    }
  }, [keyframes]);

  const deleteRow = useCallback((frame) => {
    //console.log(_frameToRowId_cache);

    if (isNaN(frame)) {
      console.error(`Invalid keyframe: ${frame}`)
      return;
    }
    if (frameToRowId(frame) === undefined) {
      console.error(`No such keyframe: ${frame}`)
      return;
    }

    if (frame === 0 || frame === keyframes[keyframes.length - 1].frame )  {
      console.error(`Cannot delete first or last frame.`)
      return;      
    }
    
    if (keyframes.length <= 2 || gridRef.current.api.getDisplayedRowCount() < 3) {
      console.error("There must be at least 2 keyframes. Can't delete any more.")
      return;
    }

    let rowData = gridRef.current.api.getRowNode(frameToRowId(frame)).data;
    gridRef.current.api.applyTransaction({
      remove: [rowData]
    });
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
    refreshKeyframesFromGrid();
    if (autoRender) {
      setEnqueuedRender(true);
    }
  }, [keyframes, autoRender, frameToRowId]);

  const onCellValueChanged = useCallback((event) => {
    gridRef.current.api.onSortChanged();
    refreshKeyframesFromGrid();

    if (autoRender) {
      setEnqueuedRender(true);
    }
  }, [gridRef, autoRender]);

  const onGridReady = useCallback((params) => {
    refreshKeyframesFromGrid();
    gridRef.current.api.onSortChanged();
    gridRef.current.api.sizeColumnsToFit();
  }, [gridRef]);

  const navigateToNextCell = useCallback((params) => {
    const previousCell = params.previousCellPosition, nextCell = params.nextCellPosition;
    if (params.event.shiftKey) {
      if (rangeSelection.anchor === undefined) {
        setRangeSelection({
          anchor: { x: previousCell.column.instanceId, y: previousCell.rowIndex },
          tip: { x: nextCell.column.instanceId, y: nextCell.rowIndex }
        })
      } else {
        setRangeSelection({
          ...rangeSelection,
          tip: { x: nextCell.column.instanceId, y: nextCell.rowIndex }
        })
      }
    } else {
      setRangeSelection({});
    }
    return nextCell;
  }, [rangeSelection]);

  const onCellKeyPress = useCallback((e) => {
    console.log(e);
    if (e.event) {
      var keyPressed = e.event.key;
      if (keyPressed === 'a' && e.event.ctrlKey) {
        addRow(parseInt(e.node.data.frame) + 1);
      } else if (keyPressed === 'd' && e.event.ctrlKey) {
        deleteRow(parseInt(e.node.data.frame));
      } else if (keyPressed === 'r' && e.event.ctrlKey) {
        setEnqueuedRender(true);
      }

    }
  }, [addRow, deleteRow]);


  // Update displayed columns when displayFields changes.
  useEffect(() => {
    if (displayFields && gridRef.current.columnApi) {
      let columnsToShow = displayFields.flatMap(c => [c, c + '_i']);
      let allColumnIds = gridRef.current.columnApi.getColumns().map((col) => col.colId)
      gridRef.current.columnApi.setColumnsVisible(allColumnIds, false);
      gridRef.current.columnApi.setColumnsVisible(columnsToShow, true);
      gridRef.current.columnApi.setColumnsVisible(['frame', 'info'], true);
      gridRef.current.api.onSortChanged();
      gridRef.current.api.sizeColumnsToFit();
    } else {
      // TODO: if we need this, we also need to cancel the timer in the good path
      // to avoid nuking displayFields by mistake. But for now I don't think we need this.
      //log.debug("Couldn't update columns, try again in 100ms.");
      // setTimeout(() => {
      //   setDisplayFields(Array.isArray(displayFields) ? [...displayFields] : []);
      // }, 100);
    }
  }, [displayFields]);


  //////////////////////////////////////////
  // Grid data accesss

  // Must be called whenever the grid data is changed, so that the updates
  // are reflected in other keyframe observers.
  function refreshKeyframesFromGrid() {
    _frameToRowId_cache.current = undefined;
    let keyframes_local = [];

    if (!gridRef || !gridRef.current || !gridRef.current.api) {
      console.log("Could not refresh keyframes from grid: grid not ready.")
      setKeyframes([]);
    }
    gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      keyframes_local.push(rowNode.data);
    });
    setKeyframes(keyframes_local);
  }

  function refreshGridFromKeyframes(keyframes) {
    if (!gridRef || !gridRef.current || !gridRef.current.api) {
      console.log("Could not refresh grid from keyframes: grid not ready.")
      return;
    }
    gridRef.current.api.setRowData(keyframes);
  }

  //////////////////////////////////////////
  // Other component event callbacks  
  const handleChangeDisplayFields = useCallback((e) => {
    let selectedToShow = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    setDisplayFields(selectedToShow);
  }, []);

  const handleChangeOption = useCallback((e) => {
    const id = e.target.id;
    // eslint-disable-next-line no-unused-vars
    let [_, optionId] = id.split(/options_/);

    const value = (optionId === 'cc_use_input') ? e.target.checked : e.target.value;
    setOptions({ ...options, [optionId]: value });
    if (autoRender) {
      setEnqueuedRender(true);
    }
  }, [autoRender, options]);

  const [frameToAdd, setFrameToAdd] = useState();
  const [openAddRowDialog, setOpenAddRowDialog] = useState(false);
  const handleClickOpenAddRowDialog = () => {
    setOpenAddRowDialog(true);
  };
  const handleCloseAddRowDialog = useCallback((e) => {
    setOpenAddRowDialog(false);
    if (e.target.id === "add") {
      addRow(parseInt(frameToAdd));
    }
  }, [addRow, frameToAdd]);
  const addRowDialog = useMemo(() =>
    <Dialog open={openAddRowDialog} onClose={handleCloseAddRowDialog}>
      <DialogTitle>➕ Add keyframe</DialogTitle>
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
        <Button size="small" id="cancel_add" onClick={handleCloseAddRowDialog}>Cancel</Button>
        <Button size="small" variant="contained" id="add" onClick={handleCloseAddRowDialog}>Add</Button>
      </DialogActions>
    </Dialog>
    , [openAddRowDialog, frameToAdd, handleCloseAddRowDialog]);

  const [openMergeKeyframesDialog, setOpenMergeKeyframesDialog] = useState(false);
  const [dataToMerge, setDataToMerge] = useState("");
  const [keyFrameMergeStatus, setKeyFrameMergeStatus] = useState(<></>);
  const [mergeEnabled, setMergeEnabled] = useState(false);
  const handleClickOpenMergeKeyframesDialog = () => {
    setOpenMergeKeyframesDialog(true);
  };
  const handleCloseMergeKeyframesDialog = useCallback((e) => {
    setOpenMergeKeyframesDialog(false);
    if (e.target.id === "merge") {
      let json = JSON.parse(dataToMerge);
      if (json['keyframes'] && Array.isArray(json['keyframes'])) {
        mergeKeyframes(json['keyframes']);
      } else if (Array.isArray(json)) {
        mergeKeyframes(json);
      } else {
        console.error('Invalid format of keyframes to merge, should have been validated in dialog.');
      }
    }
  }, [mergeKeyframes, dataToMerge]);
  const mergeKeyframesDialog = useMemo(() =>
    <Dialog open={openMergeKeyframesDialog} onClose={handleCloseMergeKeyframesDialog}>
      <DialogTitle>🌪️ Merge keyframes</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Merge keyframes from another source into the current document. For example:
          <ul>
            <li>Try the <a href={'/browser?refDocId=' + activeDocId} target='_blank' rel="noreferrer">browser</a> to find keyframe data from your other documents.</li>
            <li>⚠️ Experimental: try the <a href={'/analyser?fps=' + (options?.output_fps || 20) + '&refDocId=' + activeDocId} target='_blank' rel="noreferrer">analyser</a> to generate keyframes from audio.</li>
          </ul>
        </DialogContentText>
        <TextField
          style={{ width: '100%', paddingTop: '10px' }}
          id="merge-data"
          multiline
          onFocus={event => event.target.select()}
          rows={10}
          InputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
          placeholder="<Paste your Keyframes JSON here>"
          value={dataToMerge}
          onChange={(e) => {
            setMergeEnabled(false);
            setDataToMerge(e.target.value);

            let newKeyframes;
            let json;

            try {
              json = JSON.parse(e.target.value);
            } catch (e) {
              setKeyFrameMergeStatus(<Alert severity="error">Content to merge must be valid JSON. Got error: {e.message}</Alert>);
              return;
            }

            if (json['keyframes'] && Array.isArray(json['keyframes'])) {
              newKeyframes = json['keyframes'];
            } else if (Array.isArray(json)) {
              newKeyframes = json;
            } else {
              setKeyFrameMergeStatus(<Alert severity="error">Content to merge must be valid JSON array, or JSON object with top-level array named 'keyframes'.</Alert>);
              return;
            }

            if (!newKeyframes.every((kf) => typeof kf.frame === "number")) {
              setKeyFrameMergeStatus(<Alert severity="error">All keyframes must have a numeric 'frame' field.</Alert>);
              return;
            }

            setKeyFrameMergeStatus(<Alert severity="success">Found {newKeyframes.length} keyframes to merge.</Alert>);
            setMergeEnabled(true);
          }}
        />
        {keyFrameMergeStatus}
      </DialogContent>
      <DialogActions>
        <Button size="small" id="cancel_add" onClick={handleCloseMergeKeyframesDialog}>Cancel</Button>
        <Button disabled={!mergeEnabled} size="small" variant="contained" id="merge" onClick={handleCloseMergeKeyframesDialog}>Merge</Button>
      </DialogActions>
    </Dialog>
    , [openMergeKeyframesDialog, handleCloseMergeKeyframesDialog, activeDocId, dataToMerge, keyFrameMergeStatus, mergeEnabled, options]);

  const [framesToDelete, setFramesToDelete] = useState();
  const [openDeleteRowDialog, setOpenDeleteRowDialog] = useState(false);

  const handleClickOpenDeleteRowDialog = useCallback(() => {
    const frames = rangeSelection.anchor ?
        range(Math.min(rangeSelection.anchor.y, rangeSelection.tip.y), Math.max(rangeSelection.anchor.y, rangeSelection.tip.y)+1)
          .map((y) => gridRef.current.api.getDisplayedRowAtIndex(y).data.frame)
          .sort()
          .join(',')
      : gridRef.current.api.getFocusedCell()?.data?.frame;
    console.log(frames);
    setFramesToDelete(frames);
    setOpenDeleteRowDialog(true);
  }, [gridRef, rangeSelection]);

  const handleCloseDeleteRowDialog = useCallback((e) => {
    setOpenDeleteRowDialog(false);
    if (e.target.id === "delete") {
      for (let frame of framesToDelete.split(',')) {
        deleteRow(parseInt(frame));
      }
    }
  }, [deleteRow, framesToDelete]);

  const deleteRowDialog = useMemo(() => <Dialog open={openDeleteRowDialog} onClose={handleCloseDeleteRowDialog}>
    <DialogTitle>❌ Delete keyframes</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Delete keyframes at the following positions (enter a comma separated list).
      </DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        label="Frame"
        variant="standard"
        value={framesToDelete}
        onChange={(e) => setFramesToDelete(e.target.value)}
      />
      <DialogContentText>
          <small>Note: first and last frames cannot be deleted.</small>
      </DialogContentText>    
    </DialogContent>
    <DialogActions>
      <Button id="cancel_delete" onClick={handleCloseDeleteRowDialog}>Cancel</Button>
      <Button variant="contained" id="delete" onClick={handleCloseDeleteRowDialog}>Delete</Button>
    </DialogActions>
  </Dialog>, [openDeleteRowDialog, framesToDelete, handleCloseDeleteRowDialog]);

  // TODO: switch to useMemo that updates when elements change?
  const getPersistableState = useCallback(() => ({
    "meta": {
      "generated_by": "sd_parseq",
      "version": getVersionNumber(),
      "generated_at": getUTCTimeStamp(),
    },
    prompts: prompts,
    options: options,
    interpolatableFields: interpolatable_fields.map(s => ({ name: s })),
    displayFields: displayFields,
    keyframes: keyframes,
  }), [prompts, options, displayFields, keyframes, interpolatable_fields]);

  const needsRender = useMemo(() => {
    return !lastRenderedState
      || !equal(lastRenderedState.keyframes, keyframes)
      || !equal(lastRenderedState.options, options)
      || !equal(lastRenderedState.prompts, prompts)
  }, [lastRenderedState, keyframes, options, prompts]);

  //////////////////////////////////////////
  // Main render action callback

  const render = useCallback(() => {
    console.time('Render');
    setRenderedErrorMessage("");
    setEnqueuedRender(false);
    try {
      const data = parseqRender(getPersistableState());
      setRenderedData(data);
      setlastRenderedState({
        // keyframes stores references to ag-grid rows, which will be updated as the grid changes.
        // So if we want to compare a future grid state to the last rendered state, we need to
        // do a deep copy.
        keyframes: clonedeep(keyframes),
        prompts: clonedeep(prompts),
        options: clonedeep(options),
      });
      setLastRenderTime(Date.now());
    } catch (e) {
      console.error("Parseq renderer error: ", e);
      let errorMessage;
      if (e.message.length > 300) {
        errorMessage = e.message.substring(0, 300) + '... [See Javascript console for full error message].';
      } else {
        errorMessage = e.message;
      }
      setRenderedErrorMessage(errorMessage);
    } finally {
      console.timeEnd('Render');
    }

  }, [keyframes, prompts, options, getPersistableState]);

  const renderButton = useMemo(() =>
    <Stack>
      <Button data-testid="render-button" size="small" disabled={enqueuedRender} variant="contained" onClick={() => setEnqueuedRender(true)}>{needsRender ? '📈 Render' : '📉 Re-render'}</Button>
      {lastRenderTime ? <Typography fontSize='0.7em' >Last rendered: <ReactTimeAgo date={lastRenderTime} locale="en-US" />.</Typography> : <></>}
    </Stack>
    , [needsRender, enqueuedRender, lastRenderTime]);


  const grid = useMemo(() => <>
    <div className="ag-theme-alpine" style={{ width: '100%', minHeight: '150px', maxHeight: '1150px', height: '150px' }}>
      <AgGridReact
        ref={gridRef}
        rowData={deepCopy(default_keyframes)}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        onCellKeyPress={onCellKeyPress}
        onGridReady={onGridReady}
        animateRows={true}
        columnHoverHighlight={true}
        undoRedoCellEditing={true}
        undoRedoCellEditingLimit={20}
        enableCellChangeFlash={true}
        //rowSelection='multiple' 
        tooltipShowDelay={0}
        navigateToNextCell={navigateToNextCell}
        onCellKeyDown={(e) => {
          if (e.event.keyCode === 46 || e.event.keyCode === 8) {
            if (rangeSelection.anchor && rangeSelection.tip) {
              const x1 = Math.min(rangeSelection.anchor.x, rangeSelection.tip.x);
              const x2 = Math.max(rangeSelection.anchor.x, rangeSelection.tip.x);
              const y1 = Math.min(rangeSelection.anchor.y, rangeSelection.tip.y);
              const y2 = Math.max(rangeSelection.anchor.y, rangeSelection.tip.y);              
              for (let rowIndex = y1; rowIndex <= y2; rowIndex++) {
                for (let colInstanceId = x1; colInstanceId <= x2; colInstanceId++) {
                  const col = e.columnApi.getAllGridColumns()[colInstanceId];
                  if (col.visible) {
                    e.api.getDisplayedRowAtIndex(rowIndex).setDataValue(col.colId, "");
                  }
                }
              }
            }
          }
        }} 
        onCellClicked={(e) => {
          if (e.event.shiftKey) {
            setRangeSelection({
              anchor: {x: e.api.getFocusedCell().column.instanceId, y: e.api.getFocusedCell().rowIndex},
              tip: {x: e.column.instanceId, y: e.rowIndex}
            })
          } else {
            setRangeSelection({});
          }
        }}
        onCellMouseOver={(e) => {
          setGridCursorPos(e.data.frame);
          if (e.event.buttons === 1) {
            setRangeSelection({
              anchor: {x: e.api.getFocusedCell().column.instanceId, y: e.api.getFocusedCell().rowIndex},
              tip: {x: e.column.instanceId, y: e.rowIndex}
            })
          }
        }}
      />
    </div>
  </>, [columnDefs, defaultColDef, onCellValueChanged, onCellKeyPress, onGridReady, default_keyframes, navigateToNextCell, rangeSelection]);

  const getAnimatedFields = (renderedData) => {
    if (renderedData && renderedData.rendered_frames_meta) {
      return Object.keys(renderedData.rendered_frames_meta)
        .filter(field => !renderedData.rendered_frames_meta[field].isFlat)
    }
    return [];
  }

  useEffect(() => {
    if (enqueuedRender) {
      console.time('enqueuedRender');
    } else {
      console.timeEnd('enqueuedRender');
    }
  }, [enqueuedRender]);

  const renderedDataJsonString = useMemo(() => renderedData && JSON.stringify(renderedData, null, 4), [renderedData]);

  const renderStatus = useMemo(() => {
    let animated_fields = getAnimatedFields(renderedData);
    let uses2d = props.settings_2d_only.filter((field) => animated_fields.includes(field));
    let uses3d = props.settings_3d_only.filter((field) => animated_fields.includes(field));
    let message = '';
    if (uses2d.length > 0 && uses3d.length > 0) {
      message = `Note: you're animating with both 2D and 3D settings (2D:${uses2d}; 3D:${uses3d}). Some settings will have no effect depending on which Deforum animation mode you choose.`;
    } else if (uses2d.length > 0) {
      message = `Note: you're animating with 2D or pseudo-3D settings. Make sure you choose the 2D animation mode in Deforum.`;
    } else if (uses3d.length > 0) {
      message = `Note: you're animating with 3D settings. Make sure you choose the 3D animation mode in Deforum.`;
    }

    let errorMessage = renderedErrorMessage ? <Alert severity="error">{renderedErrorMessage}</Alert> : <></>

    let statusMessage = <></>;
    if (enqueuedRender) {
      statusMessage = <Alert severity="warning">
        Render in progres...
      </Alert>
    } else if (renderedErrorMessage || needsRender) {
      statusMessage = <Alert severity="info">
        Please render to update the output.
        <p><small>{message}</small></p>
      </Alert>
    } else {
      statusMessage = <Alert severity="success">
        Output is up-to-date.
        <p><small>{message}</small></p>
      </Alert>;
    }
    return <div>
      {errorMessage}
      {statusMessage}
    </div>
  }, [needsRender, renderedData, renderedErrorMessage, enqueuedRender, props.settings_2d_only, props.settings_3d_only]);

  const docManager = useMemo(() => <UserAuthContextProvider>
    <DocManagerUI
      docId={activeDocId}
      onLoadContent={(content) => {
        //console.log("Loading version", content);
        if (content) {
          freshLoadContentToState(content);
          if (!preventInitialRender) {
            setEnqueuedRender(true);
          }
        }
      }}
    />
  </UserAuthContextProvider>, [activeDocId, freshLoadContentToState, preventInitialRender]);

  const optionsUI = useMemo(() => options && <span>
    <Tooltip2 title="Output Frames per Second: generate video at this frame rate. You can specify interpolators based on seconds, e.g. sin(p=1s). Parseq will use your Output FPS to convert to the correct number of frames when you render.">
      <TextField
        id={"options_output_fps"}
        label={"Output FPS"}
        value={options['output_fps']}
        onChange={handleChangeOption}
        onBlur={(e) => { if (!e.target.value) { setOptions({...options,  output_fps:default_options['output_fps']}) } }}        
        style={{ marginBottom: '10px', marginTop: '0px' }}
        InputLabelProps={{ shrink: true, }}
        InputProps={{ style: { fontSize: '0.75em' } }}
        size="small"
        variant="standard" />
    </Tooltip2>
    <Tooltip2 title="Beats per Minute: you can specify wave interpolators based on beats, e.g. sin(p=1b). Parseq will use your BPM and Output FPS value to determine the number of frames per beat when you render.">
      <TextField
        id={"options_bpm"}
        label={"BPM"}
        value={options['bpm']}
        onChange={handleChangeOption}
        onBlur={(e) => { if (!e.target.value) { setOptions({...options,  bpm:default_options['bpm']}) } }}                
        style={{ marginBottom: '10px', marginTop: '0px', marginLeft: '10px', marginRight: '30px' }}
        InputLabelProps={{ shrink: true, }}
        InputProps={{ style: { fontSize: '0.75em' } }}
        size="small"
        variant="standard" />
    </Tooltip2>
  </span>, [options, handleChangeOption])

  const fieldSelector = useMemo(() => displayFields && <Select
    id="select-display-fields"
    multiple
    value={displayFields}
    onChange={handleChangeDisplayFields}
    style={{ marginBottom: '10px', marginLeft: '10px' }}
    input={<OutlinedInput id="select-display-fields" label="Chip" />}
    size="small"
    renderValue={(selected) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.1 }}>
        {selected.map((value) => (
          <Chip sx={{ fontSize: "0.75em" }} key={value} label={value} />
        ))}
      </Box>
    )}
    MenuProps={{
      PaperProps: {
        style: {
          maxHeight: 48 * 10 + 8, //item high * 4.5 + padding
          width: 250
        }
      }
    }}
  >
    {interpolatable_fields.map((field) => (
      <MenuItem key={field} value={field} style={{ fontSize: '1em' }}>{field}</MenuItem>
    ))}
  </Select>, [displayFields, handleChangeDisplayFields, interpolatable_fields])

  const promptsUI = useMemo(() => prompts ? <Prompts
    initialPrompts={prompts}
    lastFrame={keyframes[keyframes.length - 1].frame}
    afterBlur={(e) => { if (autoRender && needsRender) setEnqueuedRender(true) }}
    afterChange={(p) => setPrompts(p)}
  /> : <></>, [prompts, autoRender, needsRender, keyframes]);

  const editableGraph = useMemo(() => renderedData && <div>
    <p><small>Drag to edit keyframe values, double-click to add keyframes, shift-click to clear keyframe values.</small></p>
    <FormControlLabel control={
      <Checkbox
        checked={graphAsPercentages}
        id={"graph_as_percent"}
        onChange={(e) => setGraphAsPercentages(e.target.checked)}
      />}
      label={<Box component="div" fontSize="0.75em">Show as % of max</Box>} />
    <FormControlLabel control={
      <Checkbox
        checked={graphPromptMarkers}
        id={"graph_as_percent"}
        onChange={(e) => setGraphPromptMarkers(e.target.checked)}
      />}
      label={<Box component="div" fontSize="0.75em">Show prompt markers</Box>} />
    <Editable
      renderedData={renderedData}
      displayFields={displayFields}
      as_percents={graphAsPercentages}
      markers={
        (prompts && graphPromptMarkers) ?
          prompts.flatMap((p, idx) => [{
            x: p.from,
            color: 'rgba(50,200,50, 0.8)',
            label: p.name + 'start',
            display: !p.allFrames,
            top: true
          },
          {
            x: p.to,
            color: 'rgba(200,50,50, 0.8)',
            label: p.name + ' end',
            display: !p.allFrames,
            top: false
          }
          ])
            .concat(
              [
                {
                  x: gridCursorPos,
                  color: 'rgba(0, 0, 100, 1)',
                  label: 'Grid cursor',
                  top: true
                }
              ]
            )
          : []}
      updateKeyframe={(field, index, value) => {
        let rowId = frameToRowId(index)
        gridRef.current.api.getRowNode(rowId).setDataValue(field, value);
        setEnqueuedRender(true);
      }}
      addKeyframe={(index) => {
        // If this isn't already a keyframe, add a keyframe
        if (frameToRowId(index) === undefined) {
          addRow(index);
          setEnqueuedRender(true);
        }
      }}
      clearKeyframe={(field, index) => {
        // If this is a keyframe, clear it
        let rowId = frameToRowId(index);
        if (rowId !== undefined) {
          gridRef.current.api.getRowNode(rowId).setDataValue(field, "");
          gridRef.current.api.getRowNode(rowId).setDataValue(field + '_i', "");
          setEnqueuedRender(true);
        }
      }}
    />
  </div>, [renderedData, displayFields, graphAsPercentages, graphPromptMarkers, gridCursorPos, prompts, addRow, frameToRowId]);

  const handleClickedSparkline = useCallback((e) => {
    let field = e.currentTarget.id.replace("sparkline_", "");
    if (interpolatable_fields.includes(field)) {
      if (displayFields.includes(field)) {
        setDisplayFields(displayFields.filter((f) => f !== field));
      } else {
        setDisplayFields([...displayFields, field]);
      }
    }
  }, [interpolatable_fields, displayFields]);

  const renderSparklines = useCallback(() => renderedData && <>
    <FormControlLabel control={
      <Checkbox defaultChecked={false}
        id={"graph_as_percent"}
        onChange={(e) => setShowFlatSparklines(e.target.checked)}
      />}
      label={<Box component="div" fontSize="0.75em">Show {interpolatable_fields.filter((field) => !getAnimatedFields(renderedData).includes(field)).length} flat sparklines</Box>} />
    <Grid container>
      {
        interpolatable_fields.filter((field) => showFlatSparklines ? true : getAnimatedFields(renderedData).includes(field)).sort().map((field) =>
          <Grid key={"sparkline_" + field} xs={1} sx={{ bgcolor: displayFields.includes(field) ? '#f9fff9' : 'GhostWhite', border: '1px solid', borderColor: 'divider' }} id={`sparkline_${field}`} onClick={handleClickedSparkline} >
            <Typography style={{ fontSize: "0.5em" }}>{(displayFields.includes(field) ? "✔️" : "") + field}</Typography>
            {props.settings_2d_only.includes(field) ?
              <Typography style={{ color: 'SeaGreen', fontSize: "0.5em" }} >[2D]</Typography> :
              props.settings_3d_only.includes(field) ?
                <Typography style={{ color: 'SteelBlue', fontSize: "0.5em" }} >[3D]</Typography> :
                <Typography style={{ color: 'grey', fontSize: "0.5em" }} >[2D+3D]</Typography>}
            <Sparklines style={{ bgcolor: 'white' }} data={renderedData.rendered_frames.map(f => f[field])} margin={1} padding={1}>
              <SparklinesLine style={{ stroke: fieldNametoRGBa(field, 255) }} />
            </Sparklines>
            <Typography style={{ fontSize: "0.5em" }}>delta</Typography>
            <Sparklines data={renderedData.rendered_frames.map(f => f[field + '_delta'])} margin={1} padding={1}>
              <SparklinesLine style={{ stroke: fieldNametoRGBa(field, 255) }} />
            </Sparklines>
          </Grid>
        )
      }
    </Grid>
  </>, [displayFields, showFlatSparklines, renderedData, interpolatable_fields, props.settings_2d_only, props.settings_3d_only, handleClickedSparkline]);

  const renderedOutput = useMemo(() => <>
    <div style={{ fontSize: '0.75em', backgroundColor: 'whitesmoke', height: '20em', overflow: 'scroll' }}>
      <pre data-testid="output">{renderedDataJsonString}</pre>
    </div></>, [renderedDataJsonString]);

  const stickyFooter = useMemo(() => <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(200,200,200,0.85)', opacity: '99%' }} elevation={3}>
    <Grid container>
      <Grid xs={6}>
        <InitialisationStatus status={initStatus} />
        {renderStatus}
      </Grid>
      <Grid xs={6}>
        <Grid container>
          <Grid xs={4}>
            {renderButton}
          </Grid>
          <Grid xs={4}>
            <FormControlLabel control={
              <Checkbox
                checked={autoRender}
                id={"auto_render"}
                onChange={(e) => setAutoRender(e.target.checked)}
              />}
              style={{ marginLeft: '0.75em' }}
              label={<Box component="div" fontSize="0.75em">Auto-render</Box>}
            />
          </Grid>
          <Grid xs={4}>
            <Stack direction={'column'}>
              <CopyToClipboard text={renderedDataJsonString}>
                <Button size="small" disabled={needsRender} variant="outlined">📋 Copy output</Button>
              </CopyToClipboard>
              <Typography fontSize={'0.7em'}>Size: {(renderedDataJsonString.length / 1024).toFixed(2)}kB</Typography>
            </Stack>
          </Grid>
          <Grid xs={4}>
            <UserAuthContextProvider>
              <UploadButton
                docId={activeDocId}
                renderedJson={renderedDataJsonString}
                autoUpload={autoUpload}
                onNewUploadStatus={(status) => setUploadStatus(status)}
              />
            </UserAuthContextProvider>
          </Grid>
          <Grid xs={4}>
            <Stack>
              <FormControlLabel control={
                <Checkbox
                  checked={autoUpload}
                  id={"auto_render"}
                  onChange={(e) => setAutoUpload(e.target.checked)}
                />}
                style={{ marginLeft: '0.75em' }}
                label={<Box component="div" fontSize="0.75em">Auto-upload</Box>}
              />
            </Stack>
          </Grid>
          <Grid xs={4} sx={{ float: "right" }}>
            <Stack direction={'column'} justifyContent={'right'} justifyItems={'right'} justifySelf={'right'} >
              {uploadStatus}

            </Stack>
          </Grid>
        </Grid>
      </Grid>
    </Grid>

  </Paper>, [renderStatus, initStatus, renderButton, renderedDataJsonString, activeDocId, autoUpload, needsRender, uploadStatus, autoRender]);




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
      <Grid xs={8}>
        {docManager}
      </Grid>
      <Grid xs={4}>
        <Box display='flex' justifyContent="right" gap={1} alignItems='center' paddingTop={1}>
          <Tooltip2 title="Generate Parseq keyframes from audio (⚠️ experimental).">
            <Button color="success" variant="outlined" size="small" href={'/analyser?fps=' + (options?.output_fps || 20) + '&refDocId=' + activeDocId} target='_blank' rel="noreferrer">🎧 Audio Analyzer</Button>
          </Tooltip2>
          <Tooltip2 title="Explore your Parseq documents.">
            <Button color="success" variant="outlined" size="small" href={'/browser?refDocId=' + activeDocId} target='_blank' rel="noreferrer">🔎 Doc Browser</Button>
          </Tooltip2>
        </Box>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Prompts">
          {promptsUI}
        </ExpandableSection>
      </Grid>
      <Grid xs={12} style={{ display: 'inline', alignItems: 'center' }}>
        <ExpandableSection title="Keyframes for parameter flow">
          {optionsUI}
          <small>Show fields:</small>
          {fieldSelector}
          {grid}
          <span id='gridControls'>
            <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={handleClickOpenAddRowDialog}>➕ Add keyframe</Button>
            <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={handleClickOpenMergeKeyframesDialog}>🌪️ Merge keyframes</Button>
            <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={handleClickOpenDeleteRowDialog}>❌ Delete keyframe</Button>
            {addRowDialog}
            {mergeKeyframesDialog}
            {deleteRowDialog}
          </span>
        </ExpandableSection>

      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Visualised parameter flow">
          {editableGraph}
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Sparklines">
          {renderSparklines()}
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Preview">
          <Preview data={renderedData} />
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Output">
          <Box sx={{ paddingBottom: '150px' }}>
            {renderedOutput}
          </Box>
        </ExpandableSection>
      </Grid>
      {stickyFooter}
    </Grid>


  );

};

export default ParseqUI;

/*
// Prep for screenshot:
['p', 'h3', '#gridControls', 'label'].forEach((n)=>$$(n).forEach((e) => e.style.display='none')); $$('.ag-theme-alpine')[0].style.height='110px'
*/