import { Box, Alert, Typography, Button, Stack, TextField, MenuItem, Tab, Tabs, Tooltip, Link } from "@mui/material";
import Fade from '@mui/material/Fade';
import Grid from '@mui/material/Unstable_Grid2';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WaveForm, WaveSurfer } from "wavesurfer-react";
//@ts-ignore
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min";
//@ts-ignore
import MarkersPlugin, { Marker } from "wavesurfer.js/src/plugin/markers";
//@ts-ignore
import SpectrogramPlugin from "wavesurfer.js/dist/plugin/wavesurfer.spectrogram.min";
import colormap from '../data/hot-colormap.json';

//@ts-ignore
import debounce from 'lodash.debounce';
import { frameToBeat, frameToSec } from "../utils/maths";
import { createAudioBufferCopy } from "../utils/utils";
import { SmallTextField } from "./SmallTextField";
import { TabPanel } from "./TabPanel";
import { BiquadFilter } from "./BiquadFilter";
import { useHotkeys } from 'react-hotkeys-hook'

type AudioWaveformProps = {
    fps: number,
    bpm: number,
    xaxisType: "frames" | "seconds" | "beats",
    viewport: { startFrame: number, endFrame: number },
    keyframesPositions: number[],
    gridCursorPos: number,
    beatMarkerInterval: number,
    promptMarkers: { x: number, label: string, color: string, top: boolean }[],
    onScroll: ({ startFrame, endFrame }: { startFrame: number, endFrame: number }) => void,
    onCursorMove: (frame: number) => void,
    onAddKeyframes: (frames: number[], infoLabel:string) => void,
}

// Used by the audio reference view in the Main UI.
// TODO: merge with WavesurferWaveform.tsx
export function AudioWaveform(props: AudioWaveformProps) {

    //console.log("Initialising Waveform with props: ", props);

    const analysisBufferSize = 4096;
    const analysisHopSize = 256;

    const wavesurferRef = useRef<WaveSurfer>();
    const fileInput = useRef<HTMLInputElement>("" as any);
    const waveformRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackPos, setPlaybackPos] = useState<string>();
    const [trackLength, setTrackLength] = useState(0);
    const [statusMessage, setStatusMessage] = useState(<></>);
    const [lastPxPerSec, setLastPxPerSec] = useState(0);
    const [lastViewport, setLastViewport] = useState({ startFrame: 0, endFrame: 0 });
    const [tab, setTab] = useState(1);

    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
    const [unfilteredAudioBuffer, setUnfilteredAudioBuffer] = useState<AudioBuffer>();
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const tempoRef = useRef<HTMLInputElement>(null);
    const tempoConfidenceRef = useRef<HTMLInputElement>(null);
    const tempoProgressRef = useRef<HTMLInputElement>(null);

    const [onsetMethod, setOnsetMethod] = useState("default");
    const [onsetThreshold, setOnsetThreshold] = useState("1.1");
    const [onsetSilence, setOnsetSilence] = useState("-70");
    const onsetRef = useRef<HTMLInputElement>(null);
    const onsetProgressRef = useRef<HTMLInputElement>(null);

    const [manualEvents, setManualEvents] = useState<number[]>([]);
    const [detectedEvents, setDetectedEvents] = useState<number[]>([]);

    const [infoLabel, setInfoLabel] = useState(new Date().toTimeString().split(' ')[0]);

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [showSpectrogram, setShowSpectrogram] = useState(false);
    


    // Triggered when user makes viewport changes outside of wavesurfer, and we need to update wavesurfer.
    const scrollToPosition = useCallback((startFrame: number) => {
        if (!trackLength) {
            //console.log('No track loaded');
            return;
        }
        if (!wavesurferRef.current?.drawer?.wrapper) {
            console.log('WaveSurfer not yet initialised.',
                wavesurferRef.current, wavesurferRef.current?.drawer, wavesurferRef.current?.drawer?.wrapper);
            return;
        }

        // Convert the frame position to pixels
        const pxPerSec = wavesurferRef.current.params.minPxPerSec;
        const startSec = startFrame / props.fps;
        const startPx = startSec * pxPerSec;

        // Update the scroll position
        wavesurferRef.current.drawer.wrapper.scrollLeft = startPx;
    }, [trackLength, props.fps]);


    // Triggered when user scrolls wavesurfer itself
    const onScroll = debounce(useCallback(() => {
        if (!trackLength) {
            //console.log('No track loaded');
            return;
        }

        //console.log("Scrolling. Old viewport:", lastViewport);
        if (!wavesurferRef.current) {
            return;
        }
        const pxPerSec = wavesurferRef.current.params.minPxPerSec;
        const startFrame = Math.round(wavesurferRef.current.drawer.wrapper.scrollLeft / pxPerSec * props.fps);
        const endFrame = Math.round((wavesurferRef.current.drawer.wrapper.scrollLeft + wavesurferRef.current.drawer.container.clientWidth) / pxPerSec * props.fps);

         // Check both start and end frame because of elastic scroll 
         // at full right scroll mistakenly triggering a zoom-in.
        if (startFrame === lastViewport.startFrame
            || endFrame === lastViewport.endFrame) {
            //console.log("no scrolling required");
            return;
        }
        const newViewport = { startFrame, endFrame };
        //console.log("New viewport:", newViewport);        
        if ((newViewport.startFrame !== lastViewport.startFrame
            || newViewport.endFrame !== lastViewport.endFrame)
            && newViewport.startFrame < newViewport.endFrame
            && newViewport.startFrame >= 0) {

            setLastViewport(newViewport);

            // Communicate the new viewport to the parent component
            props.onScroll(newViewport);
            //console.log("Scrolled viewport to:", newViewport);         
        }

    }, [props, lastViewport, trackLength]), 50);

    const debouncedOnCursorMove = useMemo(() => debounce(props.onCursorMove, 100), [props]);

    const handleDoubleClick = useCallback((event: any) => {
        const time = wavesurferRef.current?.getCurrentTime();
        //@ts-ignore
        const newMarkers = [...manualEvents, time].sort((a, b) => a - b)
        //@ts-ignore
        setManualEvents(newMarkers);
    }, [manualEvents]);

    const handleMarkerDrop = useCallback((marker: Marker) => {
        //console.log("In handleMarkerDrop", marker);
        const draggedEventType = deduceMarkerType(marker);
        const newEvents = (wavesurferRef.current?.markers.markers||[])
            .filter(m => deduceMarkerType(m) === draggedEventType)
            .map(m => m.time);
    
        if (draggedEventType === "manual") {
            setManualEvents(newEvents);
        } else if (draggedEventType === "detected") {
            setDetectedEvents(newEvents);
        }
        
    }, [ ]);

    // Shift-clicking a marker deletes it.
    const handleMarkerClick = useCallback((marker: Marker, event : PointerEvent) => {
        if (event.shiftKey) { 
            const draggedEventType = deduceMarkerType(marker);
            const newEvents = (wavesurferRef.current?.markers.markers||[])
                .filter(m => deduceMarkerType(m) === draggedEventType)
                .map(m => m.time)
                .filter(m => m !== marker.time);
            if (draggedEventType === "manual") {
                setManualEvents(newEvents);
            } else if (draggedEventType === "detected") {
                setDetectedEvents(newEvents);
            }
        }
    }, []);

    const deduceMarkerType = (marker: Marker) => {
        if (marker.label?.includes("manual")) {
            return "manual";
        }
        if (marker.label?.includes("detected")) {
            return "detected";
        }
        return "unknown";
    };

    const updatePlaybackPos = useCallback(() => {
        const lengthFrames = trackLength * props.fps;
        const curPosSeconds = wavesurferRef.current?.getCurrentTime() || 0;
        const curPosFrames = curPosSeconds * props.fps;
        setPlaybackPos(`${curPosSeconds.toFixed(3)}/${trackLength.toFixed(3)}s
            (frame: ${curPosFrames.toFixed(0)}/${lengthFrames.toFixed(0)})
    (beat: ${frameToBeat(curPosFrames, props.fps, props.bpm).toFixed(2)}/${frameToBeat(lengthFrames, props.fps, props.bpm).toFixed(2)})`);

        debouncedOnCursorMove(curPosFrames);

    }, [trackLength, debouncedOnCursorMove, props]);

    //Update wavesurfer's seek callback on track length change and fps change
    useEffect(() => {
        updatePlaybackPos();
        wavesurferRef.current?.on("seek", updatePlaybackPos);
        return () => {
            wavesurferRef.current?.un("seek", updatePlaybackPos);
        }
    }, [updatePlaybackPos]);

    //Update wavesurfer's scroll callback when the viewport changes
    useEffect(() => {
        onScroll();
        wavesurferRef.current?.on("scroll", onScroll);
        return () => {
            wavesurferRef.current?.un("scroll", onScroll);
        }
    }, [onScroll]);

    // Update wavesurfer's double-click callback when manual events change
    // TODO: we have to explicitly register the event handler on the drawer element. 
    // Not sure if this is a bug in wavesurfer or if we're doing something wrong.
    // https://github.com/wavesurfer-js/wavesurfer.js/discussions/2759
    useEffect(() => {
        //wavesurferRef.current?.on("dblclick", handleDoubleClick);
        wavesurferRef.current?.drawer?.on("dblclick", handleDoubleClick);
        return () => {
            //wavesurferRef.current?.un("dblclick", handleDoubleClick);
            wavesurferRef.current?.drawer?.un("dblclick", handleDoubleClick);
        }
    }, [handleDoubleClick]);

    useEffect(() => {
        wavesurferRef.current?.on("marker-drop", handleMarkerDrop);
        return () => {
            wavesurferRef.current?.un("marker-drop", handleMarkerDrop);
        }
    }, [handleMarkerDrop]);

    useEffect(() => {
        wavesurferRef.current?.on("marker-click", handleMarkerClick);
        return () => {
            wavesurferRef.current?.un("marker-click", handleMarkerClick);
        }
    }, [handleMarkerDrop, handleMarkerClick]);        


    if (props.viewport) {

        //TODO we could get pxPerSec from the wavesurfer object - check whether everything still works if we do that.
        const pxPerSec = (waveformRef.current?.clientWidth ?? 600) / ((props.viewport.endFrame - props.viewport.startFrame) / props.fps);

        // console.log("duration", wavesurferRef.current?.getDuration());
        // console.log("viewport", props.viewport);
        // console.log("starting point in seconds", props.viewport.startFrame/props.fps);            
        // console.log("seconds to display", (props.viewport.endFrame-props.viewport.startFrame)/props.fps);
        // console.log("width in px", waveformRef.current?.clientWidth);        
        // console.log("pxPerSec", pxPerSec);

        if (lastPxPerSec !== pxPerSec) {
            setLastPxPerSec(pxPerSec);
            wavesurferRef.current?.zoom(pxPerSec);
            scrollToPosition(props.viewport.startFrame);
        }
        if (props.viewport.startFrame !== lastViewport.startFrame || props.viewport.endFrame !== lastViewport.endFrame) {
            setLastViewport({ ...props.viewport })
        }
        if (props.viewport.startFrame !== lastViewport.startFrame) {
            scrollToPosition(props.viewport.startFrame);
        }
    }
   
    const handleWSMount = useCallback((waveSurfer: WaveSurfer) => {
        if (waveSurfer.markers) {
            waveSurfer.clearMarkers();
        }

        wavesurferRef.current = waveSurfer;

        if (wavesurferRef.current) {
            wavesurferRef.current.on("loading", (data) => {
                console.log("Wavesurfer loading --> ", data);
            });
            wavesurferRef.current.on("ready", () => {
                console.log("WaveSurfer is ready");
            });
            wavesurferRef.current.on("error", (data) => {
                console.error("WaveSurfer error: ", data);
            });
            wavesurferRef.current.on("finish", (data) => {
                setIsPlaying(false);
            });
   
            if (window) {
                //@ts-ignore
                window.surferidze = wavesurferRef.current;
            }
     }
    }, []);

    const loadFile = async (event: any) => {
        try {
            const selectedFiles = fileInput.current.files;
            if (!selectedFiles || selectedFiles.length < 1) {
                setStatusMessage(<Alert severity="error">Select an audio file above.</Alert>);
                return;
            }
            setIsLoaded(true);

            // Prepare audio buffer for analysis.
            const selectedFile = selectedFiles[0];
            const arrayBuffer = await selectedFile.arrayBuffer();
            const audioContext = new AudioContext();
            const newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setTrackLength(newAudioBuffer.duration);
            setAudioBuffer(newAudioBuffer);
            setUnfilteredAudioBuffer(createAudioBufferCopy(newAudioBuffer));

            // Load audio file into wavesurfer visualisation
            wavesurferRef.current?.loadDecodedBuffer(newAudioBuffer);
            updateMarkers();
            event.target.blur(); // Remove focus from the file input so that spacebar doesn't trigger it again (and can be used for immediate playback)

        } catch (e: any) {
            setStatusMessage(<Alert severity="error">Error loading file: {e.message}</Alert>)
            console.error(e);
        }
    }

    function playPause(fromStart:boolean = false) {
        if (isPlaying) {
            wavesurferRef.current?.pause();
        } else {
            if (fromStart) {
                wavesurferRef.current?.seekTo(0);
            }
            wavesurferRef.current?.play();
        }
        setIsPlaying(!isPlaying);
        updatePlaybackPos();
    }    

    const updateMarkers = useCallback(() => {
        wavesurferRef.current?.markers.clear();

        if (!trackLength) {
            return;
        }

        props.promptMarkers.forEach((marker) => {
            wavesurferRef.current?.markers.add(
                {
                    ...marker,
                    time: frameToSec(marker.x, props.fps),
                    position: marker.top ? "top" : "bottom" as const,
                    //@ts-ignore - extra metadata
                    meta: "prompt"
                })
        });

        props.keyframesPositions.forEach((frame) => {
            wavesurferRef.current?.markers.add({
                time: frameToSec(frame, props.fps),
                color: "rgba(255, 120, 220, 0.5)",
                position: "bottom" as const,
                draggable: false,
                label: `keyframe[${frame}]`,
                //@ts-ignore - extra metadata
                meta: "keyframe"
            });
        });

        if (props.gridCursorPos >= 0) {
            wavesurferRef.current?.markers.add({
                time: frameToSec(props.gridCursorPos, props.fps),
                color: "blue",
                position: "top" as const,
                draggable: false,
                label: 'grid cursor',
                //@ts-ignore - extra metadata
                meta: "cursor"
            });
        }

        if (props.beatMarkerInterval > 0) {
            for (var i = 0; i < trackLength; i += props.beatMarkerInterval * 60 / props.bpm) {
                wavesurferRef.current?.markers.add({
                    time: i,
                    color: "rgba(0, 0, 0, 0.5)",
                    position: "bottom" as const,
                    draggable: false,
                    label: `Beat ${(i / 60 * props.bpm).toFixed(0)}`,
                    //@ts-ignore - extra metadata
                    meta: "beat"
                });
            }
        }

        manualEvents.forEach((marker) => {
            wavesurferRef.current?.markers.add({
                time: marker,
                position: "top" as const,
                color: "rgba(255, 0, 0, 0.7)",
                label: "event (manual)",
                draggable: true,
                //@ts-ignore - extra metadata
                meta: "event - manual"
            });
        });

        detectedEvents.forEach((marker) => {
            wavesurferRef.current?.markers.add({
                time: marker,
                position: "top" as const,
                color: "rgba(255, 0, 0, 0.7)",
                label: "event (detected)",
                draggable: true,
                //@ts-ignore - extra metadata
                meta: "event - detected"
            });
        });        

    }, [props, trackLength, manualEvents, detectedEvents]);

    useEffect(() => {
        updateMarkers();
    }, [updateMarkers]);


    const formatTimeCallback = useCallback((sec: number, pxPerSec: number) => {
        // TODO - there might be a refresh issue here.
        switch (props.xaxisType) {
            case "frames":
                return `${(sec * props.fps).toFixed(0)}`;
            case "seconds":
                return `${sec.toFixed(2)}`;
            case "beats":
                return `${(sec * props.bpm / 60).toFixed(2)}`;
        }
    }, [props]);

    function timeInterval(pxPerSec: number) {
        var retval = 1;
        if (pxPerSec >= 25 * 100) {
            retval = 0.01;
        } else if (pxPerSec >= 25 * 40) {
            retval = 0.025;
        } else if (pxPerSec >= 25 * 10) {
            retval = 0.1;
        } else if (pxPerSec >= 25 * 4) {
            retval = 0.25;
        } else if (pxPerSec >= 25) {
            retval = 1;
        } else if (pxPerSec * 5 >= 25) {
            retval = 5;
        } else if (pxPerSec * 15 >= 25) {
            retval = 15;
        } else {
            retval = Math.ceil(0.5 / pxPerSec) * 60;
        }
        return retval;
    }

    // Force timeline to pick up new drawing method and 
    // to redraw when formatTimeCallback changes
    // TODO this is being called way too often. Every click triggers it.
    useEffect(() => {
        if (wavesurferRef.current) {
            // Destroy the existing timeline instance
            wavesurferRef.current.destroyPlugin('timeline');

            // Re-create the timeline instance with 
            wavesurferRef.current.addPlugin(TimelinePlugin.create({
                container: "#timeline",
                formatTimeCallback: formatTimeCallback,
                timeInterval: timeInterval,
            }));
            wavesurferRef.current.initPlugin('timeline');
            // HACK to force the timeline position to update.
            if (props.viewport.startFrame > 0) {
                scrollToPosition(props.viewport.startFrame - 1);
                scrollToPosition(props.viewport.startFrame);
            }

            // Force the wavesurfer to redraw the timeline
            wavesurferRef.current.drawBuffer();
        }
    }, [formatTimeCallback, props.viewport.startFrame, scrollToPosition]);

    const waveSurferPlugins = [
        {
            plugin: TimelinePlugin,
            options: {
                container: "#timeline",
                formatTimeCallback: formatTimeCallback,
                timeInterval: timeInterval,
            }
        },
        {
            plugin: SpectrogramPlugin,
            options: {
                container: "#spectrogram",
                labels: true,
                height: 75,
                colorMap: colormap
            }
        },
        {
            plugin: MarkersPlugin,
            options: {
                markers: [{ draggable: true }]
            }
        }
    ];

    const estimateBPM = (): void => {
        if (!audioBuffer) {
            console.log("No buffer to analyse.");
            return;
        }
        //@ts-ignore - vs code complaining about import.meta, but it works.
        const tempoDetectionWorker = new Worker(new URL('../analysisWorker-tempo.ts', import.meta.url));
        
        tempoDetectionWorker.onmessage = (e: any) => {
            if (tempoRef.current && tempoConfidenceRef.current && e.data.bpm) {
                tempoRef.current.innerText = `${e.data.fudgedBpm.toFixed(2)}BPM`;
                tempoConfidenceRef.current.innerText = `(confidence: ${(e.data.confidence * 100).toFixed(2)}%)`;
            }
            if (tempoProgressRef.current) {
                tempoProgressRef.current.innerText = `(${(e.data.progress * 100).toFixed(2)}%)`;
            }
            if (e.data.progress >= 1) {
                console.log("Tempo analysis complete");
                setIsAnalysing(false);
            }
        };
        tempoDetectionWorker.onerror = (e: any) => {
            setStatusMessage(<Alert severity="error">Error analysing tempo: {e.message}</Alert>);
            tempoDetectionWorker.terminate();
            setIsAnalysing(false);
        }

        const tempoInitData = {
            buffer: audioBuffer.getChannelData(0),
            sampleRate: audioBuffer.sampleRate,
            bufferSize: analysisBufferSize,
            hopSize: analysisHopSize,
        };
        tempoDetectionWorker.postMessage(tempoInitData);
        setIsAnalysing(true);
    }

    const detectEvents = (): void => {
        if (!audioBuffer) {
            console.log("No buffer to analyse.");
            return;
        }
        //@ts-ignore - vs code complaining about import.meta, but it works.
        const onsetDetectionWorker = new Worker(new URL('../analysisWorker-onset.ts', import.meta.url));

        const newDetectedEvents : number[] = [];
        onsetDetectionWorker.onmessage = (e: any) => {
            if (onsetRef.current && wavesurferRef.current && e.data.eventS) {
                newDetectedEvents.push(e.data.eventS);
                onsetRef.current.innerText = `${newDetectedEvents.length} events detected`;
            }

            if (onsetProgressRef.current) {
                onsetProgressRef.current.innerText = `(${(e.data.progress * 100).toFixed(2)}%)`;
            }
            if (e.data.progress >= 1) {
                console.log("Onset analysis complete");
                setIsAnalysing(false);
                setDetectedEvents(newDetectedEvents)
            }

        };
        onsetDetectionWorker.onerror = (e: any) => {
            setStatusMessage(<Alert severity="error">Error analysing events: {e.message}</Alert>);
            onsetDetectionWorker.terminate();
            setIsAnalysing(false);
        }

        const onsetInitData = {
            buffer: audioBuffer.getChannelData(0),
            sampleRate: audioBuffer.sampleRate,
            bufferSize: analysisBufferSize,
            hopSize: analysisHopSize,
            method: onsetMethod,
            threshold: Number.parseFloat(onsetThreshold),
            silence:  Number.parseFloat(onsetSilence),
            minoi: 0.02, // TODO: Not used by aubio.js?
            whitening: 1, // TODO: Not used by aubio.js?
        };
        onsetDetectionWorker.postMessage(onsetInitData);
        if (onsetRef.current) {
            onsetRef.current.innerText = `0 events detected`;
        }
        setIsAnalysing(true);
    }

    function clearEvents(all: boolean): void {
        setDetectedEvents([]);
        if (all) {
            setManualEvents([]);
        }
    }

    function generateKeyframes(): void {
        const frames = manualEvents.concat(detectedEvents).map(s => Math.round(s * props.fps));
        props.onAddKeyframes(frames, infoLabel);
    }

    useHotkeys('space', () => {
        playPause();
    }, {preventDefault:true}, [isPlaying, updatePlaybackPos])

    useHotkeys('shift+space', () => {
        playPause(true);
    }, {preventDefault:true}, [isPlaying, updatePlaybackPos])

    useHotkeys('shift+a', () => {
        const time = wavesurferRef.current?.getCurrentTime();
        //@ts-ignore
        const newMarkers = [...manualEvents, time].sort((a, b) => a - b)
        //@ts-ignore
        setManualEvents(newMarkers);
    }, {preventDefault:true}, [manualEvents])


    return <>
        <Grid container>
            <Grid xs={12}>
                <Box padding='5px'>
                <Stack direction="row" alignContent={"center"} justifyContent="space-between">
                    <Box>
                        <strong>File:</strong><input
                                  onClick={
                                    //@ts-ignore
                                    e => e.target.value = null // Ensures onChange fires even if same file is re-selected.
                                  }
                                  type="file" accept=".mp3,.wav,.flac,.flc,.wma,.aac,.ogg,.aiff,.alac"
                                  ref={fileInput}
                                  onChange={loadFile} />
                    </Box>
                    { unfilteredAudioBuffer &&
                        <BiquadFilter
                            unfilteredAudioBuffer={unfilteredAudioBuffer}
                            updateAudioBuffer={(updatedAudio) => {
                                setAudioBuffer(updatedAudio);
                                wavesurferRef.current?.loadDecodedBuffer(updatedAudio);
                            }}
                        />
                    }
                </Stack>
                <Typography fontSize="0.75em">
                    Note: audio data is not saved with Parseq documents. You will need to reload your reference audio file when you reload your Parseq document.
                </Typography>
                </Box>
            </Grid>

            <Box display={isLoaded ? 'inline-block' : 'none'} width={'100%'} >
                <Grid xs={12} ref={waveformRef}>
                    <WaveSurfer
                        plugins={waveSurferPlugins}
                        onMount={handleWSMount as ((wavesurferRef: WaveSurfer | null) => any)}
                    >
                        <WaveForm id="waveform"
                            normalize={true}
                            scrollParent={true}
                            fillParent={false}
                            minPxPerSec={10}
                            autoCenter={false}
                            interact={true}
                        />
                        <div id="timeline" />
                        <div style={{display:showSpectrogram? 'block' : 'none'}} id="spectrogram" />
                    </WaveSurfer>
                </Grid>
                <Grid xs={12}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button size="small" disabled={!wavesurferRef.current?.isReady} variant='outlined' onClick={(e) => playPause()}>
                            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
                        </Button>
                        <Typography fontSize={"0.75em"}>{playbackPos}</Typography>
                        {/* <Button onClick={(e) => setShowSpectrogram(showSpectrogram => !showSpectrogram)} >{showSpectrogram? 'Hide' : 'Show'} spectrogram</Button> */}
                    </Stack>
                </Grid>
                <Grid xs={12}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tab} onChange={(event: React.SyntheticEvent, newValue: number) => setTab(newValue)}>
                            <Tab label="BPM estimation" value={1} />
                            <Tab label="Event detection" value={2} />
                            <Tab label="Keyframe generation" value={3} />
                        </Tabs>
                    </Box>
                    <TabPanel index={1} activeTab={tab}>
                        <Stack direction="row" spacing={1} alignItems="center" >
                            <Button size="small" disabled={isAnalysing || !wavesurferRef.current?.isReady} onClick={estimateBPM} variant='outlined'>
                                Estimate BPM &nbsp;
                                {(isAnalysing) &&
                                    <Fade in={isAnalysing}>
                                        <Typography fontSize={"0.7em"} fontFamily={"monospace"} ref={tempoProgressRef}>(0%)</Typography>
                                    </Fade>}
                            </Button>
                            <Typography fontFamily={"monospace"} fontWeight={"bold"} ref={tempoRef}> </Typography>
                            <Typography fontFamily={"monospace"} fontSize={"0.7em"} ref={tempoConfidenceRef}> </Typography>
                        </Stack>
                        <Typography fontSize={"0.75em"}>Parseq uses <Link href="https://github.com/qiuxiang/aubiojs">Aubio.js</Link> to estimate your reference audio's BPM. The result is not always accurate, but can guide you towards a good overall BPM value for your Parseq document (which you set above the grid). Parseq does not yet support variable BPMs. </Typography>
                    </TabPanel>
                    <TabPanel index={2} activeTab={tab}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" flexGrow={1} gap={1} alignItems="center">
                                <Tooltip arrow placement="top" title={"The algorithm used to detect audio events. Experiment with these, as they can produce vastly different results."} >
                                    <TextField
                                        size="small"
                                        id="onsetMethod"
                                        label="Method"
                                        disabled={isAnalysing}
                                        InputLabelProps={{ shrink: true, }}
                                        InputProps={{ style: { width: "10em", fontSize: '0.75em' } }}
                                        value={onsetMethod}
                                        onChange={(e) => setOnsetMethod(e.target.value)}
                                        select
                                    >
                                        <MenuItem value={"default"}>default</MenuItem>
                                        <MenuItem value={"energy"}>energy</MenuItem>
                                        <MenuItem value={"hfc"}>hfc</MenuItem>
                                        <MenuItem value={"complex"}>complex</MenuItem>
                                        <MenuItem value={"phase"}>phase</MenuItem>
                                        <MenuItem value={"specdiff"}>specdiff</MenuItem>
                                        <MenuItem value={"kl"}>kl</MenuItem>
                                        <MenuItem value={"mkl"}>mkl</MenuItem>
                                        <MenuItem value={"specflux"}>specflux</MenuItem>
                                    </TextField>
                                </Tooltip>
                                <Tooltip arrow placement="top" title={"How picky to be when detecting events. A lower threshold results in more detected events."} >
                                    <SmallTextField
                                        label="Threshold"
                                        type="number"
                                        value={onsetThreshold}
                                        onChange={(e) => setOnsetThreshold(e.target.value)}
                                        disabled={isAnalysing}
                                    />
                                </Tooltip>
                                <Tooltip arrow placement="top"  title={"Volume in dB under which events will not be detected. A value of -20.0 eliminates most events but the loudest. A value of -90.0 allows all events."} >
                                <SmallTextField
                                        label="Silence"
                                        type="number"
                                        value={onsetSilence}
                                        onChange={(e) => setOnsetSilence(e.target.value)}
                                        disabled={isAnalysing}
                                    />
                                </Tooltip>
                                <Button size="small" disabled={isAnalysing || !wavesurferRef.current?.isReady} onClick={detectEvents} variant='outlined'>
                                    Detect Events &nbsp;
                                    {(isAnalysing) &&
                                        <Fade in={isAnalysing}>
                                            <Typography fontSize={"0.7em"} fontFamily={"monospace"} ref={onsetProgressRef}>(0%)</Typography>
                                        </Fade>}
                                </Button>
                                <Typography fontFamily={"monospace"} fontWeight={"bold"} ref={onsetRef}></Typography>
                            </Stack>
                            <Box>
                                <Button size="small" disabled={!wavesurferRef.current?.isReady} onClick={() => clearEvents(true)} variant='outlined'>❌ Clear events</Button>
                            </Box>
                        </Stack>

                        <Typography fontSize={"0.75em"}>Parseq uses <Link href="https://github.com/qiuxiang/aubiojs">Aubio.js</Link> to detect events in your reference audio. You can move events by dragging them, add events by double-clicking, and delete events by shift-clicking. You can generate Parseq keyframes from audio events in the "Keyframe generation" tab.</Typography>
                    </TabPanel>

                    <TabPanel index={3} activeTab={tab}>
                    <Stack direction="row" flexGrow={1} gap={1} alignItems="center">
                    <Tooltip arrow placement="top" title={"What you'd like to appear in the 'Info' field of the generated keyframes. By using a unique string here, you can easily bulk-edit or bulk-delete all keyframes generated in this pass."} >
                        <SmallTextField
                            label="Info label"
                            type="string"
                            value={infoLabel}
                            onChange={(e) => setInfoLabel(e.target.value)}
                            InputProps={{ style: { fontSize: "0.75em", fontFamily: "monospace", width: "18em" } }}
                            disabled={isAnalysing}
                        />
                        </Tooltip>
                        <Button size="small" disabled={!wavesurferRef.current?.isReady} onClick={generateKeyframes} variant='outlined'>Generate {manualEvents.length+detectedEvents.length} keyframes</Button>
                    </Stack>
                    </TabPanel>

                </Grid>
            </Box>
            <Grid xs={12}>
                {statusMessage}
            </Grid>
        </Grid>
    </>;


}