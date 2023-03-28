import { Box, Alert, Typography, Button, Stack } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { useCallback, useEffect, useRef, useState } from "react";
import { WaveForm, WaveSurfer } from "wavesurfer-react";
//@ts-ignore
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min";
//@ts-ignore
import MarkersPlugin from "wavesurfer.js/src/plugin/markers";
import debounce from 'lodash.debounce';
import { frameToBeat, frameToSec } from "../utils/maths";

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
}


export function AudioWaveform(props: AudioWaveformProps) {

    console.log("Initialising Waveform with props: ", props);

    const audioContext = new AudioContext();
    const wavesurferRef = useRef<WaveSurfer>();
    const fileInput = useRef<HTMLInputElement>("" as any);
    const waveformRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackPos, setPlaybackPos] = useState<string>();
    const [trackLength, setTrackLength] = useState(0);
    const [statusMessage, setStatusMessage] = useState(<></>);
    const [lastPxPerSec, setLastPxPerSec] = useState(0);
    const [lastViewport, setLastViewport] = useState({ startFrame: 0, endFrame: 0 });

    // Triggered when user makes viewport changes outside of wavesurfer, and we need to update wavesurfer.
    const scrollToPosition = (startFrame: number) => {
        if (!trackLength) {
            console.log('No track loaded');
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
    }


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

        if (startFrame === lastViewport.startFrame) {
            //console.log("no scrolling required");
            return;
        }

        //const endFrame = Math.round(startFrame + (lastViewport.endFrame - lastViewport.startFrame));
        const endFrame = Math.round((wavesurferRef.current.drawer.wrapper.scrollLeft + wavesurferRef.current.drawer.container.clientWidth) / pxPerSec * props.fps);
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

    const updatePlaybackPos = useCallback(() => {
        const lengthFrames = trackLength * props.fps;
        const curPosSeconds = wavesurferRef.current?.getCurrentTime() || 0;
        const curPosFrames = curPosSeconds * props.fps;
        setPlaybackPos(`Cursor at:
            ${curPosSeconds.toFixed(3)}/${trackLength.toFixed(3)}s
            (frame: ${curPosFrames.toFixed(0)}/${lengthFrames.toFixed(0)})
    (beat: ${frameToBeat(curPosFrames, props.fps, props.bpm).toFixed(2)}/${frameToBeat(lengthFrames, props.fps, props.bpm).toFixed(2)})`);
    
        props.onCursorMove(curPosFrames);

    }, [trackLength, props]);

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

            // Prepare audio buffer for analysis.
            const selectedFile = selectedFiles[0];
            const arrayBuffer = await selectedFile.arrayBuffer();
            const newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            //setAudioBuffer(newAudioBuffer);
            setTrackLength(newAudioBuffer.duration);

            // Load audio file into wavesurfer visualisation
            wavesurferRef.current?.loadDecodedBuffer(newAudioBuffer);
            updateMarkers();

        } catch (e: any) {
            setStatusMessage(<Alert severity="error">Error loading file: {e.message}</Alert>)
            console.error(e);
        }
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
                    time: frameToSec(marker.x ,props.fps),
                    position: marker.top ? "top" : "bottom" as const,
                    //@ts-ignore - extra metadata
                    meta: "prompt"
                })
        });

        props.keyframesPositions.forEach((frame) => {
            wavesurferRef.current?.markers.add({
                time: frameToSec(frame,props.fps),
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
                color: "red",
                position: "top" as "top",
                draggable: false,
                label: 'grid cursor',
                //@ts-ignore - extra metadata
                meta: "cursor"
            });
        }

        if (props.beatMarkerInterval > 0) {
            for (var i = 0; i < trackLength; i += props.beatMarkerInterval*60/props.bpm) {
                wavesurferRef.current?.markers.add({
                    time: i,
                    color: "rgba(0, 0, 0, 0.5)",
                    position: "top" as const,
                    draggable: false,
                    label: `Beat ${(i/60*props.bpm).toFixed(0)}`,
                    //@ts-ignore - extra metadata
                    meta: "beat"
                });
            }
        }

    }, [props, trackLength]);

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
                scrollToPosition(props.viewport.startFrame-1);
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
            plugin: MarkersPlugin,
            options: {
                markers: [{ draggable: true }]
            }
        }
    ];

    return <>
        <Grid container>
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
                    />
                    <div id="timeline" />
                </WaveSurfer>
            </Grid>
            <Grid xs={12}>
                <Stack direction="row" spacing={1} alignItems="center" alignContent="center">
                <Button disabled={!wavesurferRef.current?.isReady || isPlaying} variant="contained" onClick={(e) => {
                    setIsPlaying(true);
                    updatePlaybackPos();
                    wavesurferRef.current?.play();
                }}>
                    ▶️ Play
                </Button>
                <Button disabled={!wavesurferRef.current?.isReady || !isPlaying} variant="contained" onClick={(e) => {
                    setIsPlaying(false);
                    updatePlaybackPos();
                    wavesurferRef.current?.pause()
                }}>
                    ⏸️ Pause
                </Button>
                <Typography fontSize={"0.75em"}>
                    {playbackPos}
                </Typography>
                </Stack>
            </Grid>
            <Grid xs={12}>
                <Box padding='5px'>
                    <strong>File:</strong> <input type="file" ref={fileInput} onChange={loadFile} />
                    <Typography fontSize="0.75em">
                        Note: audio data is not saved with Parseq documents. You will need to reload your reference audio file when you reload your Parseq document.
                    </Typography>
                </Box>
            </Grid>
            <Grid xs={12}>
                {statusMessage}
            </Grid>
        </Grid>
    </>;


}