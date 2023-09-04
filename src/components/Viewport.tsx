import { faArrowsLeftRightToLine, faLeftLong, faMagnifyingGlassMinus, faMagnifyingGlassPlus, faRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Tooltip, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { Timeline, TimelineEffect, TimelineRow } from "@xzdarcy/react-timeline-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from 'react-hotkeys-hook';
import { frameToXAxisType } from "../utils/maths";


type ViewportProps = {
    fps: number,
    bpm: number,
    xaxisType: "frames" | "seconds" | "beats",
    lastFrame: number,
    viewport: {
        startFrame: number,
        endFrame: number,
    },
    onChange: (viewport: { startFrame: number, endFrame: number }) => void,
}


export function Viewport(props: ViewportProps) {
    const resizeRef = useRef<any>(null);
    const scale = Math.ceil(props.lastFrame / 25 / 5) * 5;
    const [timelineWidth, setTimelineWidth] = useState(600);
    const scaleWidth = timelineWidth / ((props.lastFrame * 1.1) / scale);
    const currentViewport = props.viewport;
    const scaleSplitCount = Math.min(scale, 20);
    const data: TimelineRow[] = [{
        id: 'viewport',
        actions: [
            {
                id: 'viewport',
                start: currentViewport?.startFrame ?? 0,
                end: currentViewport?.endFrame ?? props.lastFrame,
                effectId: "0",
            },
        ]
    }];
    const effects: Record<string, TimelineEffect> = {
        effect0: {
            id: "0",
            name: "0",
        },
    };
    useEffect((): any => {
        function handleResize() {
            if (resizeRef.current) {
                setTimelineWidth(resizeRef.current.offsetWidth);
            }
            //console.log("resized to", timelineRef.current.offsetWidth);
        }
        handleResize();
        window.addEventListener('resize', handleResize)
        return (_: any) => window.removeEventListener('resize', handleResize);
    }, []);

    const zoomIn = useCallback(() => {
        const rangeSize = currentViewport.endFrame - currentViewport.startFrame;
        const rangeCentre = currentViewport.startFrame + rangeSize / 2;
        const newRangeSize = (currentViewport.endFrame - currentViewport.startFrame) * 0.9;
        props.onChange({ startFrame: Math.max(0, rangeCentre - newRangeSize / 2), endFrame: rangeCentre + newRangeSize / 2 });
    }, [props, currentViewport]);

    const zoomOut = useCallback(() => {
        const rangeSize = currentViewport.endFrame - currentViewport.startFrame;
        const rangeCentre = currentViewport.startFrame + rangeSize / 2;
        const newRangeSize = (currentViewport.endFrame - currentViewport.startFrame) * 1.1;
        props.onChange({ startFrame: Math.max(0, rangeCentre - newRangeSize / 2), endFrame: rangeCentre + newRangeSize / 2 });
    }, [props, currentViewport]);

    const scrollLeft = useCallback(() => {
        const rangeSize = currentViewport.endFrame - currentViewport.startFrame;
        const stepSize = rangeSize * 0.25;
        if (currentViewport.startFrame > 0) {
            props.onChange({ startFrame: Math.max(0, currentViewport.startFrame - stepSize), endFrame: Math.max(rangeSize, currentViewport.endFrame - stepSize) });
        }
    }, [props, currentViewport]);

    const scrollRight = useCallback(() => {
        const rangeSize = currentViewport.endFrame - currentViewport.startFrame;
        const stepSize = rangeSize * 0.25;
        props.onChange({ startFrame: currentViewport.startFrame + stepSize, endFrame: currentViewport.endFrame + stepSize });
    }, [props, currentViewport]);

    const reset = useCallback(() => {
        currentViewport.startFrame = 0;
        currentViewport.endFrame = props.lastFrame;
        props.onChange({ ...currentViewport });
    }, [props, currentViewport]);

    useHotkeys('shift+up', () => {
        zoomIn();
    }, { preventDefault: true, scopes: ['main'] }, [zoomIn]);

    useHotkeys('shift+down', () => {
        zoomOut();
    }, { preventDefault: true, scopes: ['main'] }, [zoomOut]);

    useHotkeys('shift+left', () => {
        scrollLeft();
    }, { preventDefault: true, scopes: ['main'] }, [scrollLeft]);

    useHotkeys('shift+right', () => {
        scrollRight();
    }, { preventDefault: true, scopes: ['main'] }, [scrollRight]);

    if (scale < 0) {
        return <></>;
    }

    return (
        <span ref={resizeRef}>
            <Timeline
                style={{ height: '75px', width: '100%', marginBottom: '5px' }}
                editorData={data}
                effects={effects}
                scale={scale}
                scaleWidth={scaleWidth}
                rowHeight={15}
                gridSnap={true}
                maxScaleCount={1000}
                minScaleCount={Math.max(1, timelineWidth / scale)}
                scaleSplitCount={scaleSplitCount}

                onChange={(e: any) => {
                    const action = e[0].actions[0];
                    currentViewport.startFrame = Math.round(action.start);
                    currentViewport.endFrame = Math.round(action.end);
                    props.onChange({ ...currentViewport });
                }}
                hideCursor={true}
                onDoubleClickRow={(e, { row, time }) => {
                    reset();
                }}
                getActionRender={(action: any, row: any) => {
                    const start = frameToXAxisType(action.start, props.xaxisType, props.fps, props.bpm);
                    const end = frameToXAxisType(action.end, props.xaxisType, props.fps, props.bpm);

                    return <div style={{
                        borderRadius: '5px',
                        marginTop: '1px',
                        overflow: 'hidden',
                        maxHeight: '15px',
                        backgroundColor: getViewportColour(action)
                    }}>

                        <Stack direction="row" justifyContent="space-between" paddingLeft={'5px'} paddingRight={'5px'}>
                            <Typography paddingLeft={'5px'} color={'white'} fontSize='0.7em'>{start}</Typography>
                            <Typography paddingLeft={'5px'} color={'white'} fontSize='0.7em'>{end}</Typography>
                        </Stack>
                    </div>
                }}
                getScaleRender={(scale: number) => {
                    const colour = scale < props.lastFrame
                        ? 'white'
                        : (scale === props.lastFrame
                            ? 'orange'
                            : 'red');
                    const value = frameToXAxisType(scale, props.xaxisType, props.fps, props.bpm);
                    return <Typography fontSize={'0.75em'} color={colour}>{value}</Typography>
                }}
            />
            <Stack direction={"row"} justifyContent={'space-between'} >
                <Tooltip title="Scroll left (shift-left)"><span><Button size='small' variant='contained' onClick={scrollLeft} disabled={currentViewport.startFrame === 0} ><FontAwesomeIcon icon={faLeftLong} /></Button></span></Tooltip>
                <Stack direction={"row"} spacing={2}>
                    <Tooltip title="Zoom out (shift-down)"><Button size='small' variant='contained' onClick={zoomOut}><FontAwesomeIcon icon={faMagnifyingGlassMinus} /></Button></Tooltip>
                    <Tooltip title="Reset viewport"><Button size='small' variant='contained' onClick={reset}><FontAwesomeIcon icon={faArrowsLeftRightToLine} /></Button></Tooltip>
                    <Tooltip title="Zoom in (shift-up)"><Button size='small' variant='contained' onClick={zoomIn}><FontAwesomeIcon icon={faMagnifyingGlassPlus} /></Button></Tooltip>
                </Stack>
                <Tooltip title="Scroll right (shift-right)"><Button size='small' variant='contained' onClick={scrollRight} ><FontAwesomeIcon icon={faRightLong} /></Button></Tooltip>
            </Stack>
        </span>
    );

    function getViewportColour(action: any) {
        if (Math.round(action.start) === 0 && Math.round(action.end) === props.lastFrame) {
            return 'rgba(60,250,60,0.5)';
        } else if (Math.round(action.end) > props.lastFrame) {
            return 'rgba(250,60,60,0.5)';
        } else {
            return 'rgba(125,125,250,0.5)';
        }
    }
}