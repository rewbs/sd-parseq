import { Box, Button, MenuItem, TextField } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { SupportedColorScheme, experimental_extendTheme as extendTheme, useColorScheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import { BiquadFilter } from "./components/BiquadFilter";
import { SmallTextField } from "./components/SmallTextField";
import { TimelineOptions, ViewportOptions, WaveSurferPlayer } from "./components/WaveSurferPlayer";
import { themeFactory } from "./theme";
import { getWavBytes } from "./utils/utils";
import colormap from './data/hot-colormap.json';

const Labs = () => {
    console.log("Rendering Labs");
    const [fps, setFps] = useState(30);
    const [bpm, setBpm] = useState(120);
    const [xaxisType, setXaxisType] = useState<"frames" | "seconds" | "beats">("frames");
    const [startFrame, setStartFrame] = useState(0);
    const [endFrame, setEndFrame] = useState(0);

    const [startVisibleFrame, setStartVisibleFrame] = useState(0);
    const [endVisibleFrame, setEndVisibleFrame] = useState(0);

    const [timelineOptions, setTimelineOptions] = useState<TimelineOptions>({ fps, bpm, xaxisType });
    const [viewport, setViewport] = useState<ViewportOptions>({ startFrame, endFrame });

    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | undefined>();
    const [audioFile, setAudioFile] = useState<Blob | undefined>();
    const fileInput = useRef<HTMLInputElement>("" as any);

    const theme = extendTheme(themeFactory());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { colorScheme, setColorScheme } = useColorScheme();
    const palette = theme.colorSchemes[(colorScheme || 'light') as SupportedColorScheme].palette;

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
        setViewport({ startFrame, endFrame });
    }, [startFrame, endFrame])

    useEffect(() => {
        setTimelineOptions({ fps, bpm, xaxisType });
    }, [bpm, fps, xaxisType])

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
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
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
                    <Button
                        disabled={!audioBuffer || (endFrame - startFrame) <= 2}
                        onClick={(e) => setEndFrame(endF => Math.max(startFrame+2, Math.floor(endF * 0.8)))}>
                        Zoom in
                    </Button>
                    <Button
                        disabled={!audioBuffer || (endFrame - startFrame) >= audioBuffer.length }
                        onClick={(e) => {
                                const audioTotalFrames = audioBuffer?.length ?? 0 * fps ;
                                const newViewportWidth = Math.min((endFrame - startFrame) * 1.2, audioTotalFrames)
                                const newEndFrame = startFrame + newViewportWidth > audioTotalFrames ? audioTotalFrames : startFrame + newViewportWidth;
                                const newStartFrame = startFrame + newViewportWidth > audioTotalFrames ? audioTotalFrames - newViewportWidth : startFrame;
                                setStartFrame(newStartFrame);
                                setEndFrame(newEndFrame);
                            }
                            }>
                        Zoom out
                    </Button>
                </Box>
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
                    }}
                />}
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
                    wsOptions={wsOptions}
                    timelineOptions={timelineOptions}
                    viewport={viewport}
                    onscroll={(startFrame, endFrame) => {
                        setStartVisibleFrame(startFrame);
                        setEndVisibleFrame(endFrame);
                    }}
                />
                <p>Visble frame range: {startVisibleFrame.toFixed(2)} - {endVisibleFrame.toFixed(2)}</p>
            </Grid>
        </Grid>
    </>
}

export default Labs;