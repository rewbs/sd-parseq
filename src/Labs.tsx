import { Box, MenuItem, TextField } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { SmallTextField } from "./components/SmallTextField";
import { BiquadFilter } from "./components/BiquadFilter";
import { getWavBytes } from "./utils/utils";
import { saveAs } from 'file-saver';

// WaveSurfer hook
const useWavesurfer = (containerRef: MutableRefObject<HTMLDivElement | undefined>, options: any) => {
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)

    // Initialize wavesurfer when the container mounts
    // or any of the props change
    useEffect(() => {
        if (!containerRef.current) return

        console.log("---> Creating wavesurfer")
        const ws = WaveSurfer.create({
            ...options,
            container: containerRef.current,
        })

        setWavesurfer(ws)

        return () => {
            console.log("<--- Destroying wavesurfer")
            ws.destroy()
        }
    }, [options, containerRef])

    return wavesurfer
}

type WaveSurferPlayerProps = {
    audioFile: Blob | undefined;
}

// Create a React component that will render wavesurfer.
// Props are wavesurfer options.

const staticOptions = {}

const WaveSurferPlayer = ({ audioFile }: WaveSurferPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>()
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const wavesurfer = useWavesurfer(containerRef, staticOptions)

    // On play button click
    const onPlayClick = useCallback(() => {
        wavesurfer?.isPlaying() ? wavesurfer?.pause() : wavesurfer?.play()
    }, [wavesurfer])

    // Initialize wavesurfer when the container mounts
    // or any of the props change
    useEffect(() => {
        if (!wavesurfer) return

        setCurrentTime(0)
        setIsPlaying(false)

        const subscriptions = [
            wavesurfer.on('play', () => setIsPlaying(true)),
            wavesurfer.on('pause', () => setIsPlaying(false)),
            wavesurfer.on('timeupdate', (currentTime) => setCurrentTime(currentTime)),

            wavesurfer.on('load', () => console.log('load event')),
            wavesurfer.on('decode', () => console.log('decode event')),
            wavesurfer.on('ready', () => console.log('ready event')),

        ]

        if (audioFile) {
            try {
                wavesurfer.loadBlob(audioFile);
                wavesurfer.loadBlob(audioFile);
            } catch (e: any) {
                console.error(`Failed to load '${audioFile}':`, e)
            }
        }

        return () => {
            subscriptions.forEach((unsub) => unsub())
        }
    }, [wavesurfer, audioFile])

    return (
        <>
            {/* @ts-ignore */}
            <div ref={containerRef} style={{ minHeight: '120px' }} />

            <button onClick={onPlayClick} style={{ marginTop: '1em' }}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>

            <p>Seconds played: {currentTime}</p>
        </>
    )
}

const Labs = () => {
    const [fps, setFps] = useState(30);
    const [bpm, setBpm] = useState(120);
    const [xaxisType, setXaxisType] = useState<"frames" | "seconds" | "beats">("frames");
    const [startFrame, setStartFrame] = useState(0);
    const [endFrame, setEndFrame] = useState(0);

    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | undefined>();
    const [audioFile, setAudioFile] = useState<Blob | undefined>();
    const fileInput = useRef<HTMLInputElement>("" as any);

    const loadFile = async (event: any) => {
        try {
            const selectedFiles = fileInput.current.files;
            if (!selectedFiles || selectedFiles.length < 1) {
                return;
            }
            // Prepare audio buffer for analysis.
            const selectedFile = selectedFiles[0];
            const arrayBuffer = await selectedFile.arrayBuffer();
            const audioContext = new AudioContext();
            const newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(newAudioBuffer);
            setAudioFile(selectedFile);
        } catch (e: any) {
            console.error(e);
        }
    }


    // Render the wavesurfer component
    // and a button to load a different audio file
    return <>
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
            <Grid padding={2} xs={12}>
                <SmallTextField
                    label="fps"
                    type="number"
                    value={fps}
                    onChange={(e) => setFps(parseFloat(e.target.value))}
                />
                <SmallTextField
                    label="bpm"
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(parseFloat(e.target.value))}
                />
                <SmallTextField
                    label="startFrame"
                    type="number"
                    value={startFrame}
                    onChange={(e) => setStartFrame(parseInt(e.target.value))}
                />
                <SmallTextField
                    label="endFrame"
                    type="number"
                    value={endFrame}
                    onChange={(e) => setEndFrame(parseInt(e.target.value))}
                />
                <TextField
                    select
                    fullWidth={false}
                    size="small"
                    style={{ width: '8em', marginLeft: '5px' }}
                    label={"Show time as: "}
                    InputLabelProps={{ shrink: true, }}
                    InputProps={{ style: { fontSize: '0.75em' } }}
                    value={xaxisType}
                    onChange={(e) => setXaxisType(e.target.value as "frames" | "seconds" | "beats")}
                >
                    <MenuItem value={"frames"}>Frames</MenuItem>
                    <MenuItem value={"seconds"}>Seconds</MenuItem>
                    <MenuItem value={"beats"}>Beats</MenuItem>
                </TextField>

            </Grid>
            <Grid padding={2} xs={12}>
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
                    //TODO - there's some kind of memory leak after running this a few times.
                }}
            /> }
            </Grid>
            <Grid padding={2} xs={12}>
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
                <WaveSurferPlayer
                    audioFile={audioFile}
                />
                {}


            </Grid>
        </Grid>
    </>
}

export default Labs;