import { Alert, Button, TextField, Box, InputAdornment, Select, MenuItem, InputLabel, Stack, Slider } from "@mui/material";
import { PitchMethod } from "aubiojs";
import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CssBaseline from '@mui/material/CssBaseline';
import LinearWithValueLabel from "./components/LinearProgressWithLabel";
import Grid from '@mui/material/Unstable_Grid2';
// //@ts-ignore
// import drawBuffer from 'draw-wave';
import { border } from "@mui/system";
import { WaveSurfer, WaveForm, Marker } from "wavesurfer-react";
//@ts-ignore
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min";
//@ts-ignore
import MarkersPlugin, { MarkerProps } from "wavesurfer.js/src/plugin/markers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearchPlus, faSearchMinus } from '@fortawesome/free-solid-svg-icons'

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts';

import {
    Simplify,
    ISimplifyObjectPoint
} from 'simplify-ts';

// import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
// import {
//     CategoryScale, Chart as ChartJS, Interaction, Legend, LinearScale, LineElement, PointElement, Title,
//     Tooltip, LegendItem
// } from 'chart.js';
// import { Line } from 'react-chartjs-2';
// ChartJS.register(
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     LineElement,
//     Title,
//     Tooltip,
//     Legend,
// );

export default function Analyser() {

    const audioContext = new AudioContext();

    const fileInput = useRef<HTMLInputElement>("" as any);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(<></>);

    const [sampleRate, setSampleRate] = useState(44100);
    const [bufferSize, setBufferSize] = useState(512);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
    const [analysisWorkers, setAnalysisWorkers] = useState<Worker[]>([]);

    const [tempoBuffer, setTempoBuffer] = useState(4096);
    const [tempoHop, setTempoHop] = useState(256);
    const tempoRef = useRef<HTMLInputElement>(null);
    const [tempoProgress, setTempoProgress] = useState(0);

    const [onsetMethod, setOnsetMethod] = useState("default");
    const [onsetBuffer, setOnsetBuffer] = useState(4096);
    const [onsetThreshold, setOnsetThreshold] = useState(0.3);
    const [onsetHop, setOnsetHop] = useState(256);
    const [onsetWhitening, setOnsetWhitening] = useState(false);
    const [onsetMinoi, setOnsetMinoi] = useState(0.02);
    const [onsetSilence, setOnsetSilence] = useState(-90);
    const onsetRef = useRef<HTMLInputElement>(null);
    const [onsetProgress, setOnsetProgress] = useState(0);

    const [pitchMethod, setPitchMethod] = useState("default" as PitchMethod);
    const [pitchBuffer, setPitchBuffer] = useState(4096);
    const [pitchHop, setPitchHop] = useState(256);
    const [pitchTolerance, setPitchTolerance] = useState(0.7);
    const [pitchPoints, setPitchPoints] = useState<{x: number, y: number}[]>([{x: 0, y: 0}]);
    const pitchRef = useRef<HTMLInputElement>(null);
    const [pitchProgress, setPitchProgress] = useState(0);
    
    const [trackLength, setTrackLength] = useState(10);
    const analysisPos = useRef<HTMLSpanElement>(null);

    const wavesurferRef = useRef<WaveSurfer>();
    const [isPlaying, setIsPlaying] = useState(false);    
    const [waveSurferZoom, setWaveSurferZoom] = useState(50);
    

    const waveSurferPlugins = [
        {
            plugin: TimelinePlugin,
            options: {
                container: "#timeline"
            }
        },
        {
            plugin: MarkersPlugin,
            options: {
                markers: [{ draggable: true }]
            }
        }
    ];

    const handleWSMount = useCallback((waveSurfer: WaveSurfer) => {
        if (waveSurfer.markers) {
            waveSurfer.clearMarkers();
        }

        wavesurferRef.current = waveSurfer;

        if (wavesurferRef.current) {

            wavesurferRef.current.on("ready", () => {
                console.log("WaveSurfer is ready");
            });

            wavesurferRef.current.on("loading", (data) => {
                console.log("Wavesurfer loading --> ", data);
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

            // Prepare audio buffer for analysis.
            const selectedFile = selectedFiles[0];
            const arrayBuffer = await selectedFile.arrayBuffer();
            const newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);        
            setAudioBuffer(newAudioBuffer);
            setSampleRate(newAudioBuffer.sampleRate);
            setTrackLength(newAudioBuffer.duration); 

            // Load audio file into wavesurfer visualisation
            wavesurferRef.current?.loadDecodedBuffer(newAudioBuffer);
            wavesurferRef.current?.markers.clear();
        } catch(e : any) {
            setStatusMessage(<Alert severity="error">Error loading file: {e.message}</Alert>)
            console.error(e);
        }   
    }

    useEffect(() => {
        const analysisPositionS = (tempoProgress+onsetProgress+pitchProgress)/300 * trackLength;
        if (analysisPos.current) {
            analysisPos.current.innerHTML = ` ( ${analysisPositionS.toFixed(2)}s / ${trackLength.toFixed(2)}s )`;
        }

        wavesurferRef.current?.seekTo(analysisPositionS/trackLength);

        if (tempoProgress >= 100  && onsetProgress >= 100 && pitchProgress >= 100) {
            // Analysis complete.
            setIsAnalysing(false);
            setStatusMessage(<Alert severity="success">Analysis complete.</Alert>);
            wavesurferRef.current?.seekTo(0);
            
            // TODO - not sure if this is necessary?
            analysisWorkers.forEach(worker => worker.terminate());
        }

    }, [tempoProgress, onsetProgress, pitchProgress, trackLength]);

    const startStopAnalysis = async (event: any) => {

        if (isAnalysing) {
            analysisWorkers.forEach(worker => worker.terminate());
            setIsAnalysing(false);
            setStatusMessage(<></>);
            return;
        }

        if (!audioBuffer) {
            setStatusMessage(<Alert severity="error">Select an audio file above.</Alert>);
            return;
        }

        if (!onsetRef.current || !tempoRef.current || !pitchRef.current) {
            setStatusMessage(<Alert severity="error">Something went wrong. Try refreshing the page.</Alert>);
            console.error("Something went wrong. UI not ready?");
            return;
        }
        
        // Reset UI
        setIsAnalysing(true);
        setTempoProgress(0);
        tempoRef.current.value = "";
        setOnsetProgress(0);        
        onsetRef.current.value = "";
        setPitchProgress(0);
        pitchRef.current.value = "";
        setStatusMessage(<Alert severity="success">Analysing...</Alert>);
        setPitchPoints([{x: 0, y: 0}]);
        wavesurferRef.current?.markers.clear();

        // Only use left channel for now.
        const bufferToAnalyse = audioBuffer.getChannelData(0);

        //@ts-ignore - vs code complaining about import.meta, but it works.
        const tempoDetectionWorker = new Worker(new URL('./analysisWorker-tempo.ts', import.meta.url));
        //@ts-ignore - vs code complaining about import.meta, but it works.
        const onsetDetectionWorker = new Worker(new URL('./analysisWorker-onset.ts', import.meta.url));
        //@ts-ignore - vs code complaining about import.meta, but it works.
        const pitchDetectionWorker = new Worker(new URL('./analysisWorker-pitch.ts', import.meta.url));

        setAnalysisWorkers([tempoDetectionWorker, onsetDetectionWorker, pitchDetectionWorker]);

        tempoDetectionWorker.onmessage = (e : any) => {
            if (tempoRef.current && e.data.bpm) {
                tempoRef.current.value = e.data.bpm.toFixed(2);
            }
            
            setTempoProgress(e.data.progress*100);
            if (e.data.progress >= 1) {
                console.log("Tempo analysis complete");
            }
        };
        tempoDetectionWorker.onerror = (e : any) => {
            setStatusMessage(<Alert severity="error">Error analysing tempo: {e.message}</Alert>);
            setTempoProgress(100);
            tempoDetectionWorker.terminate();
        }         
        onsetDetectionWorker.onmessage = (e : any) => {
            if (onsetRef.current && wavesurferRef.current && e.data.eventS) {
                onsetRef.current.value = e.data.eventS.toFixed(4);

                const newMarker = {
                    time: e.data.eventS,
                    color: "red",
                    position: "top" as "top",
                    draggable: false,
                    meta: "onset"
                }
                wavesurferRef.current.markers.add(newMarker);                                
            }
 
            setOnsetProgress(e.data.progress*100);
            if (e.data.progress >= 1) {
                console.log("Onset analysis complete");
            }
    
        };
        onsetDetectionWorker.onerror = (e : any) => {
            setStatusMessage(<Alert severity="error">Error analysing onset: {e.message}</Alert>);
            setOnsetProgress(100);
            onsetDetectionWorker.terminate();
        }

        const pitchPointsAccumulator : {x:number, y:number}[] = [];
        pitchDetectionWorker.onmessage = (e : any) => {
            if (pitchRef.current && e.data.pitchHz) {
                pitchRef.current.value = e.data.pitchHz.toFixed(2);
            }
            const posInSeconds = e.data.progress*trackLength;

            pitchPointsAccumulator.push({
                x: posInSeconds,
                y: e.data.pitchHz,
            })

            setPitchProgress(e.data.progress*100);
            if (e.data.progress >= 1) {
                console.log("Pitch analysis complete");
                setPitchPoints(pitchPointsAccumulator);
            }
        };
        pitchDetectionWorker.onerror = (e : any) => {
            setStatusMessage(<Alert severity="error">Error analysing pitch: {e.message}</Alert>);
            setPitchProgress(100);
            pitchDetectionWorker.terminate();
        }

        // Kick off workers. 
        // TODO: consider passing buffer as a shared array buffer, could speed things up (but there appears
        // to be browser restrictions because of Spectre/Meltdown).
        const tempoInitData = {
            buffer: bufferToAnalyse,
            sampleRate: sampleRate,
            bufferSize: tempoBuffer,
            hopSize: tempoHop,
        };
        tempoDetectionWorker.postMessage(tempoInitData);

        const onsetInitData = {
            buffer: bufferToAnalyse,
            sampleRate: sampleRate,            
            bufferSize: onsetBuffer,
            hopSize: onsetHop,
            method: onsetMethod,
            threshold: onsetThreshold,
            silence: onsetSilence,
            minoi: onsetMinoi,
            whitening: onsetWhitening,
        };
        onsetDetectionWorker.postMessage(onsetInitData);

        const pitchInitData = {
            buffer: bufferToAnalyse,
            sampleRate: sampleRate,
            bufferSize: pitchBuffer,
            hopSize: pitchHop,
            method: pitchMethod,
            tolerance: pitchTolerance,
        };
        pitchDetectionWorker.postMessage(pitchInitData);

    }

    const pitchGraph = useMemo(() => {

        console.log("re-rendering pitch graph");

        // let options: ChartOptions<'line'> = {
        //     parsing: false,
        //     responsive: true,
        //     normalized: true,
        //     aspectRatio: 8,
        //     scales: {
        //         x: {
        //             display: false, //TODO: disabling because formatting callback isn't providing access to value to format - chart.js bug?
        //             title: {text: 'time (s)', display: true},
        //         }, 
        //         y: {
        //             display: true,
        //             title: {text: 'pitch (Hz)', display: true},
        //         }

        //     },
        //     animation: {
        //         duration: 175,
        //         delay: 0
        //     },
        //     plugins: {
        //         decimation: {
        //             enabled: true,
        //             algorithm: 'min-max',
        //             threshold: 1000,
        //          },
        //         legend: {
        //             display: false,
        //         },
        //         tooltip: {
        //             position: 'nearest',
        //             intersect: false,
        //             callbacks: {
        //                 label: function(context) {
        //                     let label = `${context.dataset.label}: ${context.parsed.y.toFixed(4)}Hz`;
        //                     return label;
        //                 },
        //                 title: function(items) {
        //                     return `${items[0].label.substring(0,5)}s (${items[0].dataIndex})`
        //                 }
        //             }                    
        //         },
        //     }
        // };

        // const chartData: ChartData<'line'> = {
        //     datasets : [{
        //         label: 'pitch',
        //         data: pitchPoints
        //     }]            
        // }

        // return <Line options={options} data={chartData} />;

        // Reduce number of points to graph for long audio files
        const tolerance: number = pitchPoints.length < 4000 ? 0 : pitchPoints.length/100000;
        const highQuality: boolean = true;
        const simplifiedPitchPoints = Simplify(pitchPoints, tolerance, highQuality);
        
          return <LineChart data={simplifiedPitchPoints}>
            <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} animationDuration={175} />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis
                dataKey="x"
                label={{ value: 'Time (s)', position: 'bottom', offset: -10 }}
                tickFormatter={(tick) => ((typeof tick === "number") ? tick.toFixed(2) : tick)}
                style={{ fontSize: "0.65em" }}
                />
            <YAxis
                style={{ fontSize: "0.65em" }}
                >
                <Label angle={270} position='left' offset={-10} style={{ textAnchor: 'middle' }}>
                    Pitch (Hz)
                </Label>
            </YAxis>
            <Tooltip />
        </LineChart>      

    }, [pitchPoints, trackLength]);

    return <>
        <Header title="Parseq - audio analyser ALPHA" />
        <Grid container paddingLeft={5} paddingRight={5} spacing={2}>
            <CssBaseline />
            <Grid xs={12} container>
            <Grid xs={12}>
                General settings
            </Grid>                
            <Grid xs={4}>
                <Box padding='5px' border={'1px solid gray'}>
                    File: <input type="file" ref={fileInput} onChange={loadFile} />
                </Box>
            </Grid>
            <Grid xs={4}>
                <TextField
                    size="small"
                    id="sampleRate"
                    label="Sample rate"
                    disabled={isAnalysing}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                    value={sampleRate}
                    onChange={(e) => setSampleRate(Number.parseInt(e.target.value))}
                />
            </Grid>            
            <Grid xs={4}>
                <TextField
                    size="small"
                    id="bufferSize"
                    label="Input Buffer Size"
                    disabled={isAnalysing}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                    value={bufferSize}
                    onChange={(e) => setBufferSize(Number.parseInt(e.target.value))}
                />
            </Grid>
            </Grid>
            <Grid xs={12} container>
                <Grid xs={4}>
                    Tempo (bpm) detection settings
                </Grid>
                <Grid xs={4}>
                    Onset (event) detection settings
                </Grid>
                <Grid xs={4}>
                    Pitch detection settings
                </Grid>
            </Grid>
            <Grid xs={12} container>
                <Grid xs={4}>
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="tempoBuffer"
                        label="Tempo Buffer"
                        disabled={isAnalysing}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={tempoBuffer}
                        onChange={(e) => setTempoBuffer(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="tempoHop"
                        label="Tempo Hop"
                        disabled={isAnalysing}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={tempoHop}
                        onChange={(e) => setTempoHop(Number.parseInt(e.target.value))}
                    />
                </Grid>
                <Grid xs={4}>
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="onsetBuffer"
                        label="Onset Buffer"
                        disabled={isAnalysing}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetBuffer}
                        onChange={(e) => setOnsetBuffer(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="onsetHop"
                        label="Onset Hop"
                        disabled={isAnalysing}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetHop}
                        onChange={(e) => setOnsetHop(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="onsetThreshold"
                        label="Onset Threshold"
                        disabled={isAnalysing}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetThreshold}
                        onChange={(e) => setOnsetThreshold(Number.parseFloat(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="onsetMinInterval"
                        label="Onset Min Interval"
                        //disabled={isPlaying}
                        disabled={true}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetMinoi}
                        onChange={(e) => setOnsetMinoi(Number.parseFloat(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="onsetWhitening"
                        label="Onset Whitening"
                        //disabled={isPlaying}
                        disabled={true}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetWhitening}
                        onChange={(e) => setOnsetWhitening(Boolean(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="onsetSilence"
                        label="Onset Silence"
                        disabled={isAnalysing}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetSilence}
                        onChange={(e) => setOnsetSilence(Number.parseInt(e.target.value))}
                    />  
                    <InputLabel id="onsetMethodLabel">Onset Method</InputLabel>
                    <Select
                        size="small"
                        labelId="onsetMethodLabel"
                        style={{ paddingBottom: '10px' }}
                        id="onsetMethod"
                        disabled={isAnalysing}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetMethod}
                        onChange={(e) => setOnsetMethod(e.target.value)}
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
                    </Select>                      
                </Grid>
                <Grid xs={4}>
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="pitchBuffer"
                        label="Pitch Buffer"
                        disabled={isAnalysing}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={pitchBuffer}
                        onChange={(e) => setPitchBuffer(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="pitchHop"
                        label="Pitch Hop"
                        disabled={isAnalysing}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={pitchHop}
                        onChange={(e) => setPitchHop(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        id="pitchTolerance"
                        label="Pitch Tolerance"
                        //disabled={isAnalysing}
                        disabled={true}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={pitchTolerance}
                        onChange={(e) => setPitchTolerance(Number.parseFloat(e.target.value))}
                    />                    
                    <InputLabel id="pitchMethodLabel">Pitch Method</InputLabel>
                    <Select
                        size="small"
                        labelId="pitchMethodLabel"
                        style={{ paddingBottom: '10px' }}
                        id="pitchMethod"
                        disabled={isAnalysing}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={pitchMethod}
                        onChange={(e) => setPitchMethod(e.target.value as PitchMethod)}
                    >
                        <MenuItem value={"default"}>default</MenuItem>
                        <MenuItem value={"schmitt"}>schmitt</MenuItem>
                        <MenuItem value={"fcomb"}>fcomb</MenuItem>
                        <MenuItem value={"mcomb"}>mcomb</MenuItem>
                        <MenuItem value={"specacf"}>specacf</MenuItem>
                        <MenuItem value={"yin"}>yin</MenuItem>
                        <MenuItem value={"yinfft"}>yinfft</MenuItem>
                    </Select>                    
                </Grid>
            </Grid>
            <Grid xs={12} container>
                <Grid xs={4}>
                    <TextField
                        id="tempoOutput"
                        label="Tempo"
                        InputProps={{
                            readOnly: true,
                            endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                            style: { fontFamily: 'Monospace', fontSize: '0.75em' }
                        }}
                        focused={true}
                        //value={tempoOutput?.toFixed(2)}
                        variant="outlined"
                        color="success"
                        //helperText={"Confidence: " + tempoOutputConfidence?.toFixed(2)}
                        helperText={" "}
                        inputRef={tempoRef}
                    />
                    { isAnalysing && <LinearWithValueLabel value={tempoProgress} /> }
                </Grid>
                <Grid xs={4}>
                    <TextField
                        id="onsetOutput"
                        label="Onset events"
                        InputProps={{
                            readOnly: true,
                            endAdornment: <InputAdornment position="end">s</InputAdornment>,
                            style: { fontFamily: 'Monospace', fontSize: '0.75em' }
                        }}
                        focused={true}
                        //value={onsetOutput?.toFixed(2)}
                        variant="outlined"
                        color="success"
                        helperText=" "
                        inputRef={onsetRef}
                    />
                    { isAnalysing && <LinearWithValueLabel value={onsetProgress} /> }
                </Grid>
                <Grid xs={4}>
                    <TextField
                        id="pitchOutput"
                        label="Pitch"
                        InputProps={{
                            readOnly: true,
                            endAdornment: <InputAdornment position="end">Hz</InputAdornment>,
                            style: { fontFamily: 'Monospace', fontSize: '0.75em' }

                        }}
                        focused={true}
                        //value={pitchOutput?.toFixed(2)}
                        variant="outlined"
                        color="success"
                        helperText=" "
                        inputRef={pitchRef}
                    />
                    { isAnalysing && <LinearWithValueLabel value={pitchProgress} /> }
                </Grid>
            </Grid>
            <Grid xs={12}>
                <Button variant="contained" onClick={startStopAnalysis}>{isAnalysing ? "⏹️ Stop analysis" : "💡 Analyse"} </Button>
                <span ref={analysisPos}></span>
            </Grid>
            <Grid xs={12}>
                {statusMessage}
            </Grid>
            <Grid xs={12}>
                <WaveSurfer
                    plugins={waveSurferPlugins}
                    onMount={handleWSMount as ((wavesurferRef: WaveSurfer | null) => any)}>
                    <WaveForm id="waveform" />
                    <div id="timeline" />
                </WaveSurfer>
            </Grid>    
            <Grid xs={12} container>    
                <Grid xs={4}>
                    <Button disabled={!wavesurferRef.current?.isReady} variant="contained"  onClick={(e) => {
                        setIsPlaying(true)
                        wavesurferRef.current?.play()
                    }}>
                        ▶️ Play
                    </Button>
                    <Button disabled={!wavesurferRef.current?.isReady} variant="contained"  onClick={(e) => {
                        setIsPlaying(false)
                        wavesurferRef.current?.pause()
                    }}>
                        ⏸️ Pause
                    </Button>
                </Grid>
                <Grid xs={4}>
                    <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
                        <FontAwesomeIcon icon={faSearchMinus} />
                            <Slider min={1} max={1000} aria-label="Zoom" value={waveSurferZoom} onChange={
                                (e : any) => {
                                    setWaveSurferZoom(e.target?.value);
                                    wavesurferRef.current?.zoom(e.target?.value);
                            }} />
                        <FontAwesomeIcon icon={faSearchPlus} />
                    </Stack>
                </Grid>                    
            </Grid>
            <Grid xs={12}>
                <ResponsiveContainer width={"100%"} aspect={8}>
                    {
                        pitchGraph
                    }
                </ResponsiveContainer>
            </Grid>
        </Grid>
    </>;

}