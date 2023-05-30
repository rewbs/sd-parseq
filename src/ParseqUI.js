import { Alert, Button, Checkbox, FormControlLabel, Stack, ToggleButton, ToggleButtonGroup, Tooltip as Tooltip2, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { AgGridReact } from 'ag-grid-react';
import equal from 'fast-deep-equal';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Sparklines, SparklinesLine } from 'react-sparklines-typescript-v2';
import ReactTimeAgo from 'react-time-ago';
import useDebouncedEffect from 'use-debounced-effect';
import { DocManagerUI, makeDocId, saveVersion } from './DocManager';
import { Editable } from './Editable';
import { UserAuthContextProvider } from "./UserAuthContext";
import { AudioWaveform } from './components/AudioWaveform';
import { ExpandableSection } from './components/ExpandableSection';
import { FieldSelector } from "./components/FieldSelector";
import { GridTooltip } from './components/GridToolTip';
import { InitialisationStatus } from "./components/InitialisationStatus";
import { AddKeyframesDialog, BulkEditDialog, DeleteKeyframesDialog, MergeKeyframesDialog } from './components/KeyframeDialogs';
import { MovementPreview } from "./components/MovementPreview";
import { Preview } from "./components/Preview";
import { Prompts, convertPrompts } from "./components/Prompts";
import StyledSwitch from "./components/StyledSwitch";
import { TimeSeriesUI } from './components/TimeSeriesUI';
import { UploadButton } from "./components/UploadButton";
import { Viewport } from './components/Viewport';
import runDbTasks from './dbTasks';
import { parseqLoad } from "./parseq-loader";
import { parseqRender } from './parseq-renderer';
import { DECIMATION_THRESHOLD, DEFAULT_OPTIONS } from './utils/consts';
import { fieldNametoRGBa, getOutputTruncationLimit, getUTCTimeStamp, getVersionNumber, queryStringGetOrCreate } from './utils/utils';

import prettyBytes from 'pretty-bytes';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './robin.css';

import { defaultFields } from './data/fields';
import { frameToXAxisType, xAxisTypeToFrame } from './utils/maths';

const ParseqUI = (props) => {
  const activeDocId = queryStringGetOrCreate('docId', makeDocId)   // Will not change unless whole page is reloaded.
  const gridRef = useRef();
  const defaultTemplate = props.defaultTemplate;
  const preventInitialRender = new URLSearchParams(window.location.search).get("render") === "false" || false;
  
  //////////////////////////////////////////
  // App State
  //////////////////////////////////////////
  const [renderedData, setRenderedData] = useState([]);
  const [renderedErrorMessage, setRenderedErrorMessage] = useState("");
  const [lastRenderedState, setlastRenderedState] = useState("");
  const [graphAsPercentages, setGraphAsPercentages] = useState(false);
  const [showPromptMarkers, setShowPromptMarkers] = useState(false);
  const [showCursors, setShowCursors] = useState(false);
  const [beatMarkerInterval, setBeatMarkerInterval] = useState(0);
  const [showFlatSparklines, setShowFlatSparklines] = useState(false);
  const [keyframes, setKeyframes] = useState();
  const [managedFields, setManagedFields] = useState();   // The fields that the user has chosen to be managed by Parseq.
  const [timeSeries, setTimeSeries] = useState([]);   // The fields that the user has chosen to be managed by Parseq.
  const [displayedFields, setDisplayedFields] = useState(); // The fields that the user has chosen to display – subset of managed fields.
  const [prevDisplayedFields, setPrevDisplayedFields] = useState(); // The fields that the user has chosen to display – subset of managed fields.
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
  const [audioCursorPos, setAudioCursorPos] = useState(0);
  const [rangeSelection, setRangeSelection] = useState({});
  const [typing, setTyping] = useState(false); // true if focus is on a text box, helps prevent constant re-renders on every keystroke.
  const [graphableData, setGraphableData] = useState([]);
  const [sparklineData, setSparklineData] = useState([]);
  const [graphScales, setGraphScales] = useState();
  const [lastFrame, setLastFrame] = useState(0);
  const [candidateLastFrame, setCandidateLastFrame] = useState();
  const [xaxisType, setXaxisType] = useState("frames");
  const [keyframeLock, setKeyframeLock] = useState("frames");
  const [gridHeight, setGridHeight] = useState(0);
  const [lastSaved, setLastSaved] = useState(0);
  const [movementPreviewEnabled, setMovementPreviewEnabled] = useState(false);

  const runOnceTimeout = useRef();
  const _frameToRowId_cache = useRef();

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Initialisation logic
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Moved out of useEffect()  
  // Resize grid to fit content and update graph view if last frame changes.
  // TODO: UI optimisation: only need to do this keyframes have changed, could store a prevKeyframes and deepEquals against it.
  if (keyframes) {
    const gridContainer = document.querySelector(".ag-theme-alpine");
    if (gridContainer) {
      if (gridHeight === 0) {
        // auto-size grid to fit content
        gridContainer.style.height = 24 * keyframes.length + "px";
      } else {
        gridContainer.style.height = gridHeight + "px";
      }
    }
    const newLastFrame = Math.max(...keyframes.map(kf => kf.frame));
    if (newLastFrame !== lastFrame) {
      setLastFrame(newLastFrame);
      setCandidateLastFrame(newLastFrame);
      setGraphScales({ xmin: 0, xmax: newLastFrame });
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Initialisation effects
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  

  // Run on first load, once all react components are ready and Grid is ready.
  runOnceTimeout.current = 0;
  useEffect(() => {
    function runOnce() {
      runDbTasks();
      parseqLoad(activeDocId, defaultTemplate).then(loaded => {
        // Redirect if necessary
        if (loaded.redirect && !_.isEmpty(loaded.redirect)) {
          // TODO check this
          window.location.href = loaded.redirect;
          return;
        }

        // Display any message from the load operation
        if (loaded.status && !_.isEmpty(loaded.status)) {
          setInitStatus(loaded.status);
        }

        // Map loaded content to React state
        // Assum all required deep copying has been done by the load function.
        setPersistableState(loaded.loadedDoc);

      }).catch((e) => {
        setInitStatus({severity: "error", message: "Error loading document: " + e.toString()});
      }).finally(() => {
        setAutoSaveEnabled(true);
        if (!preventInitialRender) {
          setEnqueuedRender(true);
        }        
       });
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

  // TODO - can this be moved out of an effect to reduce re-renders?
  // Ensures that whenever any data that might affect the output changes,
  // we save the doc and notify the user that a render is required.
  // This is debounced to 200ms to avoid repeated saves if edits happen
  // in quick succession.
  useDebouncedEffect(() => {
    if (autoSaveEnabled && prompts && options && displayedFields && keyframes && managedFields && timeSeries && keyframeLock) {
      saveVersion(activeDocId, getPersistableState());
      setLastSaved(Date.now());
    }
  }, 200, [prompts, options, displayedFields, keyframes, autoSaveEnabled, managedFields, timeSeries, keyframeLock]);

  // TODO - can this be moved out of an effect to reduce re-renders?
  // Render if there is an enqueued render, but delay if typing.
  // Deboucing to avoid repeated consecutive renders
  useDebouncedEffect(() => {
    if (enqueuedRender) {
      if (prompts && options && displayedFields && keyframes && keyframes.length > 1) {
        // This is the only place we should call render explicitly.
        render();
      }
    }
  }, typing ? 1000 : 200, [enqueuedRender, prompts, options, displayedFields, keyframes]);


  // TODO - can this be moved out of an effect to reduce re-renders?
  // Ensure grid shows all displayed fields columns.
  useEffect(() => {
    if (displayedFields && gridRef.current?.columnApi) {
      let columnsToShow = displayedFields.flatMap(c => [c, c + '_i']);
      let allColumnIds = gridRef.current.columnApi.getColumns().map((col) => col.colId)
      
      setTimeout(() => {
        gridRef.current.columnApi.setColumnsVisible(allColumnIds, false);
        gridRef.current.columnApi.setColumnsVisible(columnsToShow, true);
        gridRef.current.columnApi.setColumnsVisible(['frame', 'info'], true);
        gridRef.current.api.onSortChanged();
        gridRef.current.api.sizeColumnsToFit();
    });

      if (displayedFields.length !== prevDisplayedFields?.length
        || displayedFields.some(f => !prevDisplayedFields.includes(f))) {
        setPrevDisplayedFields(displayedFields);
      }
    }
  }, [displayedFields, prevDisplayedFields]);


  // Auto-render if something has changed (i.e. needsRender is true) and autorender is enabled
  const needsRender = useMemo(() => {
    return !lastRenderedState
      || !equal(lastRenderedState.keyframes, keyframes)
      || !equal(lastRenderedState.options, options)
      || !equal(lastRenderedState.prompts, prompts)
      || !equal(lastRenderedState.managedFields, managedFields)
      || !equal(lastRenderedState.timeSeries, timeSeries)
  }, [lastRenderedState, keyframes, options, prompts, managedFields, timeSeries]);

  useEffect(() => {
    if (needsRender && autoRender) {
      setEnqueuedRender(true);
    }
  }, [needsRender, autoRender, typing]);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Document saving/loading utils
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  

  // Converts React state to a persistable object
  // TODO: switch to useMemo that updates when elements change?
  const getPersistableState = useCallback(() => {
  
    // HACK: remove the sentinel from the prompts before saving. This way,
    // on load, revert, etc..., the Prompt component knows that the input prompts
    // are not a looped refresh from its own update.
    if (prompts && prompts[0]) {
      delete prompts[0]?.sentinel;
    }

    return {
      "meta": {
        "generated_by": "sd_parseq",
        "version": getVersionNumber(),
        "generated_at": getUTCTimeStamp(),
      },
      prompts: prompts,
      options: options,
      managedFields: managedFields,
      displayedFields: displayedFields,
      keyframes: keyframes,
      timeSeries: timeSeries,
      keyframeLock: keyframeLock
    }
  }
  , [prompts, options, displayedFields, keyframes, managedFields, timeSeries, keyframeLock]);


  // Converts document object to React state.
  // Assumes any required deep copying has already occurred.  
  const setPersistableState = useCallback((doc) => {
    if (doc) {
      setPrompts(convertPrompts(doc.prompts, Math.max(...doc.keyframes.map(kf => kf.frame))));
      setOptions(doc.options);
      setManagedFields(doc.managedFields);
      setDisplayedFields(doc.displayedFields);
      setKeyframes(doc.keyframes);
      setTimeSeries(doc.timeSeries);
      setKeyframeLock(doc.keyframeLock);

      refreshGridFromKeyframes(doc.keyframes);
    }
    
  }, []);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Grid config & utils - TODO move out into Grid component
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        headerName: _.startCase(keyframeLock).slice(0, -1) + (keyframeLock !== 'frames' ? ` (frame)` : ''), // Frame / Second / Beat
        field: 'frame',
        comparator: (valueA, valueB, nodeA, nodeB, isDescending) => valueA - valueB,
        sort: 'asc',
        valueSetter: (params) => {
          var newValue = parseFloat(params.newValue);
          if (newValue && !isNaN(newValue)) {
            const newFrame = Math.round(xAxisTypeToFrame(newValue, keyframeLock, options.output_fps, options.bpm));
            params.data.frame = newFrame;
          }
        },
        valueFormatter: (params) => {
          return frameToXAxisType(params.value, keyframeLock, options?.output_fps, options?.bpm);
        },
        cellRenderer: (params) => {
          return frameToXAxisType(params.value, keyframeLock, options?.output_fps, options?.bpm) + (keyframeLock !== 'frames' ? ` (${params.value})` : '');
        },
        pinned: 'left',
        suppressMovable: true,
        cellEditorParams: {
          useFormatter: true,
        },
        cellStyle: params => ({
          borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
        })
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
        cellStyle: params => {
          if (isInRangeSelection(params)) {
            return {
              backgroundColor: 'lightgrey',
              borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
            }
          } else {
            return {
              backgroundColor: 'white', 
              borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
            }
          }
        }        
      },
      ...(managedFields ? managedFields.flatMap(field => [
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
      ]) : [])
    ]

  }, [managedFields, isInRangeSelection, keyframeLock, options]);

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

    setTimeout(() => { 
      gridRef.current.api.onSortChanged();
      gridRef.current.api.sizeColumnsToFit();
    });
    refreshKeyframesFromGrid();

  }, [frameToRowId]);

  const mergeKeyframes = useCallback((incomingKeyframes) => {
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

  }, [keyframes]);

  const addRows = useCallback((frames, infoLabel) => {
    mergeKeyframes(frames.map((frame) => ({ "frame": frame, "info": infoLabel })));
  }, [mergeKeyframes]);

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

    if (frame === 0 || frame === keyframes[keyframes.length - 1].frame) {
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
    setTimeout(() => { 
      gridRef.current.api.onSortChanged();
      gridRef.current.api.sizeColumnsToFit();
    });
    refreshKeyframesFromGrid();

  }, [keyframes, frameToRowId]);

  const onCellValueChanged = useCallback((event) => {
    setTimeout(() => { 
      gridRef.current.api.onSortChanged();
    });
    refreshKeyframesFromGrid();
  }, [gridRef]);

  const onGridReady = useCallback((params) => {
    refreshKeyframesFromGrid();
    setTimeout(() => { 
      gridRef.current.api.onSortChanged();
    });    
  }, [gridRef]);

  const onFirstDataRendered = useCallback(() => {
    setTimeout(() => { 
      gridRef?.current?.api && gridRef.current.api.sizeColumnsToFit();
    });
  }, [gridRef]);

  const navigateToNextCell = useCallback((params) => {
    const previousCell = params.previousCellPosition, nextCell = params.nextCellPosition;
    if (!nextCell || nextCell.rowIndex < 0) {
      return;
    }

    if (showCursors) {
      const nextRow = params.api.getDisplayedRowAtIndex(nextCell.rowIndex);
      if (nextRow && nextRow.data && !isNaN(nextRow.data.frame)) {
        setGridCursorPos(nextRow.data.frame);
      }
    }
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
  }, [rangeSelection, showCursors]);

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

  //////////////////////////////////////////
  // Grid/Keyframe data sync utils
  //////////////////////////////////////////

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
    setTimeout(() => {        
      gridRef.current.api.setRowData(keyframes);
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Other component event callbacks  
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleChangeDisplayedFields = useCallback((e) => {
    let selectedToShow = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    setDisplayedFields(selectedToShow);
  }, []);

  const handleChangeOption = useCallback((e) => {
    const id = e.target.id;
    // eslint-disable-next-line no-unused-vars
    let [_, optionId] = id.split(/options_/);

    const value = (optionId === 'cc_use_input') ? e.target.checked : e.target.value;
    const oldBpm = options.bpm;
    const oldFps = options.output_fps;

    setOptions({ ...options, [optionId]: value });

    if (Number(value) === 0 || isNaN(Number(value))) {
      if (optionId === 'output_fps' || 'bpm') {
        return;
      }
    }

    // Change keyframe positions to maintain the same time position
    if (keyframeLock !== 'frames') {
      let newKeyframes = keyframes.map((keyframe) => {
        const lockedPosition = Number(frameToXAxisType(keyframe.frame, keyframeLock, oldFps, oldBpm));
        const newFps = (optionId === 'output_fps') ? value : options.output_fps;
        const newBpm = (optionId === 'bpm') ? value : options.bpm;
        const newFramePosition = xAxisTypeToFrame(lockedPosition, keyframeLock, newFps, newBpm);

        //console.log("lockedPosition", lockedPosition, "oldFrame", keyframe.frame, "newFrame", newFramePosition);

        return {
          ...keyframe,
          frame: Math.round(newFramePosition)
        }
      });
      setKeyframes(newKeyframes);
      refreshGridFromKeyframes(newKeyframes);
    }

  }, [options, keyframeLock, keyframes]);

  const addRowDialog = useMemo(() => options && <AddKeyframesDialog
    keyframes={keyframes}
    initialFramesToAdd={[]}
    bpm={options.bpm}
    fps={options.output_fps}
    lastFrame={lastFrame}
    addKeyframes={(frames) => addRows(frames, '')}
  />, [options, keyframes, lastFrame, addRows]);

  const bulkEditDialog = useMemo(() => gridRef.current && options && managedFields && <BulkEditDialog
    keyframes={keyframes}
    fields={managedFields}
    bpm={options.bpm}
    fps={options.output_fps}
    timeSeries={timeSeries}
    editKeyframes={(frames, field, type, value) => {
      frames.forEach(frame => {
        let rowData = gridRef.current.api.getRowNode(frameToRowId(frame))?.data;
        if (rowData) {
          const fieldKey = field + ((managedFields.includes(field) && type === 'interpolation') ? '_i' : '');
          rowData[fieldKey] = value;
        }
      });
      refreshKeyframesFromGrid();
      gridRef.current.api.refreshCells();
    }}

  />, [keyframes, options, managedFields, timeSeries, gridRef, frameToRowId]);

  const mergeKeyframesDialog = useMemo(() => options && <MergeKeyframesDialog
    keyframes={keyframes}
    bpm={options.bpm}
    fps={options.output_fps}
    activeDocId={activeDocId}
    mergeKeyframes={mergeKeyframes}
  />, [activeDocId, options, mergeKeyframes, keyframes]);

  const deleteRowDialog = useMemo(() => options && gridRef.current && managedFields && <DeleteKeyframesDialog
    fields={managedFields}
    keyframes={keyframes}
    bpm={options.bpm}
    fps={options.output_fps}
    initialFramesToDelete={rangeSelection.anchor ?
      _.range(Math.min(rangeSelection.anchor.y, rangeSelection.tip.y), Math.max(rangeSelection.anchor.y, rangeSelection.tip.y) + 1)
        .map((y) => Number(gridRef.current.api.getDisplayedRowAtIndex(y)?.data?.frame))
        .filter((n) => !isNaN(n))
        .sort((n1, n2) => n1 - n2)
      : []}
    deleteKeyframes={(frames) => {
      frames.forEach((frame) => deleteRow(frame));
    }}
  />, [managedFields, keyframes, rangeSelection, gridRef, deleteRow, options]);

  //////////////////////////////////////////////////
  // Main data rendering management
  //////////////////////////////////////////////////

  const render = useCallback(() => {
    console.time('Render');
    setRenderedErrorMessage("");
    try {
      const { renderedData, graphData, sparklineData } = parseqRender(getPersistableState());
      setEnqueuedRender(false);
      setRenderedData(renderedData);
      setGraphableData(graphData);
      setSparklineData(sparklineData);
      setlastRenderedState({
        // keyframes stores references to ag-grid rows, which will be updated as the grid changes.
        // So if we want to compare a future grid state to the last rendered state, we need to
        // do a deep copy.
        keyframes: _.cloneDeep(keyframes),
        prompts: _.cloneDeep(prompts),
        options: _.cloneDeep(options),
        managedFields: _.cloneDeep(managedFields),
        timeSeries: _.cloneDeep(timeSeries)
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

  }, [keyframes, prompts, options, managedFields, timeSeries, getPersistableState]);


  ////////////////////////////////////////////////////////////////////////////////
  // UI components
  ///////////////////////////////////////////////////////////////////////////////

  // Doc manager ------------------------

  const docManager = useMemo(() => <UserAuthContextProvider>
    <DocManagerUI
      docId={activeDocId}
      lastSaved={lastSaved}
      onLoadContent={(content) => {
        console.log("Loading version", content);
        if (content) {
          setPersistableState(content);
        }
      }}
    />
  </UserAuthContextProvider>, [activeDocId, setPersistableState, lastSaved]);

  // Prompts ------------------------

  const promptsUI = useMemo(() => prompts ? <Prompts
    initialPrompts={prompts}
    lastFrame={lastFrame}
    afterFocus={(e) => setTyping(true)}
    afterBlur={(e) => setTyping(false)}
    afterChange={_.debounce((p) => setPrompts(p), 200)}
    //afterChange={(p) => setPrompts(p)}
  /> : <></>, [prompts, lastFrame]);

  // Managed field selection ------------------------

  // Figure out which variables are used in the prompts.
  const promptVariables = useMemo(() => defaultFields.map(f => f.name).reduce((acc, field) => {
    const pattern = RegExp(`\\$\\{.*?${field}.*?\\}`);
    if (prompts?.some(prompt => prompt.positive?.match(pattern) || prompt.negative?.match(pattern))) {
      acc.add(field);
    }
    return acc;
  }, new Set([]))
    , [prompts]);

  const managedFieldSelector = useMemo(() => managedFields && <FieldSelector
    selectedFields={managedFields}
    keyframes={keyframes}
    promptVariables={promptVariables}
    customFields={[]}
    onChange={(newManagedFields) => {
      const oldManagedFields = managedFields;
      if (newManagedFields.length !== oldManagedFields.length
        || !newManagedFields.every(f => oldManagedFields.includes(f))) {
        // This update MUST be conditional, else we get into an infinite react loop.
        setManagedFields(newManagedFields);
      }

      // Update displayedFields to remove any missing fields or add any new fields.
      const addedManangedFields = newManagedFields.filter((field) => !oldManagedFields.includes(field));
      if (displayedFields) {
        let newDisplayedFields = displayedFields.filter((field) => newManagedFields.includes(field)).concat(addedManangedFields);
        if (displayedFields.length !== newDisplayedFields.length
          || !newDisplayedFields.every(f => displayedFields.includes(f))) {
          // This update MUST be conditional, else we get into an infinite react loop.
          setDisplayedFields(newDisplayedFields);
        }
      }
    }}
  />, [managedFields, displayedFields, promptVariables, keyframes]);

  // Core options ------------------------

  const optionsUI = useMemo(() => options && <span>
    <Stack direction="row" alignItems="center" justifyContent={"flex-start"} gap={4}>
      <Tooltip2 title="Beats per Minute: you can specify wave interpolators based on beats, e.g. sin(p=1b). Parseq will use your BPM and Output FPS value to determine the number of frames per beat when you render.">
        <TextField
          id={"options_bpm"}
          label={"BPM"}
          value={options['bpm']}
          onChange={handleChangeOption}
          onFocus={(e) => setTyping(true)}
          onBlur={(e) => { setTyping(false); if (!e.target.value) { setOptions({ ...options, bpm: DEFAULT_OPTIONS['bpm'] }) } }}
          InputLabelProps={{ shrink: true, }}
          InputProps={{ style: { fontSize: '0.75em' } }}
          size="small"
          variant="outlined" />
      </Tooltip2>
      <Tooltip2 title="Output Frames per Second: generate video at this frame rate. You can specify interpolators based on seconds, e.g. sin(p=1s). Parseq will use your Output FPS to convert to the correct number of frames when you render.">
        <TextField
          id={"options_output_fps"}
          label={"FPS"}
          value={options['output_fps']}
          onChange={handleChangeOption}
          onFocus={(e) => setTyping(true)}
          onBlur={(e) => { setTyping(false); if (!e.target.value) { setOptions({ ...options, output_fps: DEFAULT_OPTIONS['output_fps'] }) } }}
          InputLabelProps={{ shrink: true, }}
          InputProps={{ style: { fontSize: '0.75em' } }}
          size="small"
          variant="outlined" />
      </Tooltip2>
      <Tooltip2 title="Shortcut to change the position of the final frame. This just edits the frame number of the final keyframe, which you can do in the grid too. You cannot make it less than the penultimate frame.">
        <TextField
          label={"Final frame"}
          value={candidateLastFrame}
          onChange={(e)=>setCandidateLastFrame(e.target.value)}
          onFocus={(e) => setTyping(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setTimeout(() => e.target.blur());
              e.preventDefault();
            } else if (e.key === 'Escape') {
              setTimeout(() => e.target.blur());
              setCandidateLastFrame(lastFrame)
              e.preventDefault();
            }
          }}
          onBlur={(e) => {
            setTyping(false);
            let candidate = parseInt(e.target.value);
            const penultimate = keyframes.length > 1 ? keyframes[keyframes.length - 2].frame : 0;
            if (!candidate || candidate < 0 || isNaN(candidate)) {
              setCandidateLastFrame(lastFrame);
            } else {
              if (candidate <= penultimate) {
                candidate = penultimate + 1;
                setCandidateLastFrame(candidate);
              }
              const local_keyframes = [...keyframes];
              local_keyframes[local_keyframes.length - 1].frame = candidate;
              setKeyframes(local_keyframes);
              setTimeout(() => refreshGridFromKeyframes(local_keyframes));
            }
          }}
          InputLabelProps={{ shrink: true, }}
          InputProps={{ style: { fontSize: '0.75em' } }}
          size="small"
          variant="outlined" />
      </Tooltip2>      
      <Stack direction="row" alignItems="center" justifyContent={"flex-start"} gap={1}>
        <Typography fontSize={"0.75em"}>Lock&nbsp;keyframe&nbsp;position&nbsp;to:</Typography>
        <ToggleButtonGroup size="small"
          color="primary"
          value={keyframeLock}
          exclusive
          onChange={(e, newLock) => {
            if (!newLock) {
              setKeyframeLock("frames");
            } else {
              setKeyframeLock(newLock);
            }
          }}
        >
          <ToggleButton value="frames" key="frames">
            <Tooltip2 title="When you change FPS or BPM, keyframes will maintain their frame position, so will not stay at the same position relative to time or beats.">
              <Typography fontSize={"1em"}>
                ⛌&nbsp;Frames
              </Typography>
            </Tooltip2>
          </ToggleButton>
          <ToggleButton value="seconds" key="seconds">
            <Tooltip2 title='When you change FPS or BPM, keyframes will maintain their position in time (so will change frame position).For example, a keyframe positioned at 1s will always stay as close as possible to 1s regardless of the FPS.'>
              <Typography fontSize={"1em"}>
                🕑&nbsp;Seconds
              </Typography>
            </Tooltip2>
          </ToggleButton>
          <ToggleButton value="beats" key="beats">
            <Tooltip2 title="When you change FPS or BPM, keyframes will maintain their beat position (so will change frame position). For example, a keyframe positioned at beat 2 will always stay as close as possible to beat 2 regardless of the FPS or BPM.">
              <Typography fontSize={"1em"}>
                🥁&nbsp;Beats
              </Typography>
            </Tooltip2>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent={"flex-start"} gap={1}>
        <Typography fontSize={"0.75em"}>Grid&nbsp;size:</Typography>
        <ToggleButtonGroup size="small"
          color="primary"
          value={gridHeight===0 ? "auto" : "compact"}
          exclusive
          onChange={(e, newLock) => {
            if (!newLock || newLock === "auto") {
              setGridHeight(0);
            } else {
              setGridHeight(240);
            }
          }}
        >
          <ToggleButton value="auto" key="auto">
            <Tooltip2 title="Automatically grow/shrink the grid viewport in function of the number of keyframes.">
              <Typography fontSize={"1em"}>
                🪄&nbsp;Auto
              </Typography>
            </Tooltip2>
          </ToggleButton>
          <ToggleButton value="compact" key="compact">
            <Tooltip2 title='Fix the grid viewport to about 10 rows.'>
              <Typography fontSize={"1em"}>
                🤏&nbsp;Compact
              </Typography>
            </Tooltip2>
          </ToggleButton>
          </ToggleButtonGroup>          
      </Stack>
    </Stack>
  </span>, [options, gridHeight, handleChangeOption, keyframeLock, candidateLastFrame, keyframes, lastFrame])


  // Grid ------------------------

  const grid = useMemo(() => <>
    <div className="ag-theme-alpine" style={{ width: '100%', minHeight: '150px', maxHeight: '1150px', height: '150px' }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        onCellKeyPress={onCellKeyPress}
        onGridReady={onGridReady}
        onFirstDataRendered={onFirstDataRendered}
        animateRows={true}
        columnHoverHighlight={true}
        enableCellChangeFlash={true}
        tooltipShowDelay={0}
        navigateToNextCell={navigateToNextCell}
        suppressColumnVirtualisation={process.env?.NODE_ENV === "test"}
        suppressRowVirtualisation={process.env?.NODE_ENV === "test"}
        onCellKeyDown={(e) => {
          if (e.event.keyCode === 46 || e.event.keyCode === 8) {
            if (rangeSelection.anchor && rangeSelection.tip) {
              const x1 = Math.min(rangeSelection.anchor.x, rangeSelection.tip.x);
              const x2 = Math.max(rangeSelection.anchor.x, rangeSelection.tip.x);
              const y1 = Math.min(rangeSelection.anchor.y, rangeSelection.tip.y);
              const y2 = Math.max(rangeSelection.anchor.y, rangeSelection.tip.y);
              for (let colInstanceId = x1; colInstanceId <= x2; colInstanceId++) {
                const col = e.columnApi.getAllGridColumns().find(c => c.instanceId === colInstanceId);
                if (col && col.visible && col.colId !== 'frame') {
                  for (let rowIndex = y1; rowIndex <= y2; rowIndex++) {
                    e.api.getDisplayedRowAtIndex(rowIndex).setDataValue(col.colId, "");
                  }
                }
              }
            }
          }
        }}
        onCellClicked={(e) => {
          if (showCursors) {
            setGridCursorPos(e.data.frame);
          }
          if (e.event.shiftKey) {
            setRangeSelection({
              anchor: { x: e.api.getFocusedCell().column.instanceId, y: e.api.getFocusedCell().rowIndex },
              tip: { x: e.column.instanceId, y: e.rowIndex }
            })
          } else {
            setRangeSelection({});
          }
        }}
        onCellMouseOver={(e) => {
          if (e.event.buttons === 1) {
            setRangeSelection({
              anchor: { x: e.api.getFocusedCell().column.instanceId, y: e.api.getFocusedCell().rowIndex },
              tip: { x: e.column.instanceId, y: e.rowIndex }
            })
          }
        }}
      />
    </div>
  </>, [columnDefs, defaultColDef, onCellValueChanged, onCellKeyPress, onGridReady, onFirstDataRendered, navigateToNextCell, rangeSelection, showCursors]);


  const displayedFieldSelector = useMemo(() => displayedFields &&
    <Stack direction="row" alignItems={"center"} justifyContent={"flex-start"} gap={1} paddingTop={"0.5em"} >
      <Typography fontSize={"0.75em"}>Show/hide fields:</Typography>
      <Select
        id="select-display-fields"
        multiple
        value={displayedFields}
        onChange={handleChangeDisplayedFields}
        style={{ marginBottom: '10px', marginLeft: '10px' }}
        input={<OutlinedInput id="select-display-fields" label="Chip" />}
        size="small"
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.1 }}>
            {selected.map((value) => (
              <Chip sx={{ fontSize: "0.75em", backgroundColor: fieldNametoRGBa(value, 0.2) }} key={value} label={value} />
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
        {managedFields.map((field) => (
          <MenuItem key={field} value={field} style={{ fontSize: '1em' }}>{field}</MenuItem>
        ))}
      </Select></Stack>, [displayedFields, handleChangeDisplayedFields, managedFields])

  // Editable Graph ------------------------

  // Prompt markers (also used on audio graph)
  const promptMarkers = useMemo(() => (prompts && showPromptMarkers)
    ? prompts.flatMap((p, idx) => [{
      x: p.allFrames ? 0 : p.from,
      color: 'rgba(50,200,50, 0.8)',
      label: p.name + 'start',
      display: !p.allFrames,
      top: true
    },
    {
      x: p.allFrames ? lastFrame : p.to,
      color: 'rgba(200,50,50, 0.8)',
      label: p.name + ' end',
      display: !p.allFrames,
      top: false
    }
    ])
    : [], [prompts, showPromptMarkers, lastFrame]);

  const editableGraphHeader = useMemo(() => <>
    {
      (graphScales && (graphScales.xmax - graphScales.xmin) > DECIMATION_THRESHOLD)
        ? <Alert severity='info'>
          Graph is not editable when displaying more than {DECIMATION_THRESHOLD} points. Try zooming in.
        </Alert>
        : <Typography fontSize="0.75em" paddingBottom={"5px"}>
          <strong>Graph is editable.</strong> Drag to edit keyframe values, double-click to add keyframes, shift-click to clear keyframe values.
        </Typography>
    }

    <Grid container>
      <Grid xs={6}>
        <Stack direction="row" alignItems="center" justifyContent="left" spacing={1}>
          <TextField
            select
            fullWidth={false}
            size="small"
            style={{ width: '7em', marginLeft: '5px' }}
            label={"Show time as: "}
            InputLabelProps={{ shrink: true, }}
            InputProps={{ style: { fontSize: '0.75em' } }}
            value={xaxisType}
            onChange={(e) => setXaxisType(e.target.value)}
          >
            <MenuItem value={"frames"}>Frames</MenuItem>
            <MenuItem value={"seconds"}>Seconds</MenuItem>
            <MenuItem value={"beats"}>Beats</MenuItem>
          </TextField>
          <FormControlLabel control={
            <Checkbox
              checked={graphAsPercentages}
              id={"graph_as_percent"}
              onChange={(e) => setGraphAsPercentages(e.target.checked)}
            />}
            label={<Box component="div" fontSize="0.75em">Values as % of max</Box>} />
        </Stack>
      </Grid>
      <Grid xs={6}>
        <Stack direction="row" alignItems="center" justifyContent="left" spacing={1}>
          <Typography fontSize="0.75em">Markers:</Typography>
          <FormControlLabel control={
            <Checkbox
              checked={showPromptMarkers}
              onChange={(e) => setShowPromptMarkers(e.target.checked)}
            />}
            label={<Box component="div" fontSize="0.75em">Prompt positions</Box>} />
          <FormControlLabel control={
            <Checkbox
              checked={showCursors}
              onChange={(e) => setShowCursors(e.target.checked)}
            />}
            label={<Box component="div" fontSize="0.75em">Cursors</Box>} />
          <FormControlLabel control={
            <Checkbox
              checked={beatMarkerInterval !== 0}
              onChange={(e) => setBeatMarkerInterval(e.target.checked ? 1 : 0)}
            />}
            label={<Box component="div" fontSize="0.75em">Beats</Box>} />
          <TextField
            select
            fullWidth={false}
            size="small"
            style={{ width: '7em', marginLeft: '5px' }}
            label={"Beat interval: "}
            InputLabelProps={{ shrink: true, }}
            InputProps={{ style: { fontSize: '0.75em' } }}
            value={beatMarkerInterval}
            onChange={(e) => setBeatMarkerInterval(e.target.value)}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((v, idx) => <MenuItem key={idx} value={v + ""}>{v > 0 ? v : '(none)'}</MenuItem>)}
          </TextField>
        </Stack>
      </Grid>
    </Grid>


  </>, [graphAsPercentages, showPromptMarkers, showCursors, beatMarkerInterval, graphScales, xaxisType])

  const editableGraph = useMemo(() => renderedData && renderedData.rendered_frames && <Editable
    renderedData={renderedData} // just used for keyframes?
    graphableData={graphableData}
    displayedFields={displayedFields}
    as_percents={graphAsPercentages}
    xscales={graphScales ?? { xmin: 0, xmax: renderedData.rendered_frames?.length ?? 100 }}
    xaxisType={xaxisType}
    promptMarkers={promptMarkers}
    gridCursorPos={showCursors ? gridCursorPos : -1}
    audioCursorPos={showCursors ? audioCursorPos : -1}
    beatMarkerInterval={beatMarkerInterval}
    updateKeyframe={(field, index, value) => {
      let rowId = frameToRowId(index)
      gridRef.current.api.getRowNode(rowId).setDataValue(field, value);
    }}
    addKeyframe={(index) => {
      // If this isn't already a keyframe, add a keyframe
      if (frameToRowId(index) === undefined) {
        addRow(index);
      }
    }}
    clearKeyframe={(field, index) => {
      // If this is a keyframe, clear it
      let rowId = frameToRowId(index);
      if (rowId !== undefined) {
        gridRef.current.api.getRowNode(rowId).setDataValue(field, "");
        gridRef.current.api.getRowNode(rowId).setDataValue(field + '_i', "");
      }
    }}
    onGraphScalesChanged={(scales) => {
      if (scales.xmin !== graphScales?.xmin || scales.xmax !== graphScales?.xmax) {
        setGraphScales(scales);
      }
    }}
  />, [renderedData, graphableData, displayedFields, graphAsPercentages, promptMarkers, showCursors, gridCursorPos, audioCursorPos, addRow, frameToRowId, graphScales, xaxisType, beatMarkerInterval]);


  const viewport = useMemo(() => options && graphScales && <Viewport
    xaxisType={xaxisType}
    bpm={options.bpm}
    fps={options.output_fps}
    viewport={{ startFrame: graphScales.xmin, endFrame: graphScales.xmax, }}
    lastFrame={lastFrame}
    onChange={(v) => {
      setGraphScales({ xmin: v.startFrame, xmax: v.endFrame });
    }}
  />, [graphScales, xaxisType, options, lastFrame]);

  // Audio waveform ---------------------
  const audioWaveform = useMemo(() =>
    options && graphScales && <AudioWaveform
      xaxisType={xaxisType}
      bpm={options.bpm}
      fps={options.output_fps}
      promptMarkers={promptMarkers}
      beatMarkerInterval={beatMarkerInterval}
      keyframesPositions={keyframes.map(kf => kf.frame)}
      gridCursorPos={showCursors ? gridCursorPos : -1}
      viewport={{ startFrame: graphScales.xmin, endFrame: graphScales.xmax }}
      onScroll={(newViewport) => {
        if (newViewport.startFrame !== graphScales.xmin || newViewport.endFrame !== graphScales.xmax) {
          setGraphScales({ xmin: newViewport.startFrame, xmax: newViewport.endFrame })
        }
      }}
      onCursorMove={(frame) => {
        if (frame !== audioCursorPos) {
          setAudioCursorPos(frame);
        }
      }}
      onAddKeyframes={addRows}
    />, [options, xaxisType, graphScales, keyframes, promptMarkers, showCursors, gridCursorPos, audioCursorPos, beatMarkerInterval, addRows]);


  // Sparklines ------------------------

  const getAnimatedFields = (renderedData) => {
    if (renderedData && renderedData.rendered_frames_meta) {
      return Object.keys(renderedData.rendered_frames_meta)
        .filter(field => !renderedData.rendered_frames_meta[field].isFlat)
    }
    return [];
  }

  const handleClickedSparkline = useCallback((e) => {
    let field = e.currentTarget.id.replace("sparkline_", "");
    if (managedFields.includes(field)) {
      if (displayedFields.includes(field)) {
        setDisplayedFields(displayedFields.filter((f) => f !== field));
      } else {
        setDisplayedFields([...displayedFields, field]);
      }
    }
  }, [managedFields, displayedFields]);

  const sparklines = useMemo(() => {
    return managedFields
      && renderedData
      && renderedData.rendered_frames ?
      <>
        <FormControlLabel control={
          <Checkbox defaultChecked={false}
            id={"graph_as_percent"}
            onChange={(e) => setShowFlatSparklines(e.target.checked)}
          />}
          label={<Box component="div" fontSize="0.75em">Show {managedFields.filter((field) => !getAnimatedFields(renderedData).includes(field)).length} flat sparklines</Box>} />
        <Grid container>
          {
            managedFields.filter((field) => showFlatSparklines ? true : getAnimatedFields(renderedData).includes(field)).sort().map((field) =>
              <Grid key={"sparkline_" + field} xs={1} sx={{ bgcolor: displayedFields.includes(field) ? '#f9fff9' : 'GhostWhite', border: '1px solid', borderColor: 'divider' }} id={`sparkline_${field}`} onClick={handleClickedSparkline} >
                <Typography style={{ fontSize: "0.5em" }}>{(displayedFields.includes(field) ? "✔️" : "") + field}</Typography>
                {defaultFields.find(f => f.name === field)?.labels?.includes("2D") ?
                  <Typography style={{ color: 'SeaGreen', fontSize: "0.5em" }} >[2D]</Typography> :
                  defaultFields.find(f => f.name === field)?.labels?.includes("3D") ?
                    <Typography style={{ color: 'SteelBlue', fontSize: "0.5em" }} >[3D]</Typography> :
                    <Typography style={{ color: 'grey', fontSize: "0.5em" }} >[2D+3D]</Typography>
                }
                {
                  <Sparklines style={{ bgcolor: 'white' }} data={sparklineData[field]} margin={1} padding={1}>
                    <SparklinesLine style={{ stroke: fieldNametoRGBa(field, 255) }} />
                  </Sparklines>
                }
                {
                  <>
                    <Typography style={{ fontSize: "0.5em" }}>delta</Typography>
                    <Sparklines data={sparklineData[field + '_delta']} margin={1} padding={1}>
                      <SparklinesLine style={{ stroke: fieldNametoRGBa(field, 255) }} />
                    </Sparklines>
                  </>
                }
              </Grid>
            )
          }
        </Grid>
      </>
      : (renderedData?.rendered_frames?.length > 1000) ?
        <Alert severity="warning">
          Sparklines are disabled when frame count &gt; 1000. This will be improved in future versions of Parseq.
        </Alert>
        : <></>
  }, [displayedFields, showFlatSparklines, renderedData, managedFields, handleClickedSparkline, sparklineData]);



  // Raw output ------------------------

  const renderedDataJsonString = useMemo(() => renderedData && JSON.stringify(renderedData, null, 4), [renderedData]);

  const renderedOutput = useMemo(() =>
    renderedDataJsonString && <>
      {
        (renderedDataJsonString.length > getOutputTruncationLimit()) ?
          <Alert severity="warning">
            Rendered output is truncated at {prettyBytes(getOutputTruncationLimit())}. Use the "copy output" or "upload output" button below to access the full data.
          </Alert>
          : <></>
      }
      <div style={{ fontSize: '0.75em', backgroundColor: 'whitesmoke', maxHeight: '40em', overflow: 'scroll' }}>
        <pre data-testid="output">{renderedDataJsonString.substring(0, getOutputTruncationLimit())}</pre>
      </div>
    </>, [renderedDataJsonString]);


  // Footer ------------------------

  const renderStatus = useMemo(() => {
    let animated_fields = getAnimatedFields(renderedData);
    let uses2d = defaultFields.filter(f => f.labels.some(l => l === '2D') && animated_fields.includes(f));
    let uses3d = defaultFields.filter(f => f.labels.some(l => l === '3D') && animated_fields.includes(f));
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
    if (enqueuedRender && !renderedErrorMessage) {
      console.time("PerceivedRender");
      statusMessage = <Alert severity="warning">
        Render in progres...
      </Alert>
    } else if (renderedErrorMessage || needsRender) {
      statusMessage = <Alert severity="info">
        Please render to update the output.
        <p><small>{message}</small></p>
      </Alert>
    } else {
      console.timeEnd("PerceivedRender");
      statusMessage = <Alert severity="success">
        Output is up-to-date.
        <p><small>{message}</small></p>
      </Alert>;
    }
    return <div>
      {errorMessage}
      {statusMessage}
    </div>
  }, [needsRender, renderedData, renderedErrorMessage, enqueuedRender]);

  const renderButton = useMemo(() =>
    <Stack>
      <Button data-testid="render-button" size="small" disabled={enqueuedRender} variant="contained" onClick={() => setEnqueuedRender(true)}>{needsRender ? '📈 Render' : '📉 Re-render'}</Button>
      {lastRenderTime ? <Typography fontSize='0.7em' >Last rendered: <ReactTimeAgo tooltip={true} date={lastRenderTime} locale="en-GB" />.</Typography> : <></>}
    </Stack>
    , [needsRender, enqueuedRender, lastRenderTime]);

  const stickyFooter = useMemo(() => <Paper sx={{ padding: '5px', position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(200,200,200,0.85)', opacity: '99%' }} elevation={3}>
    <Grid container spacing={1}>
      <Grid xs={6}>
        <InitialisationStatus status={initStatus} alignItems='center' />
        {renderStatus}
      </Grid>
      <Grid xs={2}>
        <Stack direction={'column'}>
          {renderButton}
          <UserAuthContextProvider>
            <UploadButton
              docId={activeDocId}
              renderedJson={renderedDataJsonString}
              autoUpload={autoUpload}
              onNewUploadStatus={(status) => setUploadStatus(status)}
            />
          </UserAuthContextProvider>
        </Stack>
      </Grid>
      <Grid xs={2}>
        <Stack direction={'column'}>
          <FormControlLabel control={
            <Checkbox
              checked={autoRender}
              id={"auto_render"}
              onChange={(e) => setAutoRender(e.target.checked)}
            />}
            style={{ marginLeft: '0.75em' }}
            label={<Box component="div" fontSize="0.75em">Auto-render</Box>}
          />
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
      <Grid xs={2}>
        <Stack direction={'column'}>
          <Stack direction={'column'}>
            <CopyToClipboard text={renderedDataJsonString}>
              <Button size="small" disabled={needsRender} variant="outlined">📋 Copy output</Button>
            </CopyToClipboard>
            <Typography fontSize={'0.7em'}>Size: {prettyBytes(renderedDataJsonString.length)}</Typography>
          </Stack>
          <Stack direction={'column'} justifyContent={'right'} justifyItems={'right'} justifySelf={'right'} >
            {uploadStatus}
          </Stack>
        </Stack>
      </Grid>
    </Grid>  

  </Paper>, [renderStatus, initStatus, renderButton, renderedDataJsonString, activeDocId, autoUpload, needsRender, uploadStatus, autoRender]);



  //////////////////////////////////////////
  // Main layout
  ///////////////////////////////////////////////////////////////

  return ( <Grid container paddingLeft={5} paddingRight={5} spacing={2} sx={{
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
      <React.StrictMode>
      <CssBaseline />
      <Grid xs={8}>
        {docManager}
      </Grid>
      <Grid xs={4}>
        <Box display='flex' justifyContent="right" gap={1} alignItems='center' paddingTop={1}>
          <Tooltip2 title="Generate Parseq keyframes from audio (⚠️ legacy - functionality is now integrated into the main UI).">
            <Button color="success" variant="outlined" size="small" href={'/analyser?fps=' + (options?.output_fps || 20) + '&refDocId=' + activeDocId} target='_blank' rel="noreferrer">🎧 <small>Audio Analyzer (Legacy)</small></Button>
          </Tooltip2>
          <Tooltip2 title="Explore your Parseq documents.">
            <Button color="success" variant="outlined" size="small" href={'/browser?refDocId=' + activeDocId} target='_blank' rel="noreferrer">🔎<small>Doc Browser</small></Button>
          </Tooltip2>
        </Box>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Prompts">
          {promptsUI}
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Managed fields">
          {managedFieldSelector}
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Custom time series">
          {options && lastFrame && <TimeSeriesUI
            lastFrame={lastFrame}
            fps={options.output_fps}
            allTimeSeries={timeSeries}
            onChange={(allTimeSeries) =>
              setTimeSeries([...allTimeSeries])
            }
            afterFocus={(e) => setTyping(true)}
            afterBlur={(e) => setTyping(false)}
          />
          }
        </ExpandableSection>
      </Grid>
      <Grid xs={12} style={{ display: 'inline', alignItems: 'center' }}>
        <ExpandableSection
          // TODO: we always have to render the grid currently, else we lose keyframes because they reference grid data.
          renderChildrenWhenCollapsed={true}
          title="Keyframes grid for field value flow">
          {optionsUI}
          {displayedFieldSelector}
          {grid}
          <span id='gridControls'>
            {addRowDialog}
            {bulkEditDialog}
            {mergeKeyframesDialog}
            {deleteRowDialog}
          </span>
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Visualised field value flow">
          <span id='graphHeader'>
            {editableGraphHeader}
          </span>
          {editableGraph}
          {viewport}
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Audio reference"
          // Ensure we don't lose state when collapsing.
          renderChildrenWhenCollapsed={true}
        >
          {audioWaveform}
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Sparklines">
          {sparklines}
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Preview">
          {renderedData && <Preview data={renderedData} />}
        </ExpandableSection>
      </Grid>
      </React.StrictMode>
      <Grid xs={12}>
        <ExpandableSection title="Movement preview (🧪 experimental)">
          {renderedData && <>
            <FormControlLabel
                sx = {{ padding:'0' }}
                control={<StyledSwitch                    
                    onChange={(e) => { setMovementPreviewEnabled(e.target.checked);}}
                    checked={movementPreviewEnabled} />}
                label={<small> Experimental preview of camera movement.</small>} />

            {movementPreviewEnabled && 
              <MovementPreview renderedData={renderedData.rendered_frames} />
            }
           </>
          }
        </ExpandableSection>
      </Grid>
      <React.StrictMode>
      <Grid xs={12}>
        <ExpandableSection title="Output">
          <Box>
            {renderedOutput}
          </Box>
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        {/* Scroll buffer */}
        <Box height="200px"></Box>
      </Grid>
      {stickyFooter}
      </React.StrictMode>
    </Grid>


  );

};

export default ParseqUI;

/*
// Prep for screenshot:
['p', 'h3', '.MuiCheckbox-root', '#gridControls', '#graphHeader'].forEach((n)=>$$(n).forEach((e) => e.style.display='none')); $$('.ag-theme-alpine')[0].style.height='110px'; $$('.ag-theme-alpine')[0].style['min-height']='110px';
*/