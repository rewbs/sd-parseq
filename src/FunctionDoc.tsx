import { Box, CssBaseline, FormControlLabel, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import Header from "./components/Header";
import { ParseqGrid } from "./components/ParseqGrid";
import { ParseqGraph } from "./components/ParseqGraph";
import { GraphableData, ParseqKeyframe, ParseqKeyframes, ParseqPersistableState, RenderedData } from "./ParseqUI";
import { useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { parseqRender } from "./parseq-renderer";
import _ from "lodash";
import functionLibrary, { ArgDef, ParseqFunction } from "./parseq-lang/parseq-lang-functions";
import MovementPreview from "./components/MovementPreview";
import StyledSwitch from "./components/StyledSwitch";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';


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
    return `${argDef.names.map(n => '`'+n+'`').join("/")} ${argDef.required?'**required**':''}: ${argDef.description} (default: ${argDef.required ? 'none' : argDef.default.toString()}, type: ${argDef.type})`;
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
        keyframeOverrides: ParseqKeyframes,
    }[]
};

const FunctionDoc = () => {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchParams, setSearchParams] = useSearchParams();


    const docEntries: DocEntry[] = [
        {
            category: "Context variables",
            name: "**L**: linear interpolation",
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
            name: "**C**: cubic spline interpolation",
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
            category: "Oscillators",
            name: "**sin()**: sinusoidal oscillator",
            function_ref: functionLibrary.sin,
            examples: [{
                description: "A simple sinusoidal oscillator with 2 beat period",
                keyframeOverrides: [
                    { frame: 0, translation_z_i: 'sin(p=8b, a=100)', }
                ]
            },
            {
                description: "A sinusoidal oscillator with 2 beat period, phase shifted by a half beat",
                keyframeOverrides: [{
                    frame: 0,
                    translation_z_i: 'sin(p=8b, ps=2b, a=100)',
                }]
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
            }]
        },
    ]

    const renderDocEntries = () => {

        return _.chain(docEntries)
            .groupBy('category')
            .map((category) => <>
                <Box width={'100%'} sx={{background: 'lightblue', paddingLeft: '0.5rem', borderRadius: '.3rem'}}>
                    <Typography variant="h4">{category[0].category}</Typography>
                </Box>
                {
                    category.map((entry) => <>
                        <Typography variant="h5"><ReactMarkdown children={entry.name||""} /></Typography>
                        <Box marginBottom={'1em'} marginLeft={'1em'}>
                        {entry.description && <Typography variant="body1"><ReactMarkdown children={entry.description||""} /></Typography> }
                        {entry.function_ref && <>
                            <Typography variant="body1"><ReactMarkdown children={entry.function_ref.description||""} /></Typography>
                            { entry.function_ref.argDefs.length > 0 && <>
                            <Typography variant="body1">Arguments:</Typography>
                            <ul style={{marginTop:0}}>
                                {
                                    entry.function_ref.argDefs
                                        .map((argDef) => <li><Typography fontSize={"0.9em"}><ReactMarkdown>{argToMarkdown(argDef)}</ReactMarkdown></Typography></li>)
                                }
                            </ul> 
                            </>}
                        </>}
                        <Typography fontWeight={'bold'}>{entry.examples.length>1?'Examples':'Example'}</Typography>
                        <Box marginLeft={'2em'}>
                            {
                                entry.examples.map((example) => {
                                    const miniParseqConfig = _.cloneDeep(miniParseqDefaults);
                                    miniParseqConfig.keyframes = _.defaultsDeep(example.keyframeOverrides, miniParseqDefaults.keyframes);
                                    console.log(miniParseqConfig);
                                    return <>
                                        <Typography><ReactMarkdown children={example.description||""} /></Typography>
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
        <Header title="Parseq Live Docs" />
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
            </Grid>
            <Grid padding={2} xs={12}>
                {renderDocEntries()}
            </Grid>
        </Grid>
    </>
}

export default FunctionDoc;