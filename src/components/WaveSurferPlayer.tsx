import { Box, Button, MenuItem, TextField } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer, { WaveSurferEvents, WaveSurferOptions } from "wavesurfer.js";
import { SmallTextField } from "./SmallTextField";
import { BiquadFilter } from "./BiquadFilter";
import { getWavBytes } from "../utils/utils";
import { CssVarsPalette, Palette, SupportedColorScheme, experimental_extendTheme as extendTheme, useColorScheme } from "@mui/material/styles";
import { themeFactory } from "../theme";
import { Viewport } from "./Viewport";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram";
import { useHotkeys } from 'react-hotkeys-hook'
import { beatToSec, frameToSec, secToBeat, secToFrame, calculateNiceStepSize } from "../utils/maths";


export type TimelineOptions = {
    xaxisType: "frames" | "seconds" | "beats";
    bpm: number;
    fps: number;
};

export type ViewportOptions = {
    startFrame: number;
    endFrame: number;
};

type WaveSurferPlayerProps = {
    audioFile: Blob | undefined;
    wsOptions: Partial<WaveSurferOptions>;
    timelineOptions: TimelineOptions;
    viewport: ViewportOptions;
    onscroll: (startX: number, endX: number) => void;
    onready: () => void;
}

const resetHandler = (wavesurferRef: MutableRefObject<WaveSurfer | null>, event : keyof WaveSurferEvents, eventHandlerRef: MutableRefObject<(() => void) | undefined>, logic : any) => {
    if (!wavesurferRef.current) {
        return;
    }
    if (eventHandlerRef.current) {
        wavesurferRef.current.un(event, eventHandlerRef.current);
    }
    eventHandlerRef.current = wavesurferRef.current.on(event, logic);
}

export const WaveSurferPlayer = ({ audioFile, wsOptions, timelineOptions, viewport, onscroll, onready }: WaveSurferPlayerProps) => {
    console.log("Rendering WaveSurferPlayer: ", audioFile?.name || "no audio file");

    const containerRef = useRef<HTMLDivElement>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    const timelinePluginRef = useRef<TimelinePlugin | undefined>()
    const zoomHandlerRef = useRef<(() => void) | undefined>();
    const scrollHandlerRef = useRef<(() => void) | undefined>();
    const readyHandlerRef = useRef<(() => void) | undefined>();

    const [lastSeekedPos, setLastSeekedPos] = useState(0);

    const [pxPerSec, setPxPerSec] = useState(10);


    const recreateWavesurfer = useCallback(() => {
        if (!containerRef.current) {
            return;
        }
        if (wavesurferRef.current) {
            wavesurferRef.current.unAll();
            wavesurferRef.current.destroy();
        }
        console.log("---> Creating wavesurfer")
        const ws = WaveSurfer.create({
            ...wsOptions,
            container: containerRef.current,
        })

        // Static handlers that won't change when props change
        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('seeking', (pos) => setLastSeekedPos(pos));
        ws.on('timeupdate', (currentTime) => setCurrentTime(currentTime));
        ws.on('load', () => console.log('load event'));
        ws.on('decode', () => console.log('decode event'));
        ws.on('ready', () => console.log('ready event'));

        wavesurferRef.current = ws;

        return () => {
            // TODO - I should be unsubscribing & destroying here,
            // but that is causing issues – possible leak.
            console.log("<--- SHOULD destroy wavesurfer")
        }
    }, [wsOptions]);

    // Initialise wavesurfer once.
    useEffect(() => {
        if (!wavesurferRef.current) {
            recreateWavesurfer();
        }
    })

    // Re-register scroll handler when timeline options change, because of dependency on fps.
    useEffect(() => {
        resetHandler(wavesurferRef, 'scroll', scrollHandlerRef, (startX:number, endX:number) => {
            onscroll(startX * timelineOptions.fps, endX * timelineOptions.fps)
        });
    }, [onscroll, timelineOptions]);

    // Re-register zoom handler .
    useEffect(() => {
        resetHandler(wavesurferRef, 'zoom', zoomHandlerRef, (newPxPerSec:number) => {
            console.log('zoom event (pxPerSec):', newPxPerSec);
            setPxPerSec(newPxPerSec); // Will trigger timeline rebuild.
            // No callback for zoom because there is no internal zoom control
        });
    }, []);

    // Re-register ready handler when prop callback changes
    useEffect(() => {
        resetHandler(wavesurferRef, 'ready', readyHandlerRef, () => {
            onready();
        });
    }, [onready]);

    // If audio the audio file changes, load it in wavesurfer.
    useEffect(() => {
        if (!wavesurferRef.current) return;
        if (audioFile) {
            try {
                //recreateWavesurfer();
                (wavesurferRef.current as any).timer.stop(); // HACK to workaround https://github.com/katspaugh/wavesurfer.js/issues/3097
                wavesurferRef.current.loadBlob(audioFile);
            } catch (e: any) {
                console.error(`Failed to load ${audioFile.name}':`, e)
            }
        }
    }, [wavesurferRef, audioFile]);


    // If viewport changes, force wavesurfer to scroll or zoom
    useEffect(() => {
        if (!wavesurferRef.current || !wavesurferRef.current.getDuration()) {
            return;
        }
        const startSec = viewport.startFrame / timelineOptions.fps;
        const endSec = viewport.endFrame / timelineOptions.fps;

        const desiredPxPerSec = (wavesurferRef.current as any).renderer.scrollContainer.clientWidth / (endSec - startSec);
        wavesurferRef.current.zoom(desiredPxPerSec);
        (wavesurferRef.current as any).renderer.scrollContainer.scrollLeft = startSec * desiredPxPerSec;

    }, [viewport, timelineOptions]);

    const getTimeIntervals = useCallback((pxPerSec: number, clientWidth: number, inTimelineOptions: TimelineOptions) => {

        const { bpm, fps, xaxisType } = inTimelineOptions;

        // Calculate the number of units that can be displayed in the viewport
        const secondsInView = clientWidth / pxPerSec;
        let unitsInView: number;
        switch (xaxisType) {
            case "seconds":
                unitsInView = secondsInView;
                break;
            case "frames":
                unitsInView = secToFrame(secondsInView, fps);
                break;
            case "beats":
                unitsInView = secToBeat(secondsInView, bpm);
                break;
        }

        // Ticks to display is 10 per 100px, rounded to the closest 10.
        const ticksInView = Math.floor(clientWidth / 100) * 10;

        // Units per tick should be a nice number, e.g. 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100...
        const roughStepSize = unitsInView / ticksInView;
        const niceStepSize = calculateNiceStepSize(roughStepSize);

        let secondsPerTick: number;
        switch (xaxisType) {
            case "seconds":
                secondsPerTick = niceStepSize;
                break;
            case "frames":
                secondsPerTick = frameToSec(niceStepSize, fps);
                break;
            case "beats":
                secondsPerTick = beatToSec(niceStepSize, bpm);
                break;
        }

        console.log("timeline settings", {
            clientWidth,
            pxPerSec,
            unitsInView,
            ticksInView,
            roughStepSize,
            niceStepSize,
            secondsPerTick,
        });

        return {
            timeInterval: secondsPerTick,
            primaryLabelSpacing: 10,
            secondaryLabelSpacing: 5,
            formatTimeCallback: (sec: number) => {
                switch (xaxisType) {
                    case "frames":
                        return `${(sec * fps).toFixed(0)}`;
                    case "seconds":
                        return `${sec.toFixed(2)}`;
                    case "beats":
                        return `${(sec * bpm / 60).toFixed(2)}`;
                }
            }
        };

    }, []);


    // Rebuild the timeline if any of the timeline options change.
    const rebuildTimeline = useCallback(() => {
        if (!wavesurferRef.current) {
            return
        }
        if (timelinePluginRef.current) {
            timelinePluginRef.current.destroy();
        }
        const options = {
            ...getTimeIntervals(pxPerSec, wavesurferRef.current.getWrapper().clientWidth, timelineOptions),
        }
        //@ts-ignore
        const newTimelinePlugin: TimelinePlugin = wavesurferRef.current.registerPlugin(TimelinePlugin.create(options));
        timelinePluginRef.current = newTimelinePlugin;

    }, [getTimeIntervals, timelineOptions, wavesurferRef, pxPerSec]);

    useEffect(() => {
        rebuildTimeline();
    }, [rebuildTimeline])

    // On play button click
    const onPlayClick = useCallback(() => {
        if (!wavesurferRef.current) return;
        wavesurferRef.current.isPlaying() ? wavesurferRef.current.pause() : wavesurferRef.current.play();
    }, [wavesurferRef])

    function playPause(from: number = -1, pauseIfPlaying = true) {
        if (isPlaying && pauseIfPlaying) {
            wavesurferRef.current?.pause();
        } else {
            if (from >= 0) {
                wavesurferRef.current?.setTime(from);
            } if (!isPlaying) {
                wavesurferRef.current?.play();
            }
        }
    }

    useHotkeys('space',
        () => playPause(),
        { preventDefault: true, scopes: ['main'], description: 'Play from cursor position / pause.' },
        [playPause]);

    useHotkeys('shift+space',
        () => playPause(0, false),
        { preventDefault: true, scopes: ['main'], description: 'Play from start.' },
        [playPause]);

    useHotkeys('ctrl+space',
        () => playPause(lastSeekedPos, false),
        { preventDefault: true, scopes: ['main'], description: 'Play from the last seek position.' },
        [playPause, lastSeekedPos]);

    return (
        <>
            {/* @ts-ignore */}
            <div ref={containerRef} style={{ minHeight: '120px' }} />
            <button onClick={onPlayClick} style={{ marginTop: '1em' }}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>
            <p>{currentTime.toFixed(3)}s / {secToFrame(currentTime, timelineOptions.fps).toFixed(2)} frames / {secToBeat(currentTime, timelineOptions.bpm).toFixed(2)} beats </p>
        </>
    )
}

export default WaveSurferPlayer;