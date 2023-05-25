import { Box, CssBaseline, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { ParseqRenderedFrames } from "./ParseqUI";
import { isArray } from "lodash";
import _ from "lodash";
import { createElement } from "react";
import { style } from "d3";
import Header from "./components/Header";
import { render } from "@testing-library/react";
import { create, all } from 'mathjs'

import React from "react";
import Sketch from "react-p5";
import p5Types from "p5"; //Import this for typechecking and intellisense



const config = { }
const m = create(all, config)


const Labs = () => {

    const FPS = 10;

    const [renderedData, setRenderedData] = useState<ParseqRenderedFrames>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const runOnceInterval = useRef<NodeJS.Timer>();
    const [viewportKey, setViewportKey] = useState(1);
    const [frames, setFrames] = useState<JSX.Element[]>([<Frame pos={0} rotate={[0,0,0]} translate={[0,0,0]} />]);

    const [masterTranslation, setMasterTranslation] = useState([0,0,0]);
    const [masterRotation, setMasterRotation] = useState([0,0,0]);

    // const cameraRef = useRef<HTMLDivElement | null>(null);
    // const assemblyRef = useRef<HTMLDivElement | null>(null);

    function transform(cameraElem: HTMLElement, assemblyElem: HTMLElement, rotate: number[], translate: number[]) {
        assemblyElem.style.transform = "rotateX(" + rotate[0] + "deg) " +
            "rotateY(" + rotate[1] + "deg) " +
            "rotateZ(" + rotate[2] + "deg)";

            assemblyElem.style.transform += "translate3d(" + (translate[0]) + "px, " +
            (translate[1]) + "px, " +
            (translate[2]) + "px)";
    }
    useEffect(() => {

        //TODO use refs instead of lookups on every frame.
        var camera = document.getElementById("camera");
        var assembly = document.getElementById("assembly");

        if (currentFrame > 0 && currentFrame % 10 === 0) {
            const newFrame = <Frame pos={currentFrame} rotate={[0,0,0]} translate={[0,0,0]} />;
            setFrames(frames => [newFrame, ...frames, ])
        }

        if (!renderedData[currentFrame]) {
            return;
        }

        var rotate = [
            renderedData[currentFrame]['rotation_3d_x'] || 0,
            renderedData[currentFrame]['rotation_3d_y'] || 0,
            renderedData[currentFrame]['rotation_3d_z'] || 0,
        ];

        var translate = [
            renderedData[currentFrame]['translation_x'] || 0,
            renderedData[currentFrame]['translation_y'] || 0,
            renderedData[currentFrame]['translation_z'] || 0,
        ];

        if (camera && assembly) {
            transform(camera, assembly, rotate, translate);
        }



    }, [currentFrame, renderedData]);

    useEffect(() => {
        if (runOnceInterval.current) {
            clearTimeout(runOnceInterval.current);
            runOnceInterval.current=undefined;
        }
        
        if (renderedData && renderedData.length > 0) {
            runOnceInterval.current = setInterval(() => {
                setCurrentFrame(frame => {
                    if (frame >= renderedData.length - 1) {
                        setFrames(frames => [<Frame pos={currentFrame} rotate={[0,0,0]} translate={[0,0,0]} />])
                        setViewportKey(prev => prev + 1); // reset viewport
                        return 0;
                    } else {
                        return frame + 1;
                    }
                });
            }, 1000 / FPS);

            
        } else {
            // Keyboard mode.
            setCurrentFrame(0);
        }
        
    }, [renderedData, runOnceInterval]);


        
    useEffect(() => {
        var camera = document.getElementById("camera");
        var assembly = document.getElementById("assembly");
        if (!camera || !assembly) {
            return;
        }
        //transform(camera, assembly, masterRotation, masterTranslation);
        
    }, [masterRotation, masterTranslation]);

    onkeydown = (e) => {

        setCurrentFrame(frame => frame+1);

        switch (e.key) {
            case 'ArrowRight':
                setMasterRotation(r => m.add(r, [0,1,0]));
                break;
            case 'ArrowLeft':
                setMasterRotation(r => m.add(r, [0,-1,0]));
                break;
            case 'ArrowUp':
                setMasterRotation(r => m.add(r, [1,0,0]));
                break;
            case 'ArrowDown':
                setMasterRotation(r => m.add(r, [-1,0,0]));
                break;
            case 'e':
                setMasterRotation(r => m.add(r, [0,0,1]));
                break;                
            case 'q':
                setMasterRotation(r => m.add(r, [0,0,-1]));
                break;
            case 'w':
                setMasterTranslation(t => m.add(t, [0,0,1]));
                break;
            case 's':
                setMasterTranslation(t => m.add(t, [0,0,-1]));
                break;
            case 'a':
                setMasterTranslation(t => m.add(t, [1,0,0]));
                break;
            case 'd':
                setMasterTranslation(t => m.add(t, [-1,0,0]));
                break;
            case 'r':
                setMasterTranslation(t => m.add(t, [0,1,0]));
                break;
            case 'f':
                setMasterTranslation(t => m.add(t, [1,-1,0]));
                break;
            case 'Escape':
                setMasterTranslation([0,0,0]);
                setMasterRotation([0,0,0]);
                setCurrentFrame(0);
                setFrames(frames => [<Frame pos={0} rotate={[0,0,0]} translate={[0,0,0]} />])
            default:
                console.log(e.key)                
        }
    }

    return <>
        <Header title="Parseq Labs - experiments" />
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
            <Grid padding={2} xs={12}>
                <Stack direction="column" spacing={2} alignItems={"center"}  >
                    <Viewport
                            key={viewportKey}
                            frames={frames}
                        />
                    <Typography fontFamily={"monospace"}>Frame: {currentFrame}</Typography>
                    <Typography fontSize={"0.75em"} fontFamily={"monospace"}>{renderedData[currentFrame]?.deforum_prompt}</Typography>
                </Stack>
                <Divider style={{padding: '10px'}} />
                <TextField
                    label="Rendered parseq data"
                    InputLabelProps={{ shrink: true, }}
                    variant="outlined"
                    fullWidth
                    rows={20}
                    multiline
                    InputProps={{ style: { fontSize: '0.75em', fontFamily: 'monospace' }}}
                    onBlur={(e) => {
                        try {
                            if (!e.target.value || _.isEmpty(e.target.value)) {
                                setRenderedData([]);
                                return;
                            }
                            const parsed = JSON.parse(e.target.value);
                            if (isArray(parsed) && _.isNumber(parsed[0].frame)) {
                                setRenderedData(parsed as ParseqRenderedFrames);
                            } else if (isArray(parsed['rendered_frames'])) {
                                setRenderedData(parsed['rendered_frames'] as ParseqRenderedFrames);
                            } else {
                                throw new Error('JSON input does not look like valid Parseq rendered data.');
                            }
                        } catch (e) {
                            console.error(e);
                            setRenderedData([]);
                        }
                        setCurrentFrame(0);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            //@ts-ignore
                            e.target.blur();
                            e.preventDefault();
                        }
                    }}

                />
            </Grid>
        </Grid>
    </>


}



const Frame = ({pos, rotate, translate} : {pos: number, rotate : number[], translate : number[]} ) => {

    const frameStyle = {
        position: 'absolute' as const,
        border: '2px solid black',
        width: '512px',
        height: '512px',
        opacity: '50%', 
        //background: 'radial-gradient(closest-side, rgba(255,172,172,1) 0%, rgba(174,169,250,0) 3%, rgba(142,138,205,0) 31%, rgba(41,27,255,1) 34%, rgba(12,0,179,1) 37%, rgba(132,128,189,0) 39%, rgba(78,76,113,0) 88%, rgba(0,0,0,1) 98%, rgba(0,0,0,1) 100%)',
        transform : "rotateX(" + rotate[0]||0 + "deg) " + "rotateY(" + rotate[1]||0 + "deg) " + "rotateZ(" + rotate[2]||0 + " deg)"
                    + "translate3d(" + (translate[0]||0) + "px, " + (translate[1]||0) + "px, " + (translate[2]||0) + "px)"
    }

    return <div style={frameStyle} id="frame_n">{pos++}</div>
}

const Viewport = ({ frames }: { frames: JSX.Element[] }) => {

    const viewportStyle = {
        border: '1px solid red',
        perspective: '100px',
        width: '512px',
        height: '512px',
        overflow: 'hidden',
    }

    const cameraStyle = {
        width: '512px',
        height: '512px',
        transformStyle: "preserve-3d" as const
    }

    return  <>
    <div id="viewport" style={viewportStyle}>
        <div id="camera" style={cameraStyle}>
            <div id="assembly" >
                {frames.map((frame, i) => {
                    return <div key={i}>{frame}</div>
                })}
            </div>
        </div>
    </div>
    <Typography>DEBUG: {frames.length}</Typography>
    </>
}

export default Labs;