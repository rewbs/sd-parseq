// @ts-nocheck 
import { Alert, Button, Checkbox, Collapse, FormControlLabel, Stack, ToggleButton, ToggleButtonGroup, Tooltip as Tooltip2, Typography } from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';

import equal from 'fast-deep-equal';
import _ from 'lodash';
import prettyBytes from 'pretty-bytes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Sparklines, SparklinesLine } from 'react-sparklines-typescript-v2';
import ReactTimeAgo from 'react-time-ago';
import useDebouncedEffect from 'use-debounced-effect';
import { DocManagerUI, loadVersion, makeDocId, saveVersion } from './DocManager';
import { ParseqGraph } from './components/ParseqGraph';
import { ParseqGrid } from './components/ParseqGrid';
import SupportParseq from './components/SupportParseq'
import { UserAuthContextProvider } from "./UserAuthContext";
import { AudioWaveform } from './components/AudioWaveform';
import { ExpandableSection } from './components/ExpandableSection';
import { FieldSelector } from "./components/FieldSelector";
import { InitialisationStatus } from "./components/InitialisationStatus";
import { AddKeyframesDialog, BulkEditDialog, DeleteKeyframesDialog, MergeKeyframesDialog } from './components/KeyframeDialogs';
import { MovementPreview } from "./components/MovementPreview";
import { Preview } from "./components/Preview";
import { convertPrompts, Prompts } from "./components/Prompts";
import StyledSwitch from "./components/StyledSwitch";
import { TimeSeriesUI } from './components/TimeSeriesUI';
import { UploadButton } from "./components/UploadButton";
import { Viewport } from './components/Viewport';
import { defaultFields } from './data/fields';
import runDbTasks from './dbTasks';

import { parseqLoad } from "./parseq-loader";
import { parseqRender } from './parseq-renderer';
import { DECIMATION_THRESHOLD } from './utils/consts';
import { fieldNametoRGBa, getOutputTruncationLimit, getUTCTimeStamp, getVersionNumber, queryStringGetOrCreate } from './utils/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack } from '@fortawesome/free-solid-svg-icons'

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { beatToFrame, frameToBeat, frameToSec, secToFrame, beatToSec, secToBeat, remapFrameCount } from './utils/maths';
import { experimental_extendTheme as extendTheme } from "@mui/material/styles";
import { themeFactory } from "./theme";

import { useHotkeys } from 'react-hotkeys-hook';
import { ParseqUndoManager } from './parseq-undoManager';

const ParseqUI = (props) => {
  const activeDocId = queryStringGetOrCreate('docId', makeDocId)   // Will not change unless whole page is reloaded.
  const gridRef = useRef();
  const { defaultTemplate } = props
  const preventInitialRender = new URLSearchParams(window.location.search).get("render") === "false" || false;
  const debugMode = new URLSearchParams(window.location.search).get("debug") === "true" || false;
  
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
  const [reverseRender, setReverseRender] = useState(false);
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
  const [rangeSelection, setRangeSelection] = useState({});
  const [audioCursorPos, setAudioCursorPos] = useState(0);
  const [activeVersionId, setActiveVersionId] = useState();

  // eslint-disable-next-line no-unused-vars
  const [undoManager, setUndoManager] = useState(new ParseqUndoManager(activeDocId));
  const [debugUndoStack, setDebugUndoStack] = useState([]);
  

  const [isDocDirty, setIsDocDirty] = useState(false); // true if focus is on a text box, helps prevent constant re-renders on every keystroke.
  const [graphableData, setGraphableData] = useState([]);
  const [sparklineData, setSparklineData] = useState([]);
  const [graphScales, setGraphScales] = useState();
  const [lastFrame, setLastFrame] = useState(0);
  const [candidateLastFrame, setCandidateLastFrame] = useState();
  const [candidateBPM, setCandidateBPM] = useState()
  const [candidateFPS, setCandidateFPS] = useState()
  const [xaxisType, setXaxisType] = useState("frames");
  const [keyframeLock, setKeyframeLock] = useState("frames");
  const [gridHeight, setGridHeight] = useState(0);
  const [lastSaved, setLastSaved] = useState(0);
  const [pinFooter, setPinFooter] = useState(true);
  const [hoverFooter, setHoverFooter] = useState(false);
  const [movementPreviewEnabled, setMovementPreviewEnabled] = useState(false);

  const runOnceTimeout = useRef();
  const _frameToRowId_cache = useRef();
  const theme = extendTheme(themeFactory());
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Initialisation logic
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Moved out of useEffect()  
  // Resize grid to fit content and update graph view if last frame changes.
  // TODO: UI optimisation: only need to do this keyframes have changed, could store a prevKeyframes and deepEquals against it.
  if (keyframes) {
    const gridContainer = document.querySelector("#grid-container");
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
        
        // If we've loaded a specific version, track that version number so we can included it in rendered output.
        if (loaded.loadedDoc?.versionId) {
          setActiveVersionId(loaded.loadedDoc.versionId);
        }

      }).catch((e) => {
        setInitStatus({severity: "error", message: "Error loading document: " + e.toString()});
      }).finally(() => {
        setAutoSaveEnabled(true);
        if (!preventInitialRender) {
          setEnqueuedRender(true);
        }        
       });
    }

    if (gridRef?.current?.api) {
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
      const versionToSave = getPersistableState();
      const changesComparedToLastRecovered = undoManager.compareToLastRecovered(versionToSave);
      if (changesComparedToLastRecovered.length > 0) { // HACK – detect whether we're here just because we've done undo/redo, in which case we don't want to save. This is slow for large docs.
        saveVersion(activeDocId, getPersistableState()).then((saveStruct) => {
          if (!saveStruct?.newVersionId) {
            // No save occurred.
            return;
          }
          console.log("Non-reversion detected. No longer in a just-recovered state, redo is no longer possible.");
          setActiveVersionId(saveStruct?.newVersionId);
          undoManager.trackVersion(saveStruct.newVersionId, saveStruct.changes);
          setDebugUndoStack(undoManager.confessUndoStack());
          setLastSaved(Date.now());
        });
      } else {
          console.log("Not saving, would be identical to recovered version.");
      }
    }
  }, 200, [prompts, options, displayedFields, keyframes, autoSaveEnabled, managedFields, timeSeries, keyframeLock, reverseRender]);

  // TODO - can this be moved out of an effect to reduce re-renders?
  // Render if there is an enqueued render.
  // Deboucing to avoid repeated consecutive renders
  useDebouncedEffect(() => {
    if (enqueuedRender) {
      if (prompts && options && displayedFields && keyframes && keyframes.length > 1) {
        // This is the only place we should call render explicitly.
        render();
      }
    }
  }, 200, [enqueuedRender, prompts, options, displayedFields, keyframes]);


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
      || !equal(lastRenderedState.reverseRender, reverseRender)
      || isDocDirty
  }, [lastRenderedState, keyframes, options, prompts, managedFields, timeSeries, isDocDirty, reverseRender]);

  useEffect(() => {
    if (needsRender && autoRender) {
      setEnqueuedRender(true);
    }
  }, [needsRender, autoRender, isDocDirty]);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Document saving/loading utils
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  

  // Converts React state to a persistable object
  // TODO: switch to useMemo that updates when elements change?
  const getPersistableState = useCallback(() => {
  
    // HACK: remove the sentinel from the prompts before saving. This way,
    // on load, revert, etc..., the Prompt component knows that the input prompts
    // are not a looped refresh from its own update.
    if (prompts) {
      delete prompts.sentinel;
    }

    return {
      "meta": {
        "generated_by": "sd_parseq",
        "version": getVersionNumber(),
        "generated_at": getUTCTimeStamp(),
        "doc_id": activeDocId?.toString().startsWith("doc-") ? activeDocId : "unknown",
        "version_id": activeVersionId?.toString().startsWith("version-") ? activeVersionId : "unknown",
      },
      prompts: prompts,
      options: options,
      managedFields: managedFields,
      displayedFields: displayedFields,
      keyframes: keyframes,
      timeSeries: timeSeries,
      keyframeLock: keyframeLock,
      reverseRender: reverseRender
    }
  }
  , [prompts, activeDocId, options, managedFields, displayedFields, keyframes, timeSeries, keyframeLock, activeVersionId, reverseRender]);


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
      setCandidateBPM(doc.options.bpm);
      setCandidateFPS(doc.options.output_fps);
      setReverseRender(doc.reverseRender);

      refreshGridFromKeyframes(doc.keyframes);
    }
    
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Keyframe datamodel interactions
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  

  // TODO: for historical reasons (aka bad decision early on),
  // the "source of truth" for keyframe data is mixed between the grid's 
  // row data object and this component's "keyframes" state object. 
  // They sometimes, but not always, refer to the same concrete object.
  // We sometimes need to sync them explicitly.
  // Codepilot autocompletes this paragraph with: "This is not ideal."

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

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Other component event callbacks  
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleChangeDisplayedFields = useCallback((e) => {
    let selectedToShow = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
    setDisplayedFields(selectedToShow);
  }, []);


  // Change keyframes and prompts to maintain the same time positions
  const remapFrames = useCallback((oldFps, oldBpm, newFps, newBpm) => {
    if (keyframeLock === 'frames') {
      // Nothing to do.
      return;
    }

    // Update keyframes
    let newKeyframes = keyframes.map((keyframe) => {
      const newFramePosition = remapFrameCount(keyframe.frame, keyframeLock, oldFps, oldBpm, newFps, newBpm);
      //console.log("oldFrame", keyframe.frame, "newFrame", newFramePosition);

      return {
        ...keyframe,
        frame: Math.round(newFramePosition)
      }
      
    });
    setKeyframes(newKeyframes);
    refreshGridFromKeyframes(newKeyframes);      

    // Update prompts
    const newPrompts = _.cloneDeep(prompts);
    newPrompts.promptList.forEach((prompt) => {
      prompt.from = Math.round(remapFrameCount(prompt.from, keyframeLock, oldFps, oldBpm, newFps, newBpm));
      prompt.to = Math.round(remapFrameCount(prompt.to, keyframeLock, oldFps, oldBpm, newFps, newBpm));
      prompt.overlap.inFrames = Math.round(remapFrameCount(prompt.overlap.inFrames, keyframeLock, oldFps, oldBpm, newFps, newBpm));
      prompt.overlap.outFrames = Math.round(remapFrameCount(prompt.overlap.outFrames, keyframeLock, oldFps, oldBpm, newFps, newBpm));
    });
    delete newPrompts.sentinel; // Ensures UI picks up modified prompts.
    setPrompts(newPrompts);

  }, [keyframeLock, keyframes, prompts]);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Dialogs
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
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
        timeSeries: _.cloneDeep(timeSeries),
        reverseRender: reverseRender
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

  }, [getPersistableState, keyframes, prompts, options, managedFields, timeSeries, reverseRender]);


  ////////////////////////////////////////////////////////////////////////////////
  // UI components
  ///////////////////////////////////////////////////////////////////////////////

  // Doc manager ------------------------

  const docManager = useMemo(() => <UserAuthContextProvider>
    <DocManagerUI
      docId={activeDocId}
      lastSaved={lastSaved}
      onLoadContent={(content) => {
        console.log("Reverting to version", content);
        if (content) {
          setPersistableState(content);
        }
      }}
    />
  </UserAuthContextProvider>, [activeDocId, setPersistableState, lastSaved]);

  // Prompts ------------------------

  const promptsUI = useMemo(() => (prompts && options) ? <Prompts
    initialPrompts={prompts}
    lastFrame={lastFrame}
    keyframeLock={keyframeLock}
    fps={options?.output_fps}
    bpm={options?.bpm}    
    markDirty={(b) => setIsDocDirty(b)}
    commitChange={_.debounce((p) => setPrompts(p), 200)}
  /> : <></>, [prompts, lastFrame, keyframeLock, options]);

  // Managed field selection ------------------------

  // Figure out which variables are used in the prompts.
  const promptVariables = useMemo(() => defaultFields.map(f => f.name).reduce((acc, field) => {
    const pattern = RegExp(`\\$\\{.*?${field}.*?\\}`);
    if (prompts?.promptList?.some(prompt => prompt.positive?.match(pattern) || prompt.negative?.match(pattern))) {
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
     
    <Stack direction={{  xs: 'column', sm: 'column', md: 'row' }} alignItems={{  xs: 'flex-start', sm: 'flex-start', md: 'flex-start' }} justifyContent={'space-between'} >
      <Stack direction='row' gap={2} alignItems={{  xs: 'flex-start', sm: 'flex-start', md: 'flex-start' }} >
        <Tooltip2 title="Beats per Minute: you can specify wave interpolators based on beats, e.g. sin(p=1b). Parseq will use your BPM and Output FPS value to determine the number of frames per beat when you render.">
          <TextField
            label={"BPM"}
            value={candidateBPM}
            onChange={(e) => setCandidateBPM(e.target.value)}
            onKeyDown={(e) => {
              setIsDocDirty(true);
              if (e.key === 'Enter') {
                setTimeout(() => e.target.blur());
                e.preventDefault();
              } else if (e.key === 'Escape') {
                setTimeout(() => e.target.blur());
                setCandidateBPM(options.bpm)
                e.preventDefault();
              }
            }}
            onBlur={(e) => {
              setIsDocDirty(false);
              let candidate = parseFloat(e.target.value);
              let fallBack = options.bpm;
              if (!candidate || candidate <= 0 || isNaN(candidate)) {
                setCandidateBPM(fallBack);
              } else {
                remapFrames(options.output_fps, options.bpm, options.output_fps, candidate);
                setOptions({ ...options, bpm: candidate })
              }
            }}
            InputLabelProps={{ shrink: true, }}
            InputProps={{
              style: { fontSize: '0.75em' },
              sx: { background: (Number(candidateBPM) !== Number(options.bpm))? theme.vars.palette.unsavedbg.main : '', },
              endAdornment: (Number(candidateBPM) !== Number(options.bpm)) ? '🖊️' : ''
            }}
            sx={{ minWidth: 70, maxWidth: 100, }}
            size="small"
            variant="outlined" />
        </Tooltip2>
        <Tooltip2 title="Output Frames per Second: generate video at this frame rate. You can specify interpolators based on seconds, e.g. sin(p=1s). Parseq will use your Output FPS to convert to the correct number of frames when you render.">
          <TextField
            label={"FPS"}
            value={candidateFPS}
            onChange={(e) => setCandidateFPS(e.target.value)}
            onKeyDown={(e) => {
              setIsDocDirty(true);
              if (e.key === 'Enter') {
                setTimeout(() => e.target.blur());
                e.preventDefault();
              } else if (e.key === 'Escape') {
                setTimeout(() => e.target.blur());
                setCandidateFPS(options.output_fps)
                e.preventDefault();
              }
            }}            
            onBlur={(e) => {
              setIsDocDirty(false);
              let candidate = parseFloat(e.target.value);
              let fallBack = options.output_fps;
              if (!candidate || candidate <= 0 || isNaN(candidate)) {
                setCandidateFPS(fallBack);
              } else {
                remapFrames(options.output_fps, options.bpm, candidate, options.bpm);
                setOptions({ ...options, output_fps: candidate })
              }
            }}
            InputLabelProps={{ shrink: true, }}
            InputProps={{
              style: { fontSize: '0.75em' },
              sx: { background: (Number(candidateFPS) !== Number(options.output_fps)) ? theme.vars.palette.unsavedbg.main  : '', },
              endAdornment: (Number(candidateFPS) !== Number(options.output_fps)) ? '🖊️' : ''
            }}
            sx={{ minWidth: 70, maxWidth: 100, }}
            size="small"
            variant="outlined" />
        </Tooltip2>
        <Tooltip2 title="Shortcut to change the position of the final frame. This just edits the frame number of the final keyframe, which you can do in the grid too. You cannot make it less than the penultimate frame.">
          <TextField
            label={"Final frame"}
            value={candidateLastFrame}
            onChange={(e)=>setCandidateLastFrame(e.target.value)}
            onKeyDown={(e) => {
              setIsDocDirty(true);
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
              setIsDocDirty(false);
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
            InputProps={{
              style: { fontSize: '0.75em' },
              sx: { background: Number(candidateLastFrame) !== Number(lastFrame) ? theme.vars.palette.unsavedbg.main : '', },
              endAdornment: Number(candidateLastFrame) !== Number(lastFrame) ? '🖊️' : ''
            }}
            sx={{ minWidth: 70, maxWidth: 100, }}
            size="small"
            variant="outlined" />
        </Tooltip2>
        <Typography fontSize={'0.6em'} style={{transform:'translate(0px, -2em)', margin:0}}> 
            <ul>
              <li>Total duration: {lastFrame+1} frames = {frameToSec(lastFrame+1, options.output_fps).toFixed(4)} seconds = {frameToBeat(lastFrame+1, options.output_fps, options.bpm).toFixed(4)} beats </li>
              <li>1 frame: {frameToSec(1, options.output_fps).toFixed(4)} seconds = {frameToBeat(1, options.output_fps, options.bpm).toFixed(4)} beats</li>
              <li>1 second: {secToFrame(1, options.output_fps).toFixed(4)} frames = {secToBeat( 1, options.bpm).toFixed(4)} beats</li>
              <li>1 beat: {beatToFrame(1, options.output_fps, options.bpm).toFixed(4)} frames = {beatToSec( 1, options.bpm).toFixed(4)} seconds</li>
            </ul>
        </Typography>
      </Stack>
      <Stack
        direction="column"
        alignItems={'center'}
        justifyContent={"start"}
        style={{transform:'translate(0px, -9px)'}}> {/* aligns with textbox label */}
        <Typography fontSize={"0.75em"}>Lock keyframe & prompt position to:</Typography>
        <ToggleButtonGroup size="small"
          color="primary"
          style={{lineHeight: 0}}
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
              <Typography fontSize={"0.9em"} >
                ⛌&nbsp;Frames
              </Typography>
            </Tooltip2>
          </ToggleButton>
          <ToggleButton value="seconds" key="seconds"> 
            <Tooltip2 title='When you change FPS or BPM, keyframes will maintain their position in time (so will change frame position).For example, a keyframe positioned at 1s will always stay as close as possible to 1s regardless of the FPS.'>
              <Typography fontSize={"0.9em"}>
                🕑&nbsp;Seconds
              </Typography>
            </Tooltip2>
          </ToggleButton>
          <ToggleButton value="beats" key="beats">
            <Tooltip2 title="When you change FPS or BPM, keyframes will maintain their beat position (so will change frame position). For example, a keyframe positioned at beat 2 will always stay as close as possible to beat 2 regardless of the FPS or BPM.">
              <Typography fontSize={"0.9em"} >
                🥁&nbsp;Beats
              </Typography>
            </Tooltip2>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Tooltip2 title="Reverse the rendered frames so that the video is generated in reverse. You can then reverse the final video. This is useful if you want to end on your init image, or use outpainting with a zoom-in effect.">           
        <FormControlLabel control={
          <Checkbox
            checked={reverseRender}
            onChange={(e) => setReverseRender(e.target.checked)}
          />}
          label={<Typography fontSize={"0.75em"}>Generate in reverse</Typography>} />
      </Tooltip2>
    </Stack>
  </span>, [options, candidateBPM, candidateFPS, candidateLastFrame, lastFrame, keyframeLock, reverseRender, remapFrames, keyframes, theme])




  // Grid ------------------------

  const grid = useMemo(() => <ParseqGrid
    ref={gridRef}
    onCellValueChanged={onCellValueChanged} 
    onCellKeyPress={onCellKeyPress}
    onGridReady={onGridReady}
    onFirstDataRendered={onFirstDataRendered}
    onSelectRange={(range) => setRangeSelection(range)}
    onChangeGridCursorPosition={(frame) => setGridCursorPos(frame)}
    rangeSelection={rangeSelection}    
    keyframeLock={keyframeLock}
    showCursors={showCursors}
    managedFields={managedFields}
    fps={options?.output_fps}
    bpm={options?.bpm}
    agGridStyle={{ width: '100%', minHeight: '150px', height: '150px', maxHeight: '1150px', }}
  />, [rangeSelection, options, onCellValueChanged, onCellKeyPress, onGridReady, onFirstDataRendered, keyframeLock, showCursors, managedFields]);


  const gridHeightToggle = useMemo(() =>  <Stack direction="row" alignItems="center" justifyContent={"flex-start"} gap={1}>
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
</Stack>, [gridHeight, setGridHeight]);

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
    ? prompts.promptList.flatMap((p, idx) => [{
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

    <Grid container wrap='false'>
      <Grid xs={6}>
        <Stack  direction={{  xs: 'column', sm: 'column', md: 'row' }} alignItems={{  xs: 'flex-start', sm: 'flex-start', md: 'center' }} justifyContent={"flex-start"}   spacing={1}>
          <TextField
            select
            fullWidth={false}
            size="small"
            style={{ width: '8em', marginLeft: '5px' }}
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
        <Stack  direction={{  xs: 'column', sm: 'column', md: 'row' }} alignItems={{  xs: "flex-end", sm: "flex-end", md: 'center' }} justifyContent={"flex-end"}   spacing={1}>
          <Typography fontSize="0.75em" fontWeight={'bold'}>Markers:</Typography>
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

  const editableGraph = useMemo(() => renderedData && renderedData.rendered_frames && <ParseqGraph
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
    height={"400px"} // TODO - make this configurable
    updateKeyframe={(field, index, value) => {
      let rowId = frameToRowId(index)
      gridRef.current.api.getRowNode(rowId).setDataValue(field, value+""); //coerce to string
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
              <Grid
                key={"sparkline_" + field}
                xs={1} 
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: displayedFields.includes(field) ? theme.vars.palette.faintHighlight.main : theme.vars.palette.background.main
                }}
                id={`sparkline_${field}`}
                onClick={handleClickedSparkline} >
                
                <Typography style={{ fontSize: "0.5em" }}>
                {displayedFields.includes(field) ? <CheckCircleOutlineRoundedIcon fontSize='inherit' /> : <></>}&nbsp;{field}</Typography>
                {defaultFields.find(f => f.name === field)?.labels?.includes("2D") ?
                  <Typography style={{ color: 'SeaGreen', fontSize: "0.5em" }} >[2D]</Typography> :
                  defaultFields.find(f => f.name === field)?.labels?.includes("3D") ?
                    <Typography style={{ color: 'SteelBlue', fontSize: "0.5em" }} >[3D]</Typography> :
                    <Typography style={{ color: 'grey', fontSize: "0.5em" }} >[2D+3D]</Typography>
                }
                {
                  <Sparklines data={sparklineData[field]} margin={1} padding={1}>
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
  }, [displayedFields, showFlatSparklines, renderedData, managedFields, handleClickedSparkline, sparklineData, theme]);



  // Raw output ------------------------

  const renderedDataJsonString = useMemo(() => {
    if (renderedData) {
      // Apply any post-processing that should *only* be reflected in uploaded and copied output (not in graph etc...)
      // NOTE: This kind of logic would really be better suited in the a1111 extension, but this is easier to change
      // without being dependent on a PR merge. :)
      if (reverseRender && renderedData.rendered_frames) {
        const postProcessed = _.cloneDeep(renderedData);
        postProcessed.rendered_frames = postProcessed.rendered_frames.reverse();
        postProcessed.rendered_frames.forEach((frame, idx) => {
          frame.frame = idx;
          Object.keys(frame).forEach((key) => {
            if (key.endsWith('_delta')) {
              if (key === 'zoom_delta') {
                frame[key] = 1 / frame[key];
              } else {
                frame[key] = -frame[key];
              }
            }
          });
        });
        return JSON.stringify(postProcessed, null, 4);
      } else {
        return JSON.stringify(renderedData, null, 4);
      }
    }
  }, [renderedData, reverseRender]);

  const renderedOutput = useMemo(() =>
    renderedDataJsonString && <>
      {
        (renderedDataJsonString.length > getOutputTruncationLimit()) ?
          <Alert severity="warning">
            Rendered output is truncated at {prettyBytes(getOutputTruncationLimit())}. Use the "copy output" or "upload output" button below to access the full data.
          </Alert>
          : <></>
      }
      <div style={{ fontSize: '0.75em', maxHeight: '40em', overflow: 'scroll' }}>
        <pre data-testid="output">{renderedDataJsonString.substring(0, getOutputTruncationLimit())}</pre>
      </div>
    </>, [renderedDataJsonString]);


  // Footer ------------------------

  const debugStatus = useMemo(() => {
    if (process.env.NODE_ENV === 'development' || debugMode) {
      return <Alert severity="info">
        Active version: {activeVersionId?.split("-")[1]}
        <ul>
          {
            debugUndoStack.map((v, idx) => {
              return <li key={idx}>
                <Typography fontSize={'0.8em'} fontWeight={v.current ? 'bold' : ''} >
                  {idx}: {v.versionId.split("-")[1]} – changes: {v.changes.join(', ')}
                </Typography></li>
            })
          }
        </ul>

      </Alert>
    } else {
      return <></>;
    }
  }, [debugUndoStack, activeVersionId, debugMode]);
  

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
        {
          managedFields.some(f => f.startsWith('cn_') ||  f.startsWith('guided_')) ? ' For ControlNet or Guided Image field support, make sure you are using the latest version of the Deforum extension.' : ''
        }
        <p><small>{message}</small></p>
      </Alert>;
    }
    return <div>
      {errorMessage}
      {statusMessage}
    </div>
  }, [needsRender, renderedData, renderedErrorMessage, enqueuedRender, managedFields]);

  const renderButton = useMemo(() =>
    <Stack>
      <Button data-testid="render-button" size="small" disabled={enqueuedRender} variant="contained" onClick={() => setEnqueuedRender(true)}>{needsRender ? '📈 Render' : '📉 Re-render'}</Button>
      {lastRenderTime ? <Typography fontSize='0.7em' >Last rendered: <ReactTimeAgo tooltip={true} date={lastRenderTime} locale="en-GB" />.</Typography> : <></>}
    </Stack>
    , [needsRender, enqueuedRender, lastRenderTime]);

  const miniFooterContent = useMemo(() => {

    let miniMessage;
    if (enqueuedRender && !renderedErrorMessage) {
      miniMessage = {icon: <WarningAmberRoundedIcon />, color: theme.vars.palette.warning.light, message: "Render in progres..."};
    } else if (renderedErrorMessage) {
      miniMessage = {icon: <ErrorOutlineRoundedIcon />, color: theme.vars.palette.error.light,  message: "Error during render. Hover for details."};
    } else if (needsRender) {
      miniMessage = {icon: <InfoOutlinedIcon />, color: theme.vars.palette.info.light, message: "Please render to update the output."};
    } else {
      miniMessage = {icon: <CheckCircleOutlineRoundedIcon />, color: theme.vars.palette.success.light, message: "Output is up-to-date."};
    }

    return <Grid container spacing={1} alignItems='center' >
      <Grid xs={'auto'} alignItems={'center'} flexGrow={100}>
        <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} backgroundColor={miniMessage.color}>
          {miniMessage.icon}
          <Typography fontSize={"0.75em"}>{miniMessage.message}</Typography>
        </Stack>
      </Grid>
    </Grid>
  }, [needsRender, renderedErrorMessage, enqueuedRender, theme]);

  const maxiFooterContent = useMemo(() => <Grid container spacing={1} wrap='nowrap'>
    <Grid xs={'auto'}>
      <Tooltip2 title='Pin/unpin the footer to the bottom of the screen'>
        <Button variant='outlined' onClick={(e)=>setPinFooter(lockFooter => !lockFooter )}><FontAwesomeIcon icon={faThumbtack} rotation={pinFooter?0:270} /></Button>
      </Tooltip2>
    </Grid>
    <Grid xs={'auto'}>
    </Grid>
    <Grid xs={6}>
      <InitialisationStatus status={initStatus} alignItems='center' />
      {renderStatus}
      {(process.env.NODE_ENV === 'development') && debugStatus}
    </Grid>
    <Grid xs={2}>
      <Stack direction={'column'}>
        {renderButton}
        <UserAuthContextProvider>
          <UploadButton
            docId={activeDocId}
            renderedJson={renderedDataJsonString}
            autoUpload={autoUpload}
            onNewUploadStatus={(status) => setUploadStatus(status)} />
        </UserAuthContextProvider>
      </Stack>
    </Grid>
    <Grid xs={2}>
      <Stack direction={'column'}>
        <FormControlLabel control={<Checkbox
          checked={autoRender}
          id={"auto_render"}
          onChange={(e) => setAutoRender(e.target.checked)} />}
          style={{ marginLeft: '0.75em' }}
          label={<Box component="div" fontSize="0.75em">Auto-render</Box>} />
        <FormControlLabel control={<Checkbox
          checked={autoUpload}
          id={"auto_render"}
          onChange={(e) => setAutoUpload(e.target.checked)} />}
          style={{ marginLeft: '0.75em' }}
          label={<Box component="div" fontSize="0.75em">Auto-upload</Box>} />
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
        <Stack direction={'column'} justifyContent={'right'} justifyItems={'right'} justifySelf={'right'}>
          {uploadStatus}
        </Stack>
      </Stack>
    </Grid>
  </Grid>
  , [renderStatus, initStatus, renderButton, renderedDataJsonString, activeDocId, autoUpload, needsRender, uploadStatus, autoRender, pinFooter, debugStatus]);


  const stickyFooter = useMemo(() => <Paper
    onMouseOver={(e) => setHoverFooter(true)}
    onMouseOut={(e) => setHoverFooter(false)}
    elevation={3}
    sx={{
      zIndex:1000,
      padding: '5px',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.vars.palette.footerbg.main,
      opacity: '99%'
    }}>
    <Collapse in={pinFooter || hoverFooter}>{maxiFooterContent}</Collapse>
    <Collapse in={!pinFooter && !hoverFooter}>{miniFooterContent}</Collapse>
  </Paper>, [pinFooter, hoverFooter, maxiFooterContent, miniFooterContent, theme]);

  //////////////////////////////////////////
  // Hotkeys
  ///////////////////////////////////////////////////////////////


  useHotkeys('mod+z', () => {
    undoManager.undo((recovered => setPersistableState(recovered)));
    setDebugUndoStack(undoManager.confessUndoStack());
  }, {preventDefault:true, scopes:['main']}, [loadVersion, setPersistableState, undoManager])

  useHotkeys('shift+mod+z', () => {
    undoManager.redo((recovered => setPersistableState(recovered)));
    setDebugUndoStack(undoManager.confessUndoStack());
  }, {preventDefault:true, scopes:['main']}, [loadVersion, setPersistableState, undoManager])

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
      <Grid xs={8}  >
        {docManager}
      </Grid>
      <Grid xs={4}
        sx={{
          borderLeft: 'var(--Grid-borderWidth) solid',
          borderRight: 'var(--Grid-borderWidth) solid',
          borderBottom: 'var(--Grid-borderWidth) solid',
          borderColor: 'divider',
        }}>
        <Stack width={'100%'} direction="row" spacing={1} flex='flex-grow' fullWidth flexGrow={4} alignItems={'flex-start'}>
          <SupportParseq />
        </Stack>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Options">
          {optionsUI}
        </ExpandableSection>
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
            afterFocus={(e) => setIsDocDirty(true)}
            afterBlur={(e) => setIsDocDirty(false)}
          />
          }
        </ExpandableSection>
      </Grid>
      <Grid xs={12} style={{ display: 'inline', alignItems: 'center' }}>
        <ExpandableSection
          // TODO: we always have to render the grid currently, else we lose keyframes because they reference grid data.
          renderChildrenWhenCollapsed={true}
          title="Keyframe grid">
          <Stack direction='row' justifyContent={'space-between'} fullWidth>
            {displayedFieldSelector}
            {gridHeightToggle}
          </Stack>
          {grid}
          <Stack direction='row' justifyContent={'space-between'} fullWidth>
            <Stack direction='row' gap={1} id='gridControls' fullWidth>
              {addRowDialog}
              {bulkEditDialog}
              {mergeKeyframesDialog}
              {deleteRowDialog}
            </Stack>
            <Button href='/functionDocs' target='_blank' color='success' size="small" variant="outlined">📈 Function docs</Button>
          </Stack>          
          
        </ExpandableSection>
      </Grid>
      <Grid xs={12}>
        <ExpandableSection title="Field graph">
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
              <MovementPreview
                renderedData={renderedData.rendered_frames}
                fps={options?.output_fps || 20}
                height={512}
                width={512}
              />
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