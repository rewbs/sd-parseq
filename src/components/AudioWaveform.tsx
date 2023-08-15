import { Box, Alert, Typography, Button, Stack, TextField, MenuItem, Tab, Tabs, Link } from "@mui/material";
import Tooltip from './PatchedToolTip';
import Fade from '@mui/material/Fade';
import Grid from '@mui/material/Unstable_Grid2';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import colormap from '../data/hot-colormap.json';

//@ts-ignore
import debounce from 'lodash.debounce';
import { frameToBeat, secToFrame, secToBeat, frameToSec, beatToSec } from "../utils/maths";
import { createAudioBufferCopy, getWavBytes } from "../utils/utils";
import { SmallTextField } from "./SmallTextField";
import { TabPanel } from "./TabPanel";
import { BiquadFilter } from "./BiquadFilter";
import { useHotkeys } from 'react-hotkeys-hook'
import { CssVarsPalette, Palette, SupportedColorScheme, experimental_extendTheme as extendTheme, useColorScheme } from "@mui/material/styles";
import { themeFactory } from "../theme";
import _ from "lodash";
import WaveSurferPlayer, { TimelineOptions, ViewportOptions } from "./WaveSurferPlayer";


type AudioWaveformProps = {
    fps: number,
    bpm: number,
    xaxisType: "frames" | "seconds" | "beats",
    viewport: ViewportOptions,
    keyframesPositions: number[],
    gridCursorPos: number,
    beatMarkerInterval: number,
    promptMarkers: { x: number, label: string, color: string, top: boolean }[],
    onScroll: ({ startFrame, endFrame }: { startFrame: number, endFrame: number }) => void,
    onCursorMove: (frame: number) => void,
    onAddKeyframes: (frames: number[], infoLabel: string) => void,
}


// The parent component on the main view that includes the waveform, the controls, the analysis tabs etc...
export function AudioWaveform(props: AudioWaveformProps) {
    //console.log("Initialising AudioReference with props: ", props);


    const analysisBufferSize = 4096;
    const analysisHopSize = 256;

    const fileInput = useRef<HTMLInputElement>("" as any);
    const waveformRef = useRef<HTMLDivElement>(null);
    const [statusMessage, setStatusMessage] = useState(<></>);
    const [lastPxPerSec, setLastPxPerSec] = useState(0);
    const [lastViewport, setLastViewport] = useState({ startFrame: 0, endFrame: 0 });
    const [timelineOptions, setTimelineOptions] = useState<TimelineOptions>({ fps: props.fps, bpm: props.bpm, xaxisType: props.xaxisType });
    const [viewport, setViewport] = useState<ViewportOptions>(props.viewport);

    const [prevTimelineOptions, setPrevTimelineOptions] = useState<object>();
    const [tab, setTab] = useState(1);

    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
    const [audioFile, setAudioFile] = useState<Blob>();
    //const [unfilteredAudioBuffer, setUnfilteredAudioBuffer] = useState<AudioBuffer>();
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
    const [showSpectrogram, setShowSpectrogram] = useState(true);

    const theme = extendTheme(themeFactory());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { colorScheme, setColorScheme } = useColorScheme();
    const palette = theme.colorSchemes[(colorScheme || 'light') as SupportedColorScheme].palette;
    const [prevPalette, setPrevPalette] = useState<Palette & CssVarsPalette>();

    const wsOptions = useMemo(() => ({
        barWidth: 0,
        normalize: true,
        fillParent: true,
        minPxPerSec: 10,
        autoCenter: false,
        interact: true,
        cursorColor: palette.success.light,
        waveColor: [palette.waveformStart.main, palette.waveformEnd.main],
        progressColor: [palette.waveformProgressMaskStart.main, palette.waveformProgressMaskEnd.main],
        cursorWidth: 1,
        plugins: [
            //@ts-ignore
            //RegionsPlugin.create(),
            SpectrogramPlugin.create({
                labels: true,
                height: 75,
                colorMap: colormap
            }),
            //@ts-ignore           
            MinimapPlugin.create({
                //container: "#minimap",
                height: 20,
                waveColor: [palette.waveformStart.main, palette.waveformEnd.main],
                progressColor: [palette.waveformProgressMaskStart.main, palette.waveformProgressMaskEnd.main],
            })
        ],
    }), [palette]);

    useEffect(() => {
        setTimelineOptions({ fps: props.fps, bpm: props.bpm, xaxisType: props.xaxisType });
    }, [props.fps, props.bpm, props.xaxisType])

    // // Update the colours manually on palette change.
    // // This is necessary because we are not recreating wavesurfer that often
    // useEffect(() => {
    //     if (wavesurferRef.current) {
    //         // @ts-ignore - type definition is wrong?
    //         wavesurferRef.current.setWaveColor([palette.waveformStart.main, palette.waveformEnd.main]);
    //         // @ts-ignore - type definition is wrong?
    //         wavesurferRef.current.setProgressColor([palette.waveformProgressMaskStart.main, palette.waveformProgressMaskEnd.main]);
    //         wavesurferRef.current.setCursorColor(palette.success.light);
    //     }
    // }, [palette]);


    // const handleDoubleClick = useCallback((event: any) => {
    //     const time = wavesurferRef.current?.getCurrentTime();
    //     //@ts-ignore
    //     const newMarkers = [...manualEvents, time].sort((a, b) => a - b)
    //     //@ts-ignore
    //     setManualEvents(newMarkers);
    // }, [manualEvents]);


    // const handleMarkerDrop = useCallback((marker: Marker) => {
    //     //console.log("In handleMarkerDrop", marker);
    //     const draggedEventType = deduceMarkerType(marker);
    //     const newEvents = (wavesurferRef.current?.markers.markers||[])
    //         .filter(m => deduceMarkerType(m) === draggedEventType)
    //         .map(m => m.time);

    //     if (draggedEventType === "manual") {
    //         setManualEvents(newEvents);
    //     } else if (draggedEventType === "detected") {
    //         setDetectedEvents(newEvents);
    //     }

    // }, [ ]);

    // // Shift-clicking a marker deletes it.
    // const handleMarkerClick = useCallback((marker: Marker, event : PointerEvent) => {
    //     if (event.shiftKey) { 
    //         const draggedEventType = deduceMarkerType(marker);
    //         const newEvents = (wavesurferRef.current?.markers.markers||[])
    //             .filter(m => deduceMarkerType(m) === draggedEventType)
    //             .map(m => m.time)
    //             .filter(m => m !== marker.time);
    //         if (draggedEventType === "manual") {
    //             setManualEvents(newEvents);
    //         } else if (draggedEventType === "detected") {
    //             setDetectedEvents(newEvents);
    //         }
    //     }
    // }, []);

    // const deduceMarkerType = (marker: Marker) => {
    //     if (marker.label?.includes("manual")) {
    //         return "manual";
    //     }
    //     if (marker.label?.includes("detected")) {
    //         return "detected";
    //     }
    //     return "unknown";
    // };


    // Update wavesurfer's double-click callback when manual events change
    // TODO: we have to explicitly register the event handler on the drawer element. 
    // Not sure if this is a bug in wavesurfer or if we're doing something wrong.
    // https://github.com/wavesurfer-js/wavesurfer.js/discussions/2759
    // useEffect(() => {
    //     //wavesurferRef.current?.on("dblclick", handleDoubleClick);
    //     wavesurferRef.current?.on("dblclick", handleDoubleClick);
    //     return () => {
    //         //wavesurferRef.current?.un("dblclick", handleDoubleClick);
    //         wavesurferRef.current?.drawer?.un("dblclick", handleDoubleClick);
    //     }
    // }, [handleDoubleClick]);

    // useEffect(() => {
    //     //wavesurferRef.current?.on("dblclick", handleDoubleClick);
    //     wavesurferRef.current?.drawer?.on("lick", handleClick);
    //     return () => {
    //         //wavesurferRef.current?.un("dblclick", handleDoubleClick);
    //         wavesurferRef.current?.drawer?.un("click", handleClick);
    //     }
    // }, [handleClick]);

    // useEffect(() => {
    //     wavesurferRef.current?.on("marker-drop", handleMarkerDrop);
    //     return () => {
    //         wavesurferRef.current?.un("marker-drop", handleMarkerDrop);
    //     }
    // }, [handleMarkerDrop]);

    // useEffect(() => {
    //     wavesurferRef.current?.on("marker-click", handleMarkerClick);
    //     return () => {
    //         wavesurferRef.current?.un("marker-click", handleMarkerClick);
    //     }
    // }, [handleMarkerDrop, handleMarkerClick]);        



    const loadFile = async (event: any) => {
        try {
            const selectedFiles = fileInput.current.files;
            if (!selectedFiles || selectedFiles.length < 1) {
                return;
            }
            const selectedFile = selectedFiles[0];
            const arrayBuffer = await selectedFile.arrayBuffer();
            const audioContext = new AudioContext();
            const newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(newAudioBuffer);
            setAudioFile(selectedFile);
            setViewport({ ...viewport }); // Force scroll and zoom back to same position after load.
            //updateMarkers();
            event.target.blur(); // Remove focus from the file input so that spacebar doesn't trigger it again (and can be used for immediate playback)

        } catch (e: any) {
            setStatusMessage(<Alert severity="error">Error loading file: {e.message}</Alert>)
            console.error(e);
        }
    }

    // const updateMarkers = useCallback(() => {
    //     wavesurferRef.current?.markers.clear();

    //     if (!trackLength) {
    //         return;
    //     }

    //     props.promptMarkers.forEach((marker) => {
    //         wavesurferRef.current?.markers.add(
    //             {
    //                 ...marker,
    //                 time: frameToSec(marker.x, props.fps),
    //                 position: marker.top ? "top" : "bottom" as const,
    //                 //@ts-ignore - extra metadata
    //                 meta: "prompt"
    //             })
    //     });

    //     props.keyframesPositions.forEach((frame) => {
    //         wavesurferRef.current?.markers.add({
    //             time: frameToSec(frame, props.fps),
    //             color: "rgba(255, 120, 220, 0.5)",
    //             position: "bottom" as const,
    //             draggable: false,
    //             label: `keyframe[${frame}]`,
    //             //@ts-ignore - extra metadata
    //             meta: "keyframe"
    //         });
    //     });

    //     if (props.gridCursorPos >= 0) {
    //         wavesurferRef.current?.markers.add({
    //             time: frameToSec(props.gridCursorPos, props.fps),
    //             color: "blue",
    //             position: "top" as const,
    //             draggable: false,
    //             label: 'grid cursor',
    //             //@ts-ignore - extra metadata
    //             meta: "cursor"
    //         });
    //     }

    //     if (props.beatMarkerInterval > 0) {
    //         for (var i = 0; i < trackLength; i += props.beatMarkerInterval * 60 / props.bpm) {
    //             wavesurferRef.current?.markers.add({
    //                 time: i,
    //                 color: "rgba(0, 0, 0, 0.5)",
    //                 position: "bottom" as const,
    //                 draggable: false,
    //                 label: `Beat ${(i / 60 * props.bpm).toFixed(0)}`,
    //                 //@ts-ignore - extra metadata
    //                 meta: "beat"
    //             });
    //         }
    //     }

    //     manualEvents.forEach((marker) => {
    //         wavesurferRef.current?.markers.add({
    //             time: marker,
    //             position: "top" as const,
    //             color: "rgba(255, 0, 0, 0.7)",
    //             label: "event (manual)",
    //             draggable: true,
    //             //@ts-ignore - extra metadata
    //             meta: "event - manual"
    //         });
    //     });

    //     detectedEvents.forEach((marker) => {
    //         wavesurferRef.current?.markers.add({
    //             time: marker,
    //             position: "top" as const,
    //             color: "rgba(255, 0, 0, 0.7)",
    //             label: "event (detected)",
    //             draggable: true,
    //             //@ts-ignore - extra metadata
    //             meta: "event - detected"
    //         });
    //     });        

    // }, [props, trackLength, manualEvents, detectedEvents]);

    // useEffect(() => {
    //     updateMarkers();
    // }, [updateMarkers]);


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

        const newDetectedEvents: number[] = [];
        onsetDetectionWorker.onmessage = (e: any) => {
            if (onsetRef.current && e.data.eventS) {
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
            silence: Number.parseFloat(onsetSilence),
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

    // useHotkeys('shift+a',
    //     () => {
    //         // TODO might need to pass a custom handler down from here to the player
    //         //const time = wavesurferRef.current?.getCurrentTime();
    //         //@ts-ignore
    //         const newMarkers = [...manualEvents, time].sort((a, b) => a - b)
    //         //@ts-ignore
    //         setManualEvents(newMarkers);
    //     },
    //     { preventDefault: true, scopes: ['main'] },
    //     [manualEvents])



    return <>
        <Grid container>
            <Grid xs={12}>
                <Box padding='5px'>
                    <Stack direction="row" alignContent={"center"} justifyContent="space-between">
                        <Box>
                            <strong>File:</strong><input
                                onClick={ e => {
                                        //@ts-ignore
                                        e.target.value = null;
                                    }
                                }
                                type="file" accept=".mp3,.wav,.flac,.flc,.wma,.aac,.ogg,.aiff,.alac"
                                ref={fileInput}
                                onChange={(e) => {
                                    setIsLoaded(true);
                                    loadFile(e);
                                }} />
                        </Box>
                        {audioBuffer && <BiquadFilter
                            unfilteredAudioBuffer={audioBuffer}
                            updateAudioBuffer={(updatedAudioBuffer) => {
                                const wavBytes = getWavBytes(updatedAudioBuffer.getChannelData(0).buffer, {
                                    isFloat: true,       // floating point or 16-bit integer
                                    numChannels: 1,
                                    sampleRate: updatedAudioBuffer.sampleRate,
                                })
                                const blob = new Blob([wavBytes], { type: 'audio/wav' })
                                setAudioFile(blob);
                            }}
                        />}
                    </Stack>
                    <Typography fontSize="0.75em">
                        Note: audio data is not saved with Parseq documents. You will need to reload your reference audio file when you reload your Parseq document.
                    </Typography>
                </Box>
            </Grid>

            <Box
                display={isLoaded ? 'inline-block' : 'none'}
                width={'100%'} >
                <Grid xs={12}>
                    <WaveSurferPlayer
                        audioFile={audioFile}
                        wsOptions={wsOptions}
                        timelineOptions={timelineOptions}
                        viewport={viewport}
                        onscroll={(startFrame, endFrame) => {
                            const newViewPort = {startFrame: Math.round(startFrame), endFrame: Math.round(endFrame)};
                            if (!_.isEqual(viewport, newViewPort)) {
                                props.onScroll(newViewPort);                                
                            }
                            //setStartVisibleFrame(startFrame);
                            //setEndVisibleFrame(endFrame);
                        }}
                        onready={() => {
                            setIsLoaded(true);
                        }}
                    />

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
                            <Button size="small" disabled={isAnalysing} onClick={estimateBPM} variant='outlined'>
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
                                <Tooltip arrow placement="top" title={"Volume in dB under which events will not be detected. A value of -20.0 eliminates most events but the loudest. A value of -90.0 allows all events."} >
                                    <SmallTextField
                                        label="Silence"
                                        type="number"
                                        value={onsetSilence}
                                        onChange={(e) => setOnsetSilence(e.target.value)}
                                        disabled={isAnalysing}
                                    />
                                </Tooltip>
                                <Button size="small" disabled={isAnalysing} onClick={detectEvents} variant='outlined'>
                                    Detect Events &nbsp;
                                    {(isAnalysing) &&
                                        <Fade in={isAnalysing}>
                                            <Typography fontSize={"0.7em"} fontFamily={"monospace"} ref={onsetProgressRef}>(0%)</Typography>
                                        </Fade>}
                                </Button>
                                <Typography fontFamily={"monospace"} fontWeight={"bold"} ref={onsetRef}></Typography>
                            </Stack>
                            <Box>
                                <Button size="small" onClick={() => clearEvents(true)} variant='outlined'>❌ Clear events</Button>
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
                            <Button size="small" onClick={generateKeyframes} variant='outlined'>Generate {manualEvents.length + detectedEvents.length} keyframes</Button>
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