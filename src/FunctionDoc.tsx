import { Box, FormControlLabel, Link, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { AgGridReact } from "ag-grid-react";
import _ from "lodash";
import { useCallback, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from "react-router-dom";
import { GraphableData, ParseqKeyframe, ParseqKeyframes, ParseqPersistableState, RenderedData } from "./ParseqUI";
import MovementPreview from "./components/MovementPreview";
import { ParseqGraph } from "./components/ParseqGraph";
import { ParseqGrid } from "./components/ParseqGrid";
import StyledSwitch from "./components/StyledSwitch";
import functionLibrary, { ArgDef, ParseqFunction } from "./parseq-lang/parseq-lang-functions";
import { parseqRender } from "./parseq-renderer";
import { experimental_extendTheme as extendTheme } from "@mui/material/styles";
import { themeFactory } from "./theme";

type MiniParseqProps = {
    keyframes: ParseqKeyframes
    fields: string[]
}

const miniParseqDefaults: {
    fields: string[],
    keyframes: ParseqKeyframes
} = {
    fields: ["translation_z"],
    keyframes: [
        {
            "frame": 0,
            "translation_z": (0 as string | number),
            "translation_z_i": ''
        },
        {
            "frame": 99,
        }
    ]
};

//TODO move to utils
const argToMarkdown = (argDef: ArgDef): string => {
    return `${argDef.names.map(n => '`' + n + '`').join("/")} ${argDef.required ? '**required**' : ''}: ${argDef.description} (default: ${argDef.required ? 'none' : (argDef.defaultDescription || argDef.default.toString())}, type: ${argDef.type})`;
}


const MiniParseq = ({ keyframes, fields }: MiniParseqProps) => {

    const bpm = 120;
    const fps = 20;

    const gridRef = useRef<AgGridReact<ParseqKeyframe>>(null);
    const [renderedData, setRenderedData] = useState<RenderedData | undefined>(undefined);
    const [graphableData, setGraphableData] = useState<GraphableData | undefined>(undefined);
    const [visualise, setVisualise] = useState(false);

    const onGridReady = useCallback(() => {
        if (!gridRef || !gridRef.current) {
            console.log("gridRef not ready");
            return;
        }
        gridRef.current.api.setRowData(keyframes);
        const persistableState: ParseqPersistableState = {
            keyframes: keyframes,
            meta: {
                docName: undefined,
                generated_by: "",
                version: "",
                generated_at: ""
            },
            options: {
                bpm: bpm,
                output_fps: fps,
            },
            managedFields: fields,
            timeSeries: [],
            prompts: {
                enabled: false,
                promptList: [],
                format: "v2",
                commonPromptPos: 'append',
                commonPrompt: {
                    name: 'Common',
                    positive: "",
                    negative: "",
                    allFrames: true,
                    from: 0,
                    to: 100,
                    overlap: {
                        inFrames: 0,
                        outFrames: 0,
                        type: "none" as "none" | "linear" | "custom",
                        custom: "",
                    }
                },

            },
            keyframeLock: "frames"
        }

        //gridRef.current.api.sizeColumnsToFit();

        const { renderedData, graphData } = parseqRender(persistableState);
        setRenderedData(renderedData);
        setGraphableData(graphData);
        setTimeout(() => { gridRef.current!.columnApi.autoSizeColumns(['frame', 'info', ...fields]); }, 100);
    }, [keyframes, fields]);


    //console.log(renderedData);

    const grid = <ParseqGrid
        ref={gridRef}
        onCellValueChanged={onGridReady}
        onCellKeyPress={() => { }}
        onGridReady={onGridReady}
        onFirstDataRendered={() => { }}
        onChangeGridCursorPosition={() => { }}
        onSelectRange={() => { }}
        rangeSelection={{}}
        showCursors={false}
        keyframeLock={"frames"}
        fps={20}
        bpm={120}
        agGridStyle={{ width: '100%', minHeight: '50px', maxHeight: '500px', }}
        agGridProps={{ domLayout: 'autoHeight' }}
        managedFields={fields} />

    const graph = graphableData && renderedData ? <ParseqGraph
        editingDisabled={true}
        hideLegend={true}
        renderedData={renderedData}
        graphableData={graphableData}
        displayedFields={fields}
        as_percents={false}
        addKeyframe={() => { }}
        updateKeyframe={() => { }}
        clearKeyframe={() => { }}
        onDecimation={() => { }}
        onGraphScalesChanged={() => { }}
        promptMarkers={[]}
        beatMarkerInterval={0}
        gridCursorPos={NaN}
        audioCursorPos={NaN}
        xscales={{
            xmin: 0,
            xmax: 100
        }}
        height={"200px"}
        xaxisType={""} /> : <> </>

    return <Stack direction={"column"} gap={0}>
        <FormControlLabel
            sx={{ padding: '0' }}
            control={<StyledSwitch
                edge="end"

                onChange={(e) => setVisualise(e.target.checked)}
                checked={visualise}
            />}
            label={<small>&nbsp;Visualise</small>} />
        <Stack direction={"row"}>
            <Box width="auto" minWidth={"33%"} flexGrow={2}>
                {grid}
            </Box>
            <Box width="auto" minWidth={"33%"} maxWidth={"50%"} flexGrow={1}>
                {graph}
            </Box>
        </Stack>
        {
            visualise && renderedData && <MovementPreview
                renderedData={renderedData.rendered_frames}
                fps={30}
                height={512}
                width={512}
                hideWarning
                hidePrompt
                hideCadence
            />
        }
    </Stack>
}


type DocEntry = {
    category: string,
    name: string,
    description?: string,
    function_ref?: ParseqFunction
    examples: {
        description?: string,
        fields?: string[],
        keyframeOverrides: ParseqKeyframes,
    }[]
};

const FunctionDoc = () => {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchParams, setSearchParams] = useSearchParams();
    const theme = extendTheme(themeFactory());

    const docEntries: DocEntry[] = [
        {
            category: "Context variables",
            name: "**L**: Linear interpolation",
            description: "Linear interpolation between keyframe values using the `L` interpolation modifier. This is the default behaviour (try removing `L` - you'll see no difference).",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'L', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, translation_z: 250, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }]
        },
        {
            category: "Context variables",
            name: "**C**: Cubic spline interpolation",
            description: "Cubic spline interpolation between keyframe values using the `C` interpolation modifier.",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'C', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, translation_z: 250, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }]
        },
        {
            category: "Context variables",
            name: "**S**: Step interpolation",
            description: "Step interpolation between keyframe values using the `S` interpolation modifier. You can think of this as the 'last seen' value.",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'S', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, translation_z: 250, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }]
        },
        {
            category: "Context variables",
            name: "**f**: Frame number",
            description: "Simply returns the current frame number. You can use it in any expression. Here, from frame 50 onwards, we use it in a modulus expression to reset it every 10 frames.",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'f', },
                    { frame: 50, translation_z_i: 'f%10', },
                    { frame: 99, },
                ]
            }]
        },
        {
            category: "Context variables",
            name: "**k**: Frames since last active keyframe",
            description: "The number of frames since the current active keyframe. An active keyframe for this field is a keyframe that has an explicit value for this field.",
            examples: [{
                description: "Here we see that 0, 15, 80 and 99 are active keyframes, but 30 is not. Note that the value field is overridden with `k`, so the actual values in the value column have no effect.",
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'k', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }],
        },
        {
            category: "Context variables",
            name: "**active_keyframe**: Frame number of the current active keyframe",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'active_keyframe', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }],
        },
        {
            category: "Context variables",
            name: "**next_keyframe**: Frame number of the next active keyframe",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'next_keyframe', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }],
        },
        {
            category: "Context variables",
            name: "**active_keyframe_value**: The value specified at the current active keyframe",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'active_keyframe_value', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }],
        },
        {
            category: "Context variables",
            name: "**next_keyframe_value**: The value specified at the next active keyframe",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'next_keyframe_value', },
                    { frame: 15, translation_z: 500, },
                    { frame: 30, },
                    { frame: 80, translation_z: 600, },
                    { frame: 99, translation_z: 1000, },
                ]
            }],
        },
        {
            category: "Context variables",
            name: "**final_frame**: the last frame",
            examples: [{
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'final_frame', },
                    { frame: 99, },
                ],
            },
            {
                description: "Make something happen half-way through the animation, regardless of the length.",
                keyframeOverrides: [
                    { frame: 0, translation_z: 0, translation_z_i: 'if (f < final_frame/2) L else (L+sin(p=2b, a=20))', },
                    { frame: 99, translation_z: 100 },
                ],
            }],
        },        
        {
            category: "Context variables",
            name: "**prev_computed_value**: Value computed at the previous frame.",
            description: "Allows you to express the value of the current frame relative to the previous frame. Value on frame 0 is the default value for this field. Equivalent to `computed_at(f-1)`",
            examples: [
                {
                    description: "Increment by 1 on every frame",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'prev_computed_value + 1' },
                    ]
                },
                {
                    description: "Increment by an oscillating amount on every frame",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'prev_computed_value + sin(p=4b, c=1)' },
                    ]
                }                
            ],
        },
        {
            category: "Oscillators",
            name: "**sin()**: sinusoidal oscillator",
            function_ref: functionLibrary.sin,
            examples: [{
                description: "A simple sinusoidal oscillator with an 8 beat period",
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'sin(p=8b, a=100)', }
                ]
            },
            {
                description: "A sinusoidal oscillator with an 8 beat period, phase shifted by a half beat",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z_i: 'sin(p=8b, ps=2b, a=100)',
                }]
            }, {
                description: "Raising a sine wave to a power to create sharper dips/bumps.",
                keyframeOverrides: [
                    { frame: 0, translation_z_i: '(sin(p=4b, a=1)^7)*100', }
                ]
            }]
        },
        {
            category: "Oscillators",
            name: "**sq()**: square wave oscillator",
            function_ref: functionLibrary.sq,
            examples: [{
                description: "A simple square wave oscillator with a 4 beat period",
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'sq(p=4b, a=100)', }
                ]
            },
            {
                description: "A square wave oscillator with a 2 beat period and an amplitude defined by the the cubic spline interpolation of the value column",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z: 20,
                    translation_z_i: 'sq(p=2b, a=C)',
                },
                { frame: 15, translation_z: 100, },
                { frame: 30, translation_z: 800, },
                { frame: 80, translation_z: 400, },
                { frame: 99, translation_z: 100, },
                ]
            }]
        },
        {
            category: "Oscillators",
            name: "**tri()**: triangle wave oscillator",
            function_ref: functionLibrary.tri,
            examples: [{
                description: "A simple triangle wave oscillator with a 4 beat period",
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'tri(p=4b, a=100)', }
                ]
            }]
        },
        {
            category: "Oscillators",
            name: "**saw()**: saw tooth oscillator",
            function_ref: functionLibrary.saw,
            examples: [{
                description: "A simple saw tooth oscillator with a 4 beat period",
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'saw(p=4b, a=100)', }
                ]
            }]
        },
        {
            category: "Oscillators",
            name: "**pulse()**: pulse oscillator",
            function_ref: functionLibrary.pulse,
            examples: [{
                description: "A simple pulse oscillator with a 2 beat period",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z_i: 'pulse(p=2b)',
                }]
            },
            {
                description: "A pulse oscillator providing a 1-frame dip every beat.",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z_i: 'S-pulse(p=1b, pw=1f)',
                }]
            },
            {
                description: "Using a pulse oscillator to 'mask' parts of a sinusoidal oscillator.",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z_i: `sin(p=1b)*pulse(p=4b, pw=3b, ps=1b)`,
                }]
            }]
        },
        {
            category: "Curves",
            name: "**bez()**: bezier curve",
            function_ref: functionLibrary.bez,
            examples: [{
                description: "A simple bezier curve between all values in the value column",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z: 20,
                    translation_z_i: 'bez()',
                },
                { frame: 15, translation_z: 100, },
                { frame: 30, translation_z: 800, },
                { frame: 80, translation_z: 400, },
                { frame: 99, translation_z: 100, },
                ]
            },
            {
                description: "Changing the shape of the bezier curve. Supported values are: `easeIn`, `easeOut`, `easeInOut`, `easeIn1`, `easeOut1`, `easeInOut1 easeIn2`, `easeOut2`, `easeInOut2`, `easeIn3`, `easeOut3`, `easeInOut3`, `easeIn4`, `easeOut4`, `easeInOut4`, `easeIn5`, `easeOut5`, `easeInOut5`, `easeIn6`, `easeOut6`, `easeInOut6`, `easeInCirc`, `easeOutCirc`, `easeInOutCirc`, `easeInBack`, `easeOutBack`, `easeInOutBack`",
                keyframeOverrides: [
                    { frame: 0, translation_z: 20, translation_z_i: 'bez(curve="easeIn6")', },
                    { frame: 15, translation_z: 100, },
                    { frame: 30, translation_z: 800, translation_z_i: 'bez(curve="easeOutBack")', },
                    { frame: 80, translation_z: 400, },
                    { frame: 99, translation_z: 100, },
                ]
            },
            {
                description: "Restarting the bezier curve on every beat by setting the offset to `b%1`, which is the fractional part of the current beat position.",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z_i: `bez(from=0, to=10, os=b%1, c="easeOut6")`,
                }]
            }]
        },
        {
            category: "Curves",
            name: "**slide()**: linear interpolation with scriptable end points",
            function_ref: functionLibrary.slide,
            examples: [{
                description: "Interpolate linearly to the next value, but do so in 10 frames rather than over the whole keyframe gap.",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z: 20,
                    translation_z_i: 'slide(in=10f)',
                },
                { frame: 15, translation_z: 100, },
                { frame: 30, translation_z: 800, },
                { frame: 80, translation_z: 400, },
                { frame: 99, translation_z: 100, },
                ]
            },
            {
                description: "Restarting a slide on every beat by setting the offset to `b%1`, which is the fractional part of the current beat position. Change the targer position of the slide to the current frame number.",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z_i: `slide(from=0, to=f, os=b%1)`,
                }]
            }]
        },
        {
            category: "Noise",
            name: "**rand()**: random number generator",
            function_ref: functionLibrary.rand,
            examples: [
                {
                    description: "This curve will look different every time you reload the page.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'rand()' }]
                },
                {
                    description: "Make the min and max value of the random number generator depend on the value field. Use a fixed seed to guarantee repeatable values.",
                    keyframeOverrides: [
                        { frame: 0, translation_z: 50, translation_z_i: 'rand(min=-S, max=S, seed=1)' },
                        { frame: 25, translation_z: 100, },
                        { frame: 50, translation_z: 200, },
                        { frame: 75, translation_z: 100, },
                        { frame: 99, translation_z: 50, },
                    ]
                },
                {
                    description: "Hold each random value for a beat. Use a fixed seed to guarantee repeatable values.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'rand(n=-100, x=100, h=1b, s=1)' }]
                },
                {
                    description: "Bezier curve from 0 to a random value on every beat.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'bez(from=0, to=rand(n=-100, x=100, h=1b, s=1), os=b%1, c="easeOut6")' }]
                },
            ]
        },
        {
            category: "Noise",
            name: "**smrand()**: smooth random number generator (using simplex noise)",
            function_ref: functionLibrary.smrand,
            examples: [
                {
                    description: "This curve will look different every time you reload the page.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'smrand()' }]
                },
                {
                    description: "Increasingly simplex smooth noise with a fixed seed.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'smrand(sm=1+f/10, s=1)' }]
                },

            ]
        },
        {
            category: "Noise",
            name: "**perlin()**: smooth random number generator (using perlin noise)",
            function_ref: functionLibrary.smrand,
            examples: [
                {
                    description: "This curve will look different every time you reload the page.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'perlin()' }]
                },
                {
                    description: "Increasingly smooth perlin noise with a fixed seed.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'perlin(sm=1+f/10, s=1)' }]
                },

            ]
        },
        {
            category: "Noise",
            name: "**vibe()**: sequence of bezier curves between random values",
            function_ref: functionLibrary.vibe,
            examples: [
                {
                    description: "Curve to a new random point between -100 and 100 on every half beat using the 'easeInOut' curve shape. This curve will look different every time you reload the page.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'vibe(p=0.5b, min=-100, max=100, c="easeInOut")' }]
                }
            ]
        },
        {
            category: "Maths",
            name: "**min()**: minimum of two values",
            function_ref: functionLibrary.min,
            examples: [
                {
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'min(sin(p=4b, a=100), 0)' }]
                }
            ]
        },
        {
            category: "Maths",
            name: "**max()**: maximum of two values",
            function_ref: functionLibrary.max,
            examples: [
                {
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'max(sin(p=4b, a=100), 0)' }]
                }
            ]
        },
        {
            category: "Maths",
            name: "**abs()**: absolute value",
            function_ref: functionLibrary.abs,
            examples: [
                {
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'abs(sin(p=4b, a=100))' }]
                }
            ]
        },
        {
            category: "Maths",
            name: "**round()**: round a value to a chosen precision",
            description: "You can also use ceil() and floor().",
            function_ref: functionLibrary.round,
            examples: [
                {
                    description: "Round the current beat position to the nearest whole number.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'round(b)' }]
                },
                {
                    description: "Round the current beat position down to the nearest whole number.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'floor(b)' }]
                },
                {
                    description: "Round the current beat position up to the nearest whole number.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'ceil(b)' }]
                },
                {
                    description: "Round a sine oscillator to a single decimal place.",
                    keyframeOverrides: [{ frame: 0, translation_z_i: 'round(sin(p=100f),1)' }]
                }
            ]
        },
        {
            category: "Maths",
            name: "**Javascript maths functions**: ",
            description: "You have access to a range of raw Javascript maths functions and constants. See the [the main documentation](https://github.com/rewbs/sd-parseq#javascript-maths-functions) for the full list.",
            examples: [
                {
                    keyframeOverrides: [{ frame: 0, translation_z_i: '_tan(f/10)' }]
                },
                {
                    keyframeOverrides: [{ frame: 0, translation_z_i: '_cos(PI*f/10)' }]
                },
                {
                    keyframeOverrides: [{ frame: 0, translation_z_i: '_atanh(f/100)' }]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match()**: ",
            function_ref: functionLibrary.info_match,
            examples: [
                {
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'info_match("bassdrum")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },

                    ]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match_prev()**: ",
            function_ref: functionLibrary.info_match_prev,
            examples: [
                {
                    description: "Spike for 3 frames after every bassdrum hit.",
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'if (f-info_match_prev("bassdrum")<3) 1 else 0' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },

                    ]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match_next()**: ",
            function_ref: functionLibrary.info_match_next,
            examples: [
                {
                    description: "Spike for 3 frames before every bassdrum hit.",
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'if (info_match_next("bassdrum")>0 and info_match_next("bassdrum")-f<=3) 1 else 0' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },

                    ]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match_count()**: ",
            function_ref: functionLibrary.info_match_count,
            examples: [
                {
                    description: "Count bassdrum hits so far.",
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'info_match_count("bassdrum")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },
                    ]
                },
                {
                    description: "Draw a bezier curve to a point that increases with each bassdrum hit. Notice how we require a value (any value) in the value column to force the formula to recompute. This can be avoided with info_match_progress (see below).",
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'bez(from=20*info_match_count("bassdrum"), to=20*(info_match_count("bassdrum")+1), curve="easeOut6")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, translation_z: 0, info: "bassdrum 2", },
                        { frame: 60, translation_z: 0, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, translation_z: 0, info: "bassdrum 4", },
                        { frame: 99, },
                    ]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match_gap()**: ",
            function_ref: functionLibrary.info_match_gap,
            examples: [
                {
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'info_match_gap("bassdrum")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },
                    ]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match_progress()**: ",
            function_ref: functionLibrary.info_match_progress,
            examples: [
                {
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'info_match_progress("bassdrum")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },
                    ]
                },
                {
                    description: "Draw a bezier curve to a point that increases with each bassdrum hit. Improved version compared to the example under `info_match_count` because no trigger values are required.",
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'bez(from=20*info_match_count("bassdrum"), to=20*(info_match_count("bassdrum")+1), os=info_match_progress("bassdrum"), curve="easeOut6")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, info: "bassdrum 5", },
                    ]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match_since()**: frames since previous match",
            function_ref: functionLibrary.info_match_since,
            examples: [
                {
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'info_match_since("bassdrum")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },
                    ]
                },
                {
                    description: "Hold a value for half a beat after every matching keyframe",
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'if info_match_since("bassdrum")<0.5b 100 else 0 ' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99},
                    ]
                }
            ]
        },
        {
            category: "Info matching",
            name: "**info_match_until()**: frames until next match",
            function_ref: functionLibrary.info_match_until,
            examples: [
                {
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'info_match_until("bassdrum")' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99, },
                    ]
                },
                {
                    description: "Hold a value for half a beat before every matching keyframe",
                    keyframeOverrides: [
                        { frame: 0, info: "bassdrum 1", translation_z_i: 'if info_match_until("bassdrum", 10)<0.5b 100 else 0' },
                        { frame: 15, },
                        { frame: 30, },
                        { frame: 45, info: "bassdrum 2", },
                        { frame: 60, info: "bassdrum 3", },
                        { frame: 75, },
                        { frame: 90, info: "bassdrum 4", },
                        { frame: 99},
                    ]
                }
            ]
        },
        {
            category: "Beats and seconds",
            name: "**Units**: ",
            description: "Parseq's default time unit is the frame, but you can use `s` and `b` suffixes on constants to refer to seconds or beats.",
            examples: [
                {
                    description: "By default constants refer to frames. Here we specify a sine wave with a period of 20 frames",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'sin(p=20)' },
                    ]
                },
                {
                    description: "A sine wave with a period of 1.5 seconds",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'sin(p=1.5s)' },
                    ]
                },
                {
                    description: "A sine wave with a period of 4 beats",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'sin(p=4b)' },
                    ]
                }
            ]
        },
        {
            category: "Beats and seconds",
            name: "**Units conversions**: ",
            description: "If you can't use suffixes on constants, various functions are available to convert between units.",
            examples: [
                {
                    description: "Beats to frames",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'b2f(10)' },
                    ]
                },
                {
                    description: "Frames to beats",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'f2b(10)' },
                    ]
                },
                {
                    description: "Seconds to frames",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 's2f(10)' },
                    ]
                },
                {
                    description: "Frames to seconds",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'f2s(10)' },
                    ]
                },
            ]
        },
        {
            category: "Beats and seconds",
            name: "**start_of_beat()**: return the frame number of the start of the beat.",
            function_ref: functionLibrary.start_of_beat,
            examples: [
                {
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'start_of_beat()' },
                    ]
                }
            ]
        },
        {
            category: "Meta",
            name: "**computed_at()**: return the frame number of the start of the beat.",
            function_ref: functionLibrary.computed_at,
            examples: [
                {
                    description: "Repeat the same random pattern every beat. This pattern will change if you reload the page.",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'if (b<1) rand() else computed_at(f-start_of_beat()) ' },
                    ]
                }
            ]
        },
        {
            category: "Meta",
            name: "**recompute_if()**: compute a value only if a condition is true, else re-use precomputed value.",
            function_ref: functionLibrary.recompute_if,
            examples: [
                {
                    description: "Use a new random value on every 'snare' keyframe.",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'recompute_if(f==info_match_prev("snare"), rand(0, 100))' },
                        { frame: 15, info: "snare 0", },
                        { frame: 30, },
                        { frame: 45, info: "snare 1", },
                        { frame: 60, info: "snare 2", },
                        { frame: 75, },
                        { frame: 90, info: "snare 3", },
                        { frame: 99, info: "snare 4", },
                    ]
                },
                {
                    description: "Bezier to a new random value on every 'snare' keyframe.",
                    keyframeOverrides: [
                        { frame: 0, translation_z_i: 'bez(start=computed_at(info_match_prev("snare")-1,0), delta=recompute_if(f==info_match_prev("snare"), rand(-20,20)), os=info_match_progress("snare"), curve="easeOut3")' },
                        { frame: 15, info: "snare 0", },
                        { frame: 30, },
                        { frame: 45, info: "snare 1", },
                        { frame: 60, info: "snare 2", },
                        { frame: 75, },
                        { frame: 90, info: "snare 3", },
                        { frame: 99, info: "snare 4", },
                    ]
                }
            ]                
        },
        {
            category: "Meta",
            name: "**dangerous()**: access values of other fields",
            description: "**This is an experimental function with no guarantees.** If you use it, be prepared for errors and backwards compatibility issues.",
            function_ref: functionLibrary.dangerous,
            examples: [
                {
                    description: "Make x translation depend on y rotation.",
                    fields: ["rotation_3d_y", "translation_x"],
                    keyframeOverrides: [
                        { frame: 0, rotation_3d_y_i: 'sin(p=50, a=10)', translation_x_i: '-dangerous("rotation_3d_y")*512/90'},
                    ]
                }
            ]
        }
    ]

    const renderDocEntries = () => {

        return _.chain(docEntries)
            .groupBy('category')
            .map((category) => <>
                <Box width={'100%'} sx={{ background: theme.vars.palette.info.main, paddingLeft: '0.5rem', borderRadius: '.3rem' }}>
                    <Typography variant="h4">{category[0].category}</Typography>
                </Box>
                {
                    category.map((entry) => <>
                        <Typography variant="h5"><ReactMarkdown children={entry.name || ""} /></Typography>
                        <Box marginBottom={'1em'} marginLeft={'1em'}>
                            {entry.description && <Typography variant="body1"><ReactMarkdown children={entry.description || ""} /></Typography>}
                            {entry.function_ref && <>
                                <Typography variant="body1"><ReactMarkdown children={entry.function_ref.description || ""} /></Typography>
                                {entry.function_ref.argDefs.length > 0 && <>
                                    <Typography variant="body1">Arguments:</Typography>
                                    <ul style={{ marginTop: 0 }}>
                                        {
                                            entry.function_ref.argDefs
                                                .map((argDef) => <li><Typography fontSize={"0.9em"}><ReactMarkdown>{argToMarkdown(argDef)}</ReactMarkdown></Typography></li>)
                                        }
                                    </ul>
                                </>}
                            </>}
                            <Typography fontWeight={'bold'}>{entry.examples.length > 1 ? 'Examples' : 'Example'}</Typography>
                            <Box marginLeft={'2em'}>
                                {
                                    entry.examples.map((example) => {
                                        const miniParseqConfig = _.cloneDeep(miniParseqDefaults);
                                        miniParseqConfig.keyframes = _.defaultsDeep(example.keyframeOverrides, miniParseqDefaults.keyframes);
                                        if (example.fields) {
                                            miniParseqConfig.fields = example.fields;
                                        }
                                        return <>
                                            <Typography><ReactMarkdown children={example.description || ""} /></Typography>
                                            <MiniParseq {...miniParseqConfig} />
                                        </>;
                                    })
                                }
                            </Box>
                        </Box>
                    </>
                    )}
            </>)
            .value();
    }

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
            <Grid xs={12}>
                <Link href={'/' + (searchParams.get('refDocId') ? '?docId=' + searchParams.get('refDocId') : '')}>⬅️ Home</Link>
            </Grid>
            <Grid padding={2} xs={12}>
                {renderDocEntries()}
            </Grid>
        </Grid>
    </>
}

export default FunctionDoc;