import { Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { Timeline, TimelineEffect, TimelineRow } from "@xzdarcy/react-timeline-editor";
import { useEffect, useRef, useState } from "react";
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
    const scaleSplitCount = Math.min(scale,20);
    const data: TimelineRow[] = [{
        id: 'viewport',
        actions: [
            {
                id: 'viewport',
                start: currentViewport?.startFrame??0,
                end: currentViewport?.endFrame??props.lastFrame,
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


    if (scale < 0) {
        return <></>;
    }    

    return (
        <span ref={resizeRef}>
            <Timeline
                style={{ height: '75px', width: '100%' }}
                editorData={data}
                effects={effects}
                scale={scale}
                scaleWidth={scaleWidth}
                rowHeight={15}
                gridSnap={true}
                maxScaleCount={1000}
                minScaleCount={Math.max(1,timelineWidth/scale)}
                scaleSplitCount={scaleSplitCount}

                onChange={(e: any) => {
                    const action = e[0].actions[0];
                    currentViewport.startFrame = Math.round(action.start);
                    currentViewport.endFrame = Math.round(action.end);
                    props.onChange({ ...currentViewport });
                }}
                hideCursor={true}
                onDoubleClickRow={(e, {row, time}) => {
                    currentViewport.startFrame = 0;
                    currentViewport.endFrame = props.lastFrame;
                    props.onChange({ ...currentViewport });
                }}                
                getActionRender={(action: any, row: any) => {
                    const start = frameToXAxisType(action.start, props.xaxisType, props.fps, props.bpm);
                    const end = frameToXAxisType(action.end, props.xaxisType, props.fps, props.bpm);

                    return <div style={{ 
                            borderRadius: '5px',
                            marginTop: '1px',
                            overflow: 'hidden',
                            maxHeight: '15px',
                            backgroundColor: getViewportColour(action) }}>
                        
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