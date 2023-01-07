import { Alert, Box, Button, InputAdornment, InputLabel, MenuItem, Select, Slider, Stack, TextField, Typography } from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Unstable_Grid2';
import { PitchMethod } from "aubiojs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { WaveForm, WaveSurfer } from "wavesurfer-react";
import Header from './components/Header';
import LinearWithValueLabel from "./components/LinearProgressWithLabel";
//@ts-ignore
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min";
//@ts-ignore
import MarkersPlugin from "wavesurfer.js/src/plugin/markers";
//@ts-ignore
import SpectrogramPlugin from "wavesurfer.js/dist/plugin/wavesurfer.spectrogram.min";

import { faSearchMinus, faSearchPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import colormap from './data/hot-colormap.json';

import { CartesianGrid, Label, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Simplify } from 'simplify-ts';

import { deepCopy } from "@firebase/util";
import { CopyToClipboard } from 'react-copy-to-clipboard';
//@ts-ignore
import Stats from 'stats-analysis';

// TODO - HACK - this is duplicated from Deforum.tsx, need to refactor.
const interpolatable_fields = [
    'seed',
    'scale',
    'noise',
    'strength',
    'contrast',
    'prompt_weight_1',
    'prompt_weight_2',
    'prompt_weight_3',
    'prompt_weight_4',
    'prompt_weight_5',
    'prompt_weight_6',
    'prompt_weight_7',
    'prompt_weight_8',
    'angle',
    'zoom',
    'perspective_flip_theta',
    'perspective_flip_phi',
    'perspective_flip_gamma',
    'perspective_flip_fv',
    'translation_x',
    'translation_y',
    'translation_z',
    'rotation_3d_x',
    'rotation_3d_y',
    'rotation_3d_z',
    'fov',
    'near',
    'far',
];

function AnalyserInput(props: { label: string, value: number | string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean, isString?: boolean, helperText?: string }) {
    return <TextField
        type={props.isString ? "string" : "number"}
        size="small"
        style={{ paddingBottom: '10px' }}
        id={props.label.replace(" ", "_")}
        label={props.label}
        disabled={props.disabled}
        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
        InputLabelProps={{ shrink: true, }}
        helperText={props.helperText}
        value={props.value}
        onChange={props.onChange}
    />;
}

export default function Analyser() {

    const audioContext = new AudioContext();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchParams, setSearchParams] = useSearchParams();

    const fileInput = useRef<HTMLInputElement>("" as any);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(<></>);

    const [sampleRate, setSampleRate] = useState(44100);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
    const [analysisWorkers, setAnalysisWorkers] = useState<Worker[]>([]);

    const [tempoBuffer, setTempoBuffer] = useState(4096);
    const [tempoHop, setTempoHop] = useState(256);
    const tempoRef = useRef<HTMLInputElement>(null);
    const [tempoProgress, setTempoProgress] = useState(0);
    const [tempoOutputConfidence, setTempoOutputConfidence] = useState(0);

    const [onsetMethod, setOnsetMethod] = useState("default");
    const [onsetBuffer, setOnsetBuffer] = useState(4096);
    const [onsetThreshold, setOnsetThreshold] = useState(0.3);
    const [onsetHop, setOnsetHop] = useState(256);
    const [onsetWhitening, setOnsetWhitening] = useState(0);
    const [onsetMinoi, setOnsetMinoi] = useState(0.02);
    const [onsetSilence, setOnsetSilence] = useState(-90);
    const onsetRef = useRef<HTMLInputElement>(null);
    const [onsetProgress, setOnsetProgress] = useState(0);

    const [pitchMethod, setPitchMethod] = useState("default" as PitchMethod);
    const [pitchBuffer, setPitchBuffer] = useState(4096);
    const [pitchHop, setPitchHop] = useState(256);
    const [pitchTolerance, setPitchTolerance] = useState(0.7);
    const [pitchPoints, setPitchPoints] = useState<{ x: number, y: number }[]>([{ x: 0, y: 0 }]);
    const pitchRef = useRef<HTMLInputElement>(null);
    const [pitchProgress, setPitchProgress] = useState(0);

    const [trackLength, setTrackLength] = useState(0);
    const analysisPos = useRef<HTMLSpanElement>(null);

    const wavesurferRef = useRef<WaveSurfer>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [waveSurferZoom, setWaveSurferZoom] = useState(50);

    const [keyframes, setKeyframes] = useState<object>({});
    const [keyframesString, setKeyframesString] = useState<string>("");
    const [fps, setFps] = useState<number>(parseInt(searchParams.get('fps') || "20"));
    const [detectedBPMOverride, setDetectedBPMOverride] = useState<number>(0);
    const [firstBeatOffset, setFirstBeatOffset] = useState<number>(0);
    const [beatSkip, setBeatSkip] = useState<number>(1);
    const [beatTarget, setBeatTarget] = useState<string>("noise");
    const [beatTargetValue, setBeatTargetValue] = useState<number>(0);
    const [beatTargetInterpolation, setBeatTargetInterpolation] = useState<string>("C");

    const [onsetSkip, setOnsetSkip] = useState<number>(1);
    const [onsetTarget, setOnsetTarget] = useState<string>("zoom");
    const [onsetTargetValue, setOnsetTargetValue] = useState<number>(0);
    const [onsetTargetInterpolation, setOnsetTargetInterpolation] = useState<string>("C");

    const [pitchNormMin, setPitchNormMin] = useState<number>(0);
    const [pitchNormMax, setPitchNormMax] = useState<number>(1);
    const [pitchOutlierThreshold, setPitchOutlierThreshold] = useState<number>(3);
    const [pitchTarget, setPitchTarget] = useState<string>("strength");
    const [pitchTargetInterpolation, setPitchTargetInterpolation] = useState<string>("C");

    const [adjustedPitchPoints, setNormalisedPitchPoints] = useState<{ x: number, y: number }[]>([{ x: 0, y: 0 }]);

    const waveSurferPlugins = [
        {
            plugin: TimelinePlugin,
            options: {
                container: "#timeline"
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
            wavesurferRef.current.zoom(waveSurferZoom);
        }
    }, [waveSurferZoom]);

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
        } catch (e: any) {
            setStatusMessage(<Alert severity="error">Error loading file: {e.message}</Alert>)
            console.error(e);
        }
    }

    useEffect(() => {
        if (!trackLength) {
            return;
        }
        const analysisPositionS = (tempoProgress + onsetProgress + pitchProgress) / 300 * trackLength;
        if (analysisPos.current) {
            analysisPos.current.innerHTML = ` ( ${analysisPositionS.toFixed(2)}s / ${trackLength.toFixed(2)}s )`;
        }

        wavesurferRef.current?.seekTo(analysisPositionS / trackLength);

        if (tempoProgress >= 100 && onsetProgress >= 100 && pitchProgress >= 100) {
            // Analysis complete.
            setIsAnalysing(false);
            setStatusMessage(<Alert severity="success">Analysis complete.</Alert>);
            wavesurferRef.current?.seekTo(0);

            // TODO - not sure if this is necessary?
            analysisWorkers.forEach(worker => worker.terminate());
        }

    }, [tempoProgress, onsetProgress, pitchProgress, analysisWorkers, trackLength]);

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
        setTempoOutputConfidence(0);
        tempoRef.current.value = "";
        setOnsetProgress(0);
        onsetRef.current.value = "";
        setPitchProgress(0);
        pitchRef.current.value = "";
        setStatusMessage(<Alert severity="success">Analysing...</Alert>);
        setPitchPoints([{ x: 0, y: 0 }]);
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

        tempoDetectionWorker.onmessage = (e: any) => {
            if (tempoRef.current && e.data.bpm) {
                tempoRef.current.value = e.data.fudgedBpm.toFixed(2);
                setTempoOutputConfidence(e.data.confidence);
            }

            setTempoProgress(e.data.progress * 100);
            if (e.data.progress >= 1) {
                console.log("Tempo analysis complete");

                if (tempoRef.current && wavesurferRef.current) {
                    const secondsPerBeat = 60 / parseFloat(tempoRef.current.value);
                    for (let pos = 0; pos < trackLength; pos += secondsPerBeat) {
                        const newMarker = {
                            time: pos,
                            color: "blue",
                            position: "bottom" as "bottom",
                            draggable: false,
                            label: "beat " + (pos / secondsPerBeat).toFixed(0),
                            meta: "beat"
                        }
                        wavesurferRef.current.markers.add(newMarker);
                    }

                    setDetectedBPMOverride(Math.round(parseFloat(tempoRef.current.value)));
                }
            }
        };
        tempoDetectionWorker.onerror = (e: any) => {
            setStatusMessage(<Alert severity="error">Error analysing tempo: {e.message}</Alert>);
            setTempoProgress(100);
            tempoDetectionWorker.terminate();
        }
        let onsetCount = 0;
        onsetDetectionWorker.onmessage = (e: any) => {
            if (onsetRef.current && wavesurferRef.current && e.data.eventS) {
                onsetRef.current.value = e.data.eventS.toFixed(4);

                const newMarker = {
                    time: e.data.eventS,
                    color: "red",
                    position: "top" as "top",
                    draggable: true,
                    label: "onset " + (onsetCount++),
                    meta: "onset"
                }
                wavesurferRef.current.markers.add(newMarker);
            }

            setOnsetProgress(e.data.progress * 100);
            if (e.data.progress >= 1) {
                console.log("Onset analysis complete");
            }

        };
        onsetDetectionWorker.onerror = (e: any) => {
            setStatusMessage(<Alert severity="error">Error analysing onset: {e.message}</Alert>);
            setOnsetProgress(100);
            onsetDetectionWorker.terminate();
        }

        const pitchPointsAccumulator: { x: number, y: number }[] = [];
        pitchDetectionWorker.onmessage = (e: any) => {
            if (pitchRef.current && e.data.pitchHz) {
                pitchRef.current.value = e.data.pitchHz.toFixed(2);
            }
            const posInSeconds = e.data.progress * trackLength;

            pitchPointsAccumulator.push({
                x: posInSeconds,
                y: e.data.pitchHz,
            })

            setPitchProgress(e.data.progress * 100);
            if (e.data.progress >= 1) {
                console.log("Pitch analysis complete");
                setPitchPoints(pitchPointsAccumulator);
            }
        };
        pitchDetectionWorker.onerror = (e: any) => {
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

    useEffect(() => {
        setKeyframesString(JSON.stringify(keyframes, null, 4));
    }, [keyframes])

    const pitchGraph = useMemo(() => {

        console.log("re-rendering pitch graph");

        // Reduce number of points to graph for long audio files
        const tolerance: number = pitchPoints.length < 4000 ? 0 : pitchPoints.length / 100000;
        const highQuality: boolean = true;
        const simplifiedPitchPoints = Simplify(pitchPoints, tolerance, highQuality);
        const simplifiedNormalisedPitchPoints = Simplify(adjustedPitchPoints, tolerance, highQuality);

        // Merge into a single array of points
        const pointMap = new Map();
        for (const p of simplifiedPitchPoints) {
            pointMap.set(p.x, { x: p.x, original: p.y });
        }
        for (const p of simplifiedNormalisedPitchPoints) {
            const existing = pointMap.get(p.x);
            pointMap.set(p.x, {
                ...existing || {},
                x: p.x,
                normalised: p.y
            });
        }

        console.log(pointMap);

        // TODO need to merge these properly.
        const dataToRender = Array.from(pointMap.values())
            .sort((a, b) => (a.x - b.x));

        return <LineChart data={dataToRender}>
            <Line connectNulls={true} yAxisId="left" type="monotone" dataKey="original" stroke="#8884d8" dot={false} animationDuration={175} />
            <Line connectNulls={true} yAxisId="right" type="monotone" dataKey="normalised" stroke="#662255" dot={false} animationDuration={175} />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis
                dataKey="x"
                label={{ value: 'Time (s)', position: 'bottom', offset: -10 }}
                tickFormatter={(tick) => ((typeof tick === "number") ? tick.toFixed(2) : tick)}
                style={{ fontSize: "0.65em" }}
            />
            <YAxis
                yAxisId="left"
                style={{ fontSize: "0.65em" }}
            >
                <Label angle={270} position='left' offset={-10} style={{ textAnchor: 'middle' }}>
                    Pitch (Hz)
                </Label>
            </YAxis>
            <YAxis
                yAxisId="right"
                orientation="right"
                style={{ fontSize: "0.65em" }}
            >
                <Label angle={270} position='right' offset={10} style={{ textAnchor: 'middle' }}>
                    Normalised value
                </Label>
            </YAxis>
            <Tooltip />
        </LineChart>

    }, [adjustedPitchPoints, pitchPoints]);


    const generateKeyframes = useCallback(() => {
        if (!tempoRef.current || !wavesurferRef.current) {
            return;
        }

        const bpm = detectedBPMOverride || parseInt(tempoRef.current.value);


        // Normalise pitch points
        const pitchValues = pitchPoints.map((p) => p.y).filter((p) => typeof p === "number" && !isNaN(p));
        const minPitch = Math.min(...pitchValues);
        const maxPitch = Math.max(...pitchValues);
        const outliers = pitchOutlierThreshold >= 0 ? Stats.indexOfOutliers(pitchValues, Stats.outlierMethod.medianDiff, pitchOutlierThreshold) : [];

        const normalisedPitchPoints = pitchPoints
            .filter((p, index) => !outliers.includes(index))
            .map((p) => ({
                x: p.x,
                y: ((p.y - minPitch) / (maxPitch - minPitch)) * (pitchNormMax - pitchNormMin) + pitchNormMin
            }));

        console.log("length comp", pitchValues.length, pitchPoints.length, normalisedPitchPoints.length);

        setNormalisedPitchPoints(normalisedPitchPoints);

        // We want to remove beat markers only. The API doesn't allow us to do that cleanly
        // (we must remove by index but indices change on removal so iterating and removing is tricky)
        // so we take a copy, wipe the markers, and re-add the ones we want to keep.
        const oldMarkers = deepCopy(wavesurferRef.current.markers.markers);
        wavesurferRef.current.markers.clear();

        // Insert corrected beat markers based on overrides
        const secondsPerBeat = 60 / bpm;
        for (let pos = firstBeatOffset; pos < trackLength; pos += secondsPerBeat) {
            const newMarker = {
                time: pos,
                color: "lightblue",
                position: "bottom" as "bottom",
                draggable: false,
                label: "beat " + (pos / secondsPerBeat).toFixed(0),
                meta: "beat"
            }
            wavesurferRef.current.markers.add(newMarker);

        }

        // Re-insert onset markers
        console.log("oldMarkers", oldMarkers);
        oldMarkers
            .filter((marker) => marker.label?.startsWith("onset"))
            .forEach((marker) => {
                wavesurferRef?.current?.markers.add(marker);
            });

        const beatKeyframes = wavesurferRef.current.markers.markers
            .filter((marker) => marker.label?.startsWith("beat"))
            .filter((marker, index) => index % beatSkip === 0)
            .map((marker, index) => {
                return {
                    frame: Math.round(marker.time * fps),
                    info: marker.label,
                    // TODO: this lookup is sketchy, should take weighted avg between 2 closest points.
                    [pitchTarget]: normalisedPitchPoints.find((point) => point.x >= marker.time)?.y,
                    [beatTarget]: beatTargetValue,
                    [beatTarget + "_i"]: beatTargetInterpolation
                }
            });

        const onsetKeyframes = wavesurferRef.current.markers.markers
            .filter((marker) => marker.label?.startsWith("onset"))
            .filter((marker, index) => index % onsetSkip === 0)
            .map((marker, index) => {
                return {
                    frame: Math.round(marker.time * fps),
                    info: marker.label,
                    // TODO: this lookup is sketchy, should take weighted avg between 2 closest points.
                    [pitchTarget]: normalisedPitchPoints.find((point) => point.x >= marker.time)?.y,
                    [onsetTarget]: onsetTargetValue,
                    [onsetTarget + "_i"]: onsetTargetInterpolation
                }
            })

        // Combine onset and beat keyframes but merge frames with same frame number.
        // TODO: replace this with more generic merging function that supports 2> sources. Also, this duplicates merge logic in the main UI component.
        const newKeyframes = beatKeyframes.map((beatKeyFrame) => {
            let onsetKeyFrame = onsetKeyframes.find((candidateKeyFrame) => candidateKeyFrame.frame === beatKeyFrame.frame)
            if (onsetKeyFrame) {
                return {
                    ...onsetKeyFrame,
                    ...beatKeyFrame,
                    info: beatKeyFrame.info + " / " + onsetKeyFrame.info
                }
            } else {
                return beatKeyFrame;
            }
        }).concat(onsetKeyframes.filter((onsetKeyFrame) => !beatKeyframes.find((beatKeyFrame) => beatKeyFrame.frame === onsetKeyFrame.frame)))
            .sort((a, b) => a.frame - b.frame);

        setKeyframes({
            keyframes: newKeyframes
        })

    }, [fps, detectedBPMOverride, firstBeatOffset, beatSkip, onsetSkip, pitchTarget,
        pitchPoints, pitchNormMax, pitchNormMin, pitchOutlierThreshold, beatTarget,
        onsetTarget, onsetTargetInterpolation, onsetTargetValue, beatTargetInterpolation, beatTargetValue,
        trackLength]);

    return <>
        <Header title="Parseq - audio analyser ALPHA" />
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
            <Grid xs={12}>
                <a href={'/' + (searchParams.get('refDocId') ? '?docId=' + searchParams.get('refDocId') : '')}>⬅️ Home</a>
                <small>
                    <ul>
                        <li>⚠️ This feature is experimental. That's why it's quite separate from the main Parseq UI for now. The keyframes generated here can be merged into an existing Parseq document using the "Merge keyframes" button in the main UI.</li>
                        <li>Tempo, onset event and pitch detection use <a href="https://aubio.org/">Aubio</a>, via <a href="https://github.com/qiuxiang/aubiojs">AubioJS</a>. See the <a href="https://aubio.org/manual/latest/cli.html"> Aubio CLI documentation</a> for the meaning of all parameters.</li>
                        <li>Not all parameters are exposed by AubioJS. Some look like they should be, but aren't (those are grayed out here).</li>
                        <li>All processing runs in the browser, using web workers. This seems to be faster in Chrome and Safari compared to Firefox. You can speed things up by increasing the hop sizes to larger multiples of 2 (trading off accuracy).</li>
                        <li>Expects a constant Tempo. Tempo detection is not perfect, so you can override it before generating keyframes. If the first beat is not at the very beginning of the track, you will need to enter a manual offset for now. </li>
                        <li>Pitch detection is sketchy with beats in the mix. You may want to run this multiple times on different audio layers and do multiple merges.</li>
                        <li>The frame-per-second (FPS) specified here must match the parseq doc you're merging with or you'll be out-of-sync.</li>
                    </ul>
                </small>
            </Grid>
            <Grid xs={12} bgcolor="lightgray">
                <h3>Audio analysis</h3>
            </Grid>
            <Grid xs={4}>
                <Box padding='5px' border={'2px solid LightBlue'}>
                    <strong>File:</strong> <input type="file" ref={fileInput} onChange={loadFile} />
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
            <Grid xs={4}></Grid>
            <Grid xs={4}>
                Tempo (bpm) detection settings
            </Grid>
            <Grid xs={4}>
                Onset (event) detection settings
            </Grid>
            <Grid xs={4}>
                Pitch detection settings
            </Grid>
            <Grid xs={4}>
                <AnalyserInput
                    label="Tempo Buffer"
                    value={tempoBuffer}
                    onChange={(e) => setTempoBuffer(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <AnalyserInput
                    label="Tempo Hop"
                    value={tempoHop}
                    onChange={(e) => setTempoHop(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
            </Grid>
            <Grid xs={4}>
                <AnalyserInput
                    label="Onset Buffer"
                    value={onsetBuffer}
                    onChange={(e) => setOnsetBuffer(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <AnalyserInput
                    label="Onset Hop"
                    value={onsetHop}
                    onChange={(e) => setOnsetHop(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <AnalyserInput
                    label="Onset Threshold"
                    value={onsetThreshold}
                    onChange={(e) => setOnsetThreshold(Number.parseFloat(e.target.value))}
                    disabled={isAnalysing}
                />
                <AnalyserInput
                    label="Onset Min Interval"
                    value={onsetMinoi}
                    onChange={(e) => setOnsetMinoi(Number.parseFloat(e.target.value))}
                    disabled={true}
                />
                <AnalyserInput
                    label="Onset Whitening"
                    value={onsetWhitening}
                    onChange={(e) => setOnsetWhitening(Number.parseInt(e.target.value))}
                    disabled={true}
                />
                <AnalyserInput
                    label="Onset Silence"
                    value={onsetSilence}
                    onChange={(e) => setOnsetSilence(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <InputLabel style={{ fontSize: '0.75em' }} id="onsetMethodLabel">Onset Method</InputLabel>
                <Select
                    size="small"
                    labelId="onsetMethodLabel"
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
                <AnalyserInput
                    label="Pitch Buffer"
                    value={pitchBuffer}
                    onChange={(e) => setPitchBuffer(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <AnalyserInput
                    label="Pitch Hop"
                    value={pitchHop}
                    onChange={(e) => setPitchHop(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <AnalyserInput
                    label="Pitch Tolerance"
                    value={pitchTolerance}
                    onChange={(e) => setPitchTolerance(Number.parseFloat(e.target.value))}
                    disabled={true}
                />
                <InputLabel style={{ fontSize: '0.75em' }} id="pitchMethodLabel">Pitch Method</InputLabel>
                <Select
                    size="small"
                    labelId="pitchMethodLabel"
                    id="pitchMethod"
                    disabled={isAnalysing}
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
            <Grid xs={4}>
                <TextField
                    id="tempoOutput"
                    label="Tempo"
                    InputProps={{
                        readOnly: true,
                        endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                        style: { fontFamily: 'Monospace', fontSize: '0.75em' }
                    }}
                    InputLabelProps={{ shrink: true }}
                    focused={true}
                    variant="outlined"
                    color="success"
                    helperText={"Confidence: " + tempoOutputConfidence?.toFixed(2)}
                    inputRef={tempoRef}
                />
                {isAnalysing && <LinearWithValueLabel value={tempoProgress} />}
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
                    InputLabelProps={{ shrink: true }}
                    focused={true}
                    variant="outlined"
                    color="success"
                    helperText={"Event count: " + wavesurferRef.current?.markers.markers.filter(m => m?.label?.startsWith("onset")).length}
                    inputRef={onsetRef}
                />
                {isAnalysing && <LinearWithValueLabel value={onsetProgress} />}
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
                    InputLabelProps={{ shrink: true }}
                    //value={pitchOutput?.toFixed(2)}
                    variant="outlined"
                    color="success"
                    helperText={"Pitch points: " + pitchPoints.length + " (minus outliers: " + adjustedPitchPoints.length + ")"}
                    inputRef={pitchRef}
                />
                {isAnalysing && <LinearWithValueLabel value={pitchProgress} />}
            </Grid>
            <Grid xs={4}>
                <Button variant="contained" onClick={startStopAnalysis}>{isAnalysing ? "⏹️ Stop analysis" : "💡 Analyse"} </Button>
                <span ref={analysisPos}></span>
            </Grid>
            <Grid xs={8}>
                {statusMessage}
            </Grid>
            <Grid xs={12} bgcolor="lightgray">
                <h3>Visualisation & playback</h3>
            </Grid>
            <Grid xs={12}>
                <WaveSurfer
                    plugins={waveSurferPlugins}
                    onMount={handleWSMount as ((wavesurferRef: WaveSurfer | null) => any)}>
                    <WaveForm id="waveform" />
                    <div id="spectrogram" />
                    <div id="timeline" />
                </WaveSurfer>
            </Grid>
            <Grid xs={12}>
                <ResponsiveContainer width={"100%"} aspect={8}>
                    {
                        pitchGraph
                    }
                </ResponsiveContainer>
            </Grid>
            <Grid xs={4}>
                <Button disabled={!wavesurferRef.current?.isReady || isPlaying} variant="contained" onClick={(e) => {
                    setIsPlaying(true)
                    wavesurferRef.current?.play()
                }}>
                    ▶️ Play
                </Button>
                <Button disabled={!wavesurferRef.current?.isReady || !isPlaying} variant="contained" onClick={(e) => {
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
                        (e: any) => {
                            setWaveSurferZoom(e.target?.value);
                            wavesurferRef.current?.zoom(e.target?.value);
                        }} />
                    <FontAwesomeIcon icon={faSearchPlus} />
                </Stack>
            </Grid>
            <Grid xs={4}>
                <small>
                    <div><Typography style={{ display: 'inline-block' }} color={"red"}>&diams;</Typography>: detected onset events</div>
                    <div><Typography style={{ display: 'inline-block' }} color={"blue"}>&diams;</Typography>: beats</div>
                    <div><Typography style={{ display: 'inline-block' }} color={"lightblue"}>&diams;</Typography>: ajusted beats</div>
                </small>
            </Grid>
            <Grid xs={12} bgcolor="lightgray">
                <h3>Conversion to Parseq keyframes</h3>
            </Grid>
            <Grid xs={4}>
                Tempo (bpm) conversion settings
            </Grid>
            <Grid xs={4}>
                Onset (event) conversion settings
            </Grid>
            <Grid xs={4}>
                Pitch conversion settings
            </Grid>
            <Grid xs={4}>
                <AnalyserInput
                    label="Include every Nth beat"
                    value={beatSkip}
                    onChange={(e) => setBeatSkip(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />                
                <AnalyserInput
                    label="BPM override"
                    value={detectedBPMOverride}
                    onChange={(e) => setDetectedBPMOverride(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <AnalyserInput
                    label="First beat offset (s)"
                    value={firstBeatOffset}
                    onChange={(e) => setFirstBeatOffset(Number.parseFloat(e.target.value))}
                    disabled={isAnalysing}
                />
                <InputLabel style={{ fontSize: '0.75em', paddingBottom: '5px' }} id="beatTargetLabel">Set value on beat keyframes:</InputLabel>
                <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                    <Select
                        size="small"
                        labelId="beatTargetLabel"
                        id="beatTarget"
                        disabled={isAnalysing}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}

                        value={beatTarget}
                        onChange={(e) => setBeatTarget(e.target.value)}
                    >
                        {interpolatable_fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                    </Select>
                    <AnalyserInput
                        label="Value"
                        value={beatTargetValue}
                        onChange={(e) => setBeatTargetValue(Number.parseFloat(e.target.value))}
                        disabled={isAnalysing}
                    />
                    <AnalyserInput
                        label="Interpolation"
                        isString={true}
                        value={beatTargetInterpolation}
                        onChange={(e) => setBeatTargetInterpolation(e.target.value)}
                        disabled={isAnalysing}
                    />
                </Box>
            </Grid>
            <Grid xs={4}>
                <AnalyserInput
                    label="Include every Nth event"
                    value={onsetSkip}
                    onChange={(e) => setOnsetSkip(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
                <InputLabel style={{ fontSize: '0.75em', paddingBottom: '5px' }} id="onsetTargetLabel">Set value on onset keyframes:</InputLabel>
                <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                    <Select
                        size="small"
                        labelId="beatTargetLabel"
                        id="beatTarget"
                        disabled={isAnalysing}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetTarget}
                        onChange={(e) => setOnsetTarget(e.target.value)}
                    >
                        {interpolatable_fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                    </Select>
                    <AnalyserInput
                        label="Value"
                        value={onsetTargetValue}
                        onChange={(e) => setOnsetTargetValue(Number.parseFloat(e.target.value))}
                        disabled={isAnalysing}
                    />
                    <AnalyserInput
                        label="Interpolation"
                        isString={true}
                        value={onsetTargetInterpolation}
                        onChange={(e) => setOnsetTargetInterpolation(e.target.value)}
                        disabled={isAnalysing}
                    />
                </Box>
            </Grid>
            <Grid xs={4}>
                <InputLabel style={{ fontSize: '0.75em', paddingBottom: '5px' }} id="Normalisation">Normalisation:</InputLabel>
                <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                    <AnalyserInput
                        label="min"
                        value={pitchNormMin}
                        onChange={(e) => setPitchNormMin(Number.parseFloat(e.target.value))}
                        disabled={isAnalysing}
                    />
                    <AnalyserInput
                        label="max"
                        value={pitchNormMax}
                        onChange={(e) => setPitchNormMax(Number.parseFloat(e.target.value))}
                        disabled={isAnalysing}
                    />
                </Box>
                <AnalyserInput
                    label="Outlier tolerance"
                    value={pitchOutlierThreshold}
                    onChange={(e) => setPitchOutlierThreshold(Number.parseFloat(e.target.value))}
                    disabled={isAnalysing}
                    helperText="Higher => accept more outliers; -1 to disable"
                />

                <InputLabel style={{ fontSize: '0.75em', paddingBottom: '5px' }} id="pitchTargetLabel">Assign pitch value to:</InputLabel>
                <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                    <Select
                        size="small"
                        labelId="pitchTargetLabel"
                        id="pitchTarget"
                        disabled={isAnalysing}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em', } }}
                        value={pitchTarget}
                        onChange={(e) => setPitchTarget(e.target.value)}
                    >
                        {interpolatable_fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                    </Select>
                    <AnalyserInput
                        label="Interpolation"
                        isString={true}
                        value={pitchTargetInterpolation}
                        onChange={(e) => setPitchTargetInterpolation(e.target.value)}
                        disabled={isAnalysing}
                    />
                </Box>
            </Grid>
            <Grid xs={4}>
                <Button variant="contained" disabled={!trackLength} onClick={generateKeyframes}>✨ Generate keyframes</Button>
            </Grid>
            <Grid xs={4}>
                <AnalyserInput
                    label="FPS"
                    value={fps}
                    onChange={(e) => setFps(Number.parseInt(e.target.value))}
                    disabled={isAnalysing}
                />
            </Grid>
            <Grid xs={4}>
                <CopyToClipboard text={keyframesString}>
                    <Button variant="contained" disabled={!keyframes || !trackLength} style={{ marginLeft: '1em' }} >📋 Copy keyframes</Button>
                </CopyToClipboard>
            </Grid>
            <Grid xs={12}>
                <div
                    id="generated"
                    style={{ fontSize: '0.75em', backgroundColor: 'whitesmoke', height: Math.min(80,keyframesString.split(/\r\n|\r|\n/).length) + 'em', overflow: 'scroll' }}
                    onClick={(e) =>
                        //@ts-ignore
                        window.getSelection().selectAllChildren(document.getElementById('generated'))
                    }>
                    <pre>{keyframesString}</pre>
                </div>
            </Grid>
        </Grid>
    </>;

}