import { Alert, Button, Checkbox, FormControlLabel, Tooltip as Tooltip2, Typography } from '@mui/material';
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
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { AgGridReact } from 'ag-grid-react';
import equal from 'fast-deep-equal';
import clonedeep from 'lodash.clonedeep';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import useDebouncedEffect from 'use-debounced-effect';
import { InitialisationStatus } from "./components/InitialisationStatus";
import { UploadButton } from "./components/UploadButton";
import { DocManagerUI, loadVersion, makeDocId, saveVersion } from './DocManager';
import { Editable } from './Editable';
import { defaultInterpolation, interpret, InterpreterContext, parse } from './parseq-lang-interpreter';
import { UserAuthContextProvider } from "./UserAuthContext";
import { fieldNametoRGBa, frameToBeats, frameToSeconds, isValidNumber, getUTCTimeStamp, getVersionNumber } from './utils';
import { deepCopy } from '@firebase/util';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css';

//////////////////////////////////////////
// Config
const default_prompts = {
  // eslint-disable-next-line no-template-curly-in-string
  positive: `A lone white (cat:\${prompt_weight_3}) (duck:\${prompt_weight_4}) at midday, centered, realistic, photorealism, crisp, natural colors, fine textures, highly detailed, volumetric lighting, studio photography:\${prompt_weight_1} AND
  A lone black (cat:\${prompt_weight_3}) (duck:\${prompt_weight_4}) at midnight, centered, realistic, photorealism, crisp, natural colors, fine textures, highly detailed, volumetric lighting, studio photography :\${prompt_weight_2}`,
  negative: `watermark, logo, text, signature, copyright, writing, letters,
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
    setDisplayFields(filledContent.displayFields);
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
  const [showFlatSparklines, setShowFlatSparklines] = useState(false);
  const [keyframes, setKeyframes] = useState();
  const [displayFields, setDisplayFields] = useState();
  const [options, setOptions] = useState()
  const [prompts, setPrompts] = useState();
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [enqueuedRender, setEnqueuedRender] = useState(false);
  const [autoRender, setAutoRender] = useState(true);
  const [autoUpload, setAutoUpload] = useState(false);
  const [initStatus, setInitStatus] = useState({});

  const runOnceTimeout = useRef();
  const _frameToRowId_cache = useRef();

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
        }
      ])
    ]
  }, [interpolatable_fields]);

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
        setEnqueuedRender(true);
      } else if (qsImportRemote && qsRemoteImportToken) {
        setInitStatus({ severity: "warning", message: "Importing remote document..." });
        // Attempt to load content from remote URL
        const importUrl = `https://firebasestorage.googleapis.com/v0/b/sd-parseq.appspot.com/o/shared%2F${qsImportRemote}?alt=media&token=${qsRemoteImportToken}`
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
              setEnqueuedRender(true);
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
          setEnqueuedRender(true);
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
    }).concat(keyframes.filter((existingKeyframe) => !incomingKeyframes.find((incomingKeyframe) => incomingKeyframe.frame === existingKeyframe.frame))  )
    .sort((a, b) => a.frame - b.frame);

    setKeyframes(keyframes_local);

    refreshGridFromKeyframes(keyframes_local)
    if (autoRender) {
      setEnqueuedRender(true);
    }

  }, [keyframes, autoRender]);


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

    if (keyframes.length <= 2) {
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

  const onCellKeyPress = useCallback((e) => {
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
      //log.debug("Couldn't update columns, try again in 100ms.");
      setTimeout(() => {
        setDisplayFields(Array.isArray(displayFields) ? [...displayFields] : []);
      }, 100);
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
            <li>Try the <a href={'/browser?refDocId='+activeDocId} target='_blank' rel="noreferrer">browser</a> to find keyframe data from your other documents.</li>
            <li>⚠️ Experimental: try the <a href={'/analyser?fps='+(options?.output_fps||20)+'&refDocId='+activeDocId } target='_blank' rel="noreferrer">analyser</a> to generate keyframes from audio.</li>
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

                  if (!newKeyframes.every((kf) => typeof kf.frame === "number" )) {
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

  const [frameToDelete, setFrameToDelete] = useState();
  const [openDeleteRowDialog, setOpenDeleteRowDialog] = useState(false);
  const handleClickOpenDeleteRowDialog = () => {
    setOpenDeleteRowDialog(true);
  };

  const handleCloseDeleteRowDialog = useCallback((e) => {
    setOpenDeleteRowDialog(false);
    if (e.target.id === "delete") {
      deleteRow(parseInt(frameToDelete));
    }
  }, [deleteRow, frameToDelete]);

  const deleteRowDialog = useMemo(() => <Dialog open={openDeleteRowDialog} onClose={handleCloseDeleteRowDialog}>
    <DialogTitle>❌ Delete keyframe</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Delete a keyframe at the following position.
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
      <Button variant="contained" id="delete" onClick={handleCloseDeleteRowDialog}>Delete</Button>
    </DialogActions>
  </Dialog>, [openDeleteRowDialog, frameToDelete, handleCloseDeleteRowDialog]);

  // TODO: switch to useMemo that updates when elements change?
  const getPersistableState = useCallback(() => ({
    "meta": {
      "generated_by": "sd_parseq",
      "version": getVersionNumber(),
      "generated_at": getUTCTimeStamp(),
    },
    prompts: prompts,
    options: options,
    displayFields: displayFields,
    keyframes: keyframes,
  }), [prompts, options, displayFields, keyframes]);

  const needsRender = useMemo(() => {
    return !lastRenderedState
      || !equal(lastRenderedState.keyframes, keyframes)
      || !equal(lastRenderedState.options, options)
      || !equal(lastRenderedState.prompts, prompts)
  }, [lastRenderedState, keyframes, options, prompts]);

  //////////////////////////////////////////
  // Main render action callback

  // Returns array of every frame number to render, i.e. [startFrame, ..., endFrame]
  function getAllFrameNumbersToRender() {
    var declaredFrames = [];
    gridRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      declaredFrames.push(rowNode.data.frame);
    });

    var minFrame = Math.min(...declaredFrames);
    var maxFrame = Math.max(...declaredFrames);
    return Array.from(Array(maxFrame - minFrame + 1).keys()).map((i) => i + minFrame);
  }

  const render = useCallback(() => {
    console.time('Render');
    setRenderedErrorMessage("");
    setEnqueuedRender(false);

    // Validation
    if (!keyframes) {
      //log.debug("render called before initialisation complete.")
      console.timeEnd('Render');
      return;
    }
    if (keyframes.length < 2) {
      setRenderedErrorMessage("There must be at least 2 keyframes to render.")
      console.timeEnd('Render');
      return;
    }
    let sortedKeyframes = keyframes.sort((a, b) => a.frame - b.frame);    
    let firstKeyFrame = sortedKeyframes[0];
    let lastKeyFrame = sortedKeyframes[keyframes.length - 1];

    // Create implicit bookend keyframes to use any first or last values are missing.
    const bookendKeyFrames = { first: { frame: firstKeyFrame.frame }, last: { frame: lastKeyFrame.frame } };
    (interpolatable_fields.concat(['frame'])).forEach((field) => {
      let firstKeyFrame = sortedKeyframes[0];
      if (!isValidNumber(firstKeyFrame[field])) {
        const firstKeyFrameWithValueForField = sortedKeyframes.find((kf) => isValidNumber(kf[field]));
        const substituteValue = firstKeyFrameWithValueForField ? firstKeyFrameWithValueForField[field] : default_keyframes[0][field];
        //console.log(`No value found for ${field} on the first keyframe, using: ${substituteValue}`);
        bookendKeyFrames.first = { ...bookendKeyFrames.first, [field]: substituteValue };
      }
      if (!isValidNumber(lastKeyFrame[field])) {
        const lastKeyFrameWithValueForField = sortedKeyframes.findLast((kf) => isValidNumber(kf[field]));
        const substituteValue = lastKeyFrameWithValueForField ? lastKeyFrameWithValueForField[field] : default_keyframes[0][field];
        //console.log(`No value found for ${field} on the final keyframe, using: ${substituteValue}`);
        bookendKeyFrames.last = { ...bookendKeyFrames.last, [field]: substituteValue };
      }
    });

    // Calculate actual rendered value for all interpolatable fields
    var rendered_frames = [];
    var previousContext = {};
    var all_frame_numbers = getAllFrameNumbersToRender();
    interpolatable_fields.forEach((field) => {
      
      // Get all keyframes that have a value for this field
      const filtered = sortedKeyframes.filter(kf => isValidNumber(kf[field]));
      
      // Add bookend keyframes if they have a value for this field (implying none were present in the original keyframes)
      if (isValidNumber(bookendKeyFrames.first[field])) {
        filtered.unshift(bookendKeyFrames.first);
      }
      if (isValidNumber(bookendKeyFrames.last[field])) {
        filtered.push(bookendKeyFrames.last);
      }

      const definedFrames = filtered.map(kf => kf.frame);
      const definedValues = filtered.map(kf => Number(kf[field]));
      let lastInterpolator = f => defaultInterpolation(definedFrames, definedValues, f);

      let parseResult;
      let activeKeyframe = 0;
      let prev_computed_value = 0;
      all_frame_numbers.forEach((frame, i) => {

        let declaredRow = gridRef.current.api.getRowNode(frameToRowId(frame));
        let interpolator = lastInterpolator;

        // Is there a new interpolation function to parse?
        if (declaredRow !== undefined) {
          var toParse = declaredRow.data[field + '_i'];
          if (toParse) {  
            try {
              parseResult = parse(toParse);
            } catch (error) {
              console.error(error);
              setRenderedErrorMessage(`Error parsing interpolation for ${field} at frame ${frame} (${toParse}): ` + error);
              // TODO: consider aborting if there was an issue.
            }
          }
        }

        if (definedFrames.includes(frame)) {
          activeKeyframe = frame;
        }

        // Use the last successfully parsed result to determine the interpolation function.
        if (parseResult) {
          var context = new InterpreterContext({
            ...previousContext, //ensure any additional values added to the context during compilation are carried over.
            fieldName: field,
            activeKeyframe: activeKeyframe,
            definedFrames: definedFrames,
            definedValues: definedValues,
            allKeyframes: keyframes,
            FPS: options.output_fps,
            BPM: options.bpm,
            variableMap: {
              prev_computed_value,
            }
          });
          try {
            // New: redetermine the function for every row, using a new context. 
            // Increases CPU and memory usage but allows for different context variables on each invocation, e.g. prev_computed_value.
            interpolator = interpret(parseResult, context);
          } catch (error) {
            console.error(error);
            setRenderedErrorMessage(`Error interpreting interpolation for ${field} at frame ${frame} (${toParse}): ` + error);
            interpolator = lastInterpolator;
          }
        }

        // invoke the interpolation function
        let computed_value = 0;
        try {
          computed_value = interpolator(frame)
        } catch (error) {
          console.error(error);
          setRenderedErrorMessage(`Error evaluating interpolation for ${field} at frame ${frame} (${toParse}): ` + error);
        }

        rendered_frames[frame] = {
          ...rendered_frames[frame] || {},
          frame: frame,
          [field]: computed_value
        }
        lastInterpolator = interpolator;
        prev_computed_value = computed_value;
      });
    });

    // Calculate rendered prompt based on prompts and weights
    all_frame_numbers.forEach((frame) => {

      let variableMap = {};
      interpolatable_fields.forEach((field) => {
        variableMap= {
            ...variableMap || {},
            [field]: rendered_frames[frame][field]
        }
      });
      
      var context = new InterpreterContext({
        fieldName: "prompt",
        activeKeyframe: frame,
        definedFrames: keyframes.map(kf => kf.frame),
        definedValues: [],
        FPS: options.output_fps,
        BPM: options.bpm,
        allKeyframes: keyframes,
        variableMap: variableMap
      });

      try {
        let positive_prompt = prompts.positive
          .replace(/\$\{(.*?)\}/sg, (_, expr) => { const result = interpret(parse(expr), context)(frame); return typeof result === "number" ? result.toFixed(5) : result; } )
          .replace(/(\n)/g, " ");
        let negative_prompt = prompts.negative
          .replace(/\$\{(.*?)\}/sg, (_, expr) =>  { const result = interpret(parse(expr), context)(frame); return typeof result === "number" ? result.toFixed(5) : result; } )
           .replace(/(\n)/g, " ");

        rendered_frames[frame] = {
          ...rendered_frames[frame] || {},
          positive_prompt: positive_prompt,
          negative_prompt: negative_prompt,
          deforum_prompt: negative_prompt ? `${positive_prompt} --neg ${negative_prompt}` : positive_prompt
        }
      } catch (error) {
        console.error(error);
        setRenderedErrorMessage(`Error parsing prompt weight value: ` + error);
      }

    });

    // Calculate subseed & subseed strength based on fractional part of seed.
    all_frame_numbers.forEach((frame) => {
      let subseed = Math.ceil(rendered_frames[frame]['seed'])
      let subseed_strength = rendered_frames[frame]['seed'] % 1

      rendered_frames[frame] = {
        ...rendered_frames[frame] || {},
        subseed: subseed,
        subseed_strength: subseed_strength
      }
    });

    var rendered_frames_meta = []
    interpolatable_fields.forEach((field) => {
      let maxValue = Math.max(...rendered_frames.map(rf => Math.abs(rf[field])))
      let minValue = Math.min(...rendered_frames.map(rf => rf[field]))
      rendered_frames_meta = {
        ...rendered_frames_meta || {},
        [field]: {
          'max': maxValue,
          'min': minValue,
          'isFlat': minValue === maxValue,
        }
      }
    });

    // Calculate delta variants
    all_frame_numbers.forEach((frame) => {
      interpolatable_fields.forEach((field) => {
        let maxValue = rendered_frames_meta[field].max;

        if (frame === 0) {
          rendered_frames[frame] = {
            ...rendered_frames[frame] || {},
            [field + '_delta']: rendered_frames[0][field],
            [field + "_pc"]: (maxValue !== 0) ? rendered_frames[frame][field] / maxValue * 100 : rendered_frames[frame][field],
          }
        } else {
          rendered_frames[frame] = {
            ...rendered_frames[frame] || {},
            [field + '_delta']: (field === 'zoom') ? rendered_frames[frame][field] / rendered_frames[frame - 1][field] : rendered_frames[frame][field] - rendered_frames[frame - 1][field],
            [field + "_pc"]: (maxValue !== 0) ? rendered_frames[frame][field] / maxValue * 100 : rendered_frames[frame][field],
          }
        }
      });
    });

    const data = {
      ...getPersistableState(),
      "rendered_frames": rendered_frames,
      "rendered_frames_meta": rendered_frames_meta
    }

    setRenderedData(data);
    setlastRenderedState({
      // keyframes stores references to ag-grid rows, which will be updated as the grid changes.
      // So if we want to compare a future grid state to the last rendered state, we need to
      // do a deep copy.
      keyframes: clonedeep(keyframes),
      prompts,
      options
    });
    console.timeEnd('Render')
  }, [keyframes, prompts, options, getPersistableState, interpolatable_fields, frameToRowId, default_keyframes]);

  const renderButton = useMemo(() =>
    <Button data-testid="render-button" size="small" disabled={enqueuedRender} variant="contained" onClick={() => setEnqueuedRender(true)}>{needsRender ? '📈 Render' : '📉 Force re-render'}</Button>,
    [needsRender, enqueuedRender]);


  const grid = useMemo(() => <>
    <div className="ag-theme-alpine" style={{ width: '100%', height: 200 }}>
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
        undoRedoCellEditingLimit={0}
        enableCellChangeFlash={true}
        tooltipShowDelay={0}
      />
    </div>
  </>, [columnDefs, defaultColDef, onCellValueChanged, onCellKeyPress, onGridReady, default_keyframes]);

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
        <span style={{ float: 'right' }}>
          {renderButton}
        </span>
        <p><small>{message}</small></p>
      </Alert>
    } else {
      statusMessage = <Alert severity="success">
        Output is up-to-date.
        <span style={{ float: 'right' }}>
          <CopyToClipboard text={renderedDataJsonString}>
            <Button size="small" disabled={needsRender} style={{ marginLeft: '1em' }} variant="outlined">📋 Copy</Button>
          </CopyToClipboard>
        </span>
        <p><small>{message}</small></p>
      </Alert>;
    }
    return <div>
      {errorMessage}
      {statusMessage}
    </div>
  }, [needsRender, renderedData, renderedErrorMessage, enqueuedRender, renderButton, renderedDataJsonString, props.settings_2d_only, props.settings_3d_only]);

  const docManager = useMemo(() => <UserAuthContextProvider>
    <DocManagerUI
      docId={activeDocId}
      onLoadContent={(content) => {
        console.log("Loading version", content);
        if (content) {
          freshLoadContentToState(content);
          setEnqueuedRender(true);
        }
      }}
    />
  </UserAuthContextProvider>, [activeDocId, freshLoadContentToState]);

  const optionsUI = useMemo(() => options && <span>
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
        style={{ marginBottom: '10px', marginTop: '0px', marginLeft: '10px', marginRight: '30px' }}
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

  const promptsUI = useMemo(() => prompts && <>
    <Grid xs={12} container style={{ margin: 0, padding: 0 }}>
      <Grid xs={6} style={{ marginTop: 0, paddingTop: 0 }}>
        <TextField
          fullWidth={true}
          id={"positive_prompt"}
          label={"Positive prompt"}
          multiline
          minRows={2}
          maxRows={16}
          value={prompts.positive}
          onBlur={(e) => { if (autoRender && needsRender) setEnqueuedRender(true) }}
          InputProps={{ style: { fontSize: '0.75em', color: 'DarkGreen' } }}
          onChange={(e) => setPrompts({ ...prompts, positive: e.target.value })}
          size="small"
          variant="standard" />
      </Grid>
      <Grid xs={6} style={{ marginTop: 0, paddingTop: 0 }}>
        <TextField
          fullWidth={true}
          id={"negative_prompt"}
          label={"Negative prompt"}
          multiline
          minRows={2}
          maxRows={16}
          onBlur={(e) => { if (autoRender && needsRender) setEnqueuedRender(true) }}
          value={prompts.negative}
          InputProps={{ style: { fontSize: '0.75em', color: 'Firebrick' } }}
          onChange={(e) => setPrompts({ ...prompts, negative: e.target.value })}
          size="small"
          variant="standard" />
      </Grid>
    </Grid>

  </>, [prompts, autoRender, needsRender]);

  const editableGraph = useMemo(() => renderedData && <div>
    <p><small>Drag to edit keyframe values, double-click to add keyframes, shift-click to clear keyframe values.</small></p>
    <FormControlLabel control={
      <Checkbox defaultChecked={false}
        id={"graph_as_percent"}
        onChange={(e) => setGraphAsPercentages(e.target.checked)}
      />}
      label={<Box component="div" fontSize="0.75em">Show as % of max</Box>} />

    <Editable
      renderedData={renderedData}
      displayFields={displayFields}
      as_percents={graphAsPercentages}
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
  </div>, [renderedData, displayFields, graphAsPercentages, addRow, frameToRowId]);

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
          <Grid key={"sparkline_"+field} xs={1} sx={{ bgcolor: displayFields.includes(field) ? '#f9fff9' : 'GhostWhite', border: '1px solid', borderColor: 'divider' }} id={`sparkline_${field}`} onClick={handleClickedSparkline} >
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

  const renderedOutput = useMemo(() => <div style={{ fontSize: '0.75em', backgroundColor: 'whitesmoke', height: '20em', overflow: 'scroll' }}>
    <pre data-testid="output">{renderedDataJsonString}</pre>
  </div>, [renderedDataJsonString]);



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
      <Grid xs={6}>
        <InitialisationStatus
          status={initStatus}
        />
        {renderStatus}
        <small>
          <ul>
            <li><a href={'/browser?refDocId='+activeDocId} target='_blank' rel="noreferrer">Browser</a>: explore your Parseq documents</li>
            <li><a href={'/analyser?fps='+(options?.output_fps||20)+'&refDocId='+activeDocId } target='_blank' rel="noreferrer">Analyser</a>: generate Parseq keyframes from audio (⚠️ experimental).</li>
          </ul>
        </small>
      </Grid>
      <Grid xs={6}>
        {docManager}
      </Grid>
      <Grid xs={12}>
        <h3>Prompts</h3>
        {promptsUI}
      </Grid>
      <Grid xs={12} style={{ display: 'inline', alignItems: 'center' }}>
        <h3>Keyframes for parameter flow</h3>
        {optionsUI} 
        <small>Show fields:</small>
        {fieldSelector}
        {grid}
        <span id='gridControls'>
          <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={handleClickOpenAddRowDialog}>➕ Add keyframe</Button>
          <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={handleClickOpenMergeKeyframesDialog}>🌪️ Merge keyframes</Button>
          <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={handleClickOpenDeleteRowDialog}>❌ Delete keyframe</Button>
          {renderButton}
          <FormControlLabel control={
            <Checkbox defaultChecked={true}
              id={"auto_render"}
              onChange={(e) => setAutoRender(e.target.checked)}
            />}
            style={{ marginLeft: '0.75em' }}
            label={<Box component="div" fontSize="0.75em">Render on every edit</Box>}
          />
          <FormControlLabel control={
            <Checkbox defaultChecked={false}
              id={"auto_render"}
              onChange={(e) => setAutoUpload(e.target.checked)}
            />}
            style={{ marginLeft: '0.75em' }}
            label={<Box component="div" fontSize="0.75em">Upload output after every render</Box>}
          />
          {addRowDialog}
          {mergeKeyframesDialog}
          {deleteRowDialog}
        </span>
      </Grid>
      <Grid xs={12}>
        <h3>Visualised parameter flow</h3>
        {editableGraph}
      </Grid>
      <Grid xs={12}>
        <h3>Sparklines</h3>
        {renderSparklines()}
      </Grid>
      <Grid xs={12}>
        <h3>Output <small><small> - copy this manifest and paste into the Parseq field in the Stable Diffusion Web UI</small></small></h3>
        <Grid container>
          <Grid xs={6}>
            {renderStatus}
          </Grid>
          <Grid xs={6}>
            {renderButton}<br />
            <UserAuthContextProvider>
              <UploadButton
                docId={activeDocId}
                renderedJson={renderedDataJsonString}
                autoUpload={autoUpload}
              />
            </UserAuthContextProvider>
          </Grid>
          <Grid xs={12}>
            {renderedOutput}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

};

export default ParseqUI;

/*
// Prep for screenshot:
['p', 'h3', '#gridControls', 'label'].forEach((n)=>$$(n).forEach((e) => e.style.display='none')); $$('.ag-theme-alpine')[0].style.height='110px'
*/