import {Alert, Button, TextField, Box, InputAdornment } from "@mui/material";
import aubio, { PitchMethod } from "aubiojs";
import React, { useRef, useState } from 'react';
import Header from './components/Header';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Unstable_Grid2';

export default function Analyser() {

    const audioContext = new AudioContext();

    const fileInput = useRef<HTMLInputElement>("" as any);
    const [isPlaying, setIsPlaying] = useState(false);
    const [statusMessage, setStatusMessage] = useState(<></>);

    const [bufferSize, setBufferSize] = useState(512);

    const [tempoBuffer, setTempoBuffer] = useState(bufferSize * 8);
    const [tempoHop, setTempoHop] = useState(bufferSize);
    const [tempoOutput, setTempoOutput] = useState<number>();
    const [tempoOutputConfidence, setTempoOutputConfidence] = useState<number>();

    const [onsetMethod, setOnsetMethod] = useState("default");
    const [onsetBuffer, setOnsetBuffer] = useState(bufferSize * 8);
    const [onsetThreshold, setOnsetThreshold] = useState(0.3);

    const [onsetHop, setOnsetHop] = useState(bufferSize);
    const [onsetOutput, setOnsetOutput] = useState<number>();

    const [pitchMethod, setPitchMethod] = useState("default" as PitchMethod);
    const [pitchBuffer, setPitchBuffer] = useState(bufferSize * 8);
    const [pitchHop, setPitchHop] = useState(bufferSize);
    const [pitchOutput, setPitchOutput] = useState<number>();
    const pitchRef = useRef<HTMLDivElement>();

    //const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
    const [scriptProcessor, setScriptProcessor] = useState<ScriptProcessorNode>();
    const [source, setSource] = useState<AudioBufferSourceNode>();


    const startStop = async (event: any) => {

        if (isPlaying && source) {
            source.stop(0);
            source.disconnect();
            scriptProcessor?.disconnect();
            audioContext.destination.disconnect();
            setIsPlaying(false);
            setStatusMessage(<></>);
            return;
        }

        aubio().then(async (aubio) => {

            // // How to start AudioWorklets, for future reference:
            // await audioContext.audioWorklet.addModule('/worklet/noise-generator.js');
            // console.log('AudioWorklet module loaded');
            // const modulator = new OscillatorNode(actx);
            // const modGain = new GainNode(actx);
            // const noiseGeneratorNode = new AudioWorkletNode(actx, 'noise-generator');
            // const paramAmp = noiseGeneratorNode.parameters.get('amplitude');
            // noiseGeneratorNode.connect(actx.destination);
            // //@ts-ignore - trusting that the parm exists...
            // modulator.connect(modGain).connect(paramAmp);
            // modulator.frequency.value = 0.5;
            // modGain.gain.value = 0.75;
            // modulator.start();
            // const node = noiseGenerator(audioContext);
            // noiseGeneratorNode.port.postMessage(true);

            // TODO: Given AudioWorklets are loaded dynamically client side as static js assets, I suspect some
            // webpack wrangling will be required to get them working with Aubio. I'll look into this later.
            // For now I'll use the deprecated approach, for which the downside is (I think) latency issues
            // (which probably isn't such a big deal for this use case).
            const selectedFiles = fileInput.current.files;
            if (!selectedFiles || selectedFiles.length < 1) {
                console.log("Please select a file.")
                setStatusMessage(<Alert severity="error">Select an audio file above.</Alert>);
                return;
            }

            const selectedFile = selectedFiles[0];
            const arrayBuffer = await selectedFile.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);
            scriptProcessor.connect(audioContext.destination);
            //@ts-ignore - possible error in the Aubio type defs?
            const onset = new aubio.Onset(onsetMethod, onsetBuffer, onsetHop, audioContext.sampleRate);
            const tempo = new aubio.Tempo(tempoBuffer, tempoHop, audioContext.sampleRate);
            const pitch = new aubio.Pitch(pitchMethod, scriptProcessor.bufferSize * 8, scriptProcessor.bufferSize, audioContext.sampleRate);

            onset.setThreshold(onsetThreshold);

            scriptProcessor.addEventListener("audioprocess", function (event) {
                if (tempo.do(event.inputBuffer.getChannelData(0))) {
                    const bpm = tempo.getBpm()
                    const confidence = tempo.getConfidence();
                    console.log("bpm", bpm);
                    console.log("confidence", confidence);
                    setTempoOutput(bpm);
                    setTempoOutputConfidence(confidence);
                }
            });
            scriptProcessor.addEventListener("audioprocess", function (event) {
                if (onset.do(event.inputBuffer.getChannelData(0))) {
                    const lastOnset = onset.getLastMs();
                    console.log("onset", lastOnset);
                    setOnsetOutput(lastOnset);
                }
            });
            scriptProcessor.addEventListener("audioprocess", function (event) {
                const pitchResult = pitch.do(event.inputBuffer.getChannelData(0));
                console.log("pitch", pitchResult);
                //setPitchOutput(pitchResult);
                if (pitchRef.current)
                    pitchRef.current.nodeValue = pitchResult.toString();
            });

            setScriptProcessor(scriptProcessor);

            const source = audioContext.createBufferSource();
            setSource(source);
            source.buffer = audioBuffer;
            source.connect(scriptProcessor);
            source.connect(audioContext.destination);
            source.start();
            setIsPlaying(true);
            setStatusMessage(<Alert severity="success">Playing & analysing...</Alert>);

        });


    }

    return <>
        <Header title="Parseq - audio analyser ALPHA" />
        <Grid container paddingLeft={5} paddingRight={5} spacing={2}>
            <CssBaseline />
            <Grid xs={12}>
                <Box padding='5px' border={'1px solid gray'}>
                    Select file: <input type="file" ref={fileInput} />
                </Box>
            </Grid>
            <Grid xs={12} container>
                <Grid xs={4}>
                </Grid>
                <Grid xs={4}>
                    <TextField
                        id="bufferSize"
                        label="Input Buffer Size"
                        disabled={isPlaying}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={bufferSize}
                        onChange={(e) => setBufferSize(Number.parseInt(e.target.value))}
                    />
                </Grid>
                <Grid xs={4}>
                </Grid>
            </Grid>
            <Grid xs={12} container>
                <Grid xs={4}>
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="tempoBuffer"
                        label="Tempo Buffer"
                        disabled={isPlaying}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={tempoBuffer}
                        onChange={(e) => setTempoBuffer(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="tempoHop"
                        label="Tempo Hop"
                        disabled={isPlaying}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={tempoHop}
                        onChange={(e) => setTempoHop(Number.parseInt(e.target.value))}
                    />
                </Grid>
                <Grid xs={4}>
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="onsetBuffer"
                        label="Onset Buffer"
                        disabled={isPlaying}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetBuffer}
                        onChange={(e) => setOnsetBuffer(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="onsetHop"
                        label="Onset Hop"
                        disabled={isPlaying}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetHop}
                        onChange={(e) => setOnsetHop(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="onsetThreshold"
                        label="Onset Threshold"
                        disabled={isPlaying}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetThreshold}
                        onChange={(e) => setOnsetThreshold(Number.parseFloat(e.target.value))}
                    />                    
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="onsetMethod"
                        label="Onset Method"
                        disabled={isPlaying}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={onsetMethod}
                        onChange={(e) => setOnsetMethod(e.target.value)}
                    />
                </Grid>
                <Grid xs={4}>
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="pitchBuffer"
                        label="Pitch Buffer"
                        disabled={isPlaying}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={pitchBuffer}
                        onChange={(e) => setPitchBuffer(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="pitchHop"
                        label="Pitch Hop"
                        disabled={isPlaying}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={pitchHop}
                        onChange={(e) => setPitchHop(Number.parseInt(e.target.value))}
                    />
                    <TextField
                        style={{ paddingBottom: '10px' }}
                        id="pitchMethod"
                        label="Pitch Method"
                        disabled={isPlaying}
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={pitchMethod}
                        onChange={(e) => setPitchMethod(e.target.value as PitchMethod)}
                    />
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
                        value={tempoOutput?.toFixed(2)}
                        variant="outlined"
                        color="success"
                        helperText={"Confidence: " + tempoOutputConfidence?.toFixed(2)}
                    />
                </Grid>
                <Grid xs={4}>
                    <TextField
                        id="onsetOutput"
                        label="Onset events"
                        InputProps={{
                            readOnly: true,
                            endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                            style: { fontFamily: 'Monospace', fontSize: '0.75em' }
                        }}
                        focused={true}
                        value={onsetOutput?.toFixed(2)}
                        variant="outlined"
                        color="success"
                        helperText=" "
                    />
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
                        value={pitchOutput?.toFixed(2)}
                        variant="outlined"
                        color="success"
                        helperText=" "
                        ref={pitchRef}
                        
                    />
                </Grid>
            </Grid>
            <Grid xs={12}>
                <Button  variant="contained" onClick={startStop}>{isPlaying?"⏹️ Stop":"▶️ Play"} </Button>
            </Grid>
            <Grid xs={12}>
                {statusMessage}
            </Grid>
        </Grid>
    </>;

}