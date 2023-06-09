import { Box, CssBaseline, Stack } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import Header from "./components/Header";
import { ParseqGrid } from "./components/ParseqGrid";
import { ParseqGraph } from "./components/ParseqGraph";
import { GraphableData, ParseqKeyframe, ParseqKeyframes, ParseqPersistableState, RenderedData } from "./ParseqUI";
import { useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { parseqRender } from "./parseq-renderer";
import _ from "lodash";

type MiniParseqProps = {
    keyframes: ParseqKeyframes
    fields: string[]
}

const miniParseqDefaults = {
    fields: ["example"],
    keyframes: [
        {
            "frame": 0,
            "info": "hello",
            "example": (0 as string|number),
            "example_i": 'L'
        },
        {
            "frame": 15,
            "info": "hello",
            "example": 0.5 ,
            "example_i": ''
        },
        {
            "frame": 30,
            "info": "hello",
            "example": 0.25 ,
            "example_i": ''
        },
        {
            "frame": 80,
            "info": "hello",
            "example": 0.6 ,
            "example_i": ''
        },
        {
            "frame": 99,
            "info": "hello",
            "example": 1,
            "example_i": ''
        }
    ]
};

const MiniParseq = ({ keyframes, fields }: MiniParseqProps) => {

    const bpm = 120;
    const fps = 20;

    const gridRef = useRef<AgGridReact<ParseqKeyframe>>(null);
    const [renderedData, setRenderedData] = useState<RenderedData | undefined>(undefined);
    const [graphableData, setGraphableData] = useState<GraphableData | undefined>(undefined);

    // useEffect(() => {
    //     gridRef.current!.api.setRowData(keyframes);
    // }, [keyframes, gridRef]);

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


    console.log(renderedData);

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

    return <Stack direction={"row"}>
        <Box width="50%">
            {grid}
        </Box>
        <Box width="50%">
            {graph}
        </Box>
    </Stack>;
}


const Labs = () => {

    const interps = ['L', 'C', 'S', 'bez(c="easeIn1")', 'bez(c="easeIn6")', 'bez(c="easeInOut6")',
        'rand()', 'smrand(20)'];
    const singleValinterps = ['vibe(p=1b)'];        

    return <>
        <Header title="Parseq Labs (experiments)" />
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
                <>
                {
                    interps.map((interp) => {
                        const miniParseqConfig = _.cloneDeep(miniParseqDefaults);
                        miniParseqConfig.keyframes[0].example_i = interp;
                        return <MiniParseq {...miniParseqConfig} />;
                    })
                }
                {
                    singleValinterps.map((interp) => {
                        const miniParseqConfig = _.cloneDeep(miniParseqDefaults);
                        miniParseqConfig.keyframes[0].example_i = interp;
                        miniParseqConfig.keyframes[1].example = '';
                        miniParseqConfig.keyframes[2].example = '';
                        miniParseqConfig.keyframes[3].example = '';
                        miniParseqConfig.keyframes[4].example = '';
                        return <MiniParseq {...miniParseqConfig} />;
                    })
                }
                </>      

            </Grid>
        </Grid>
    </>
}

export default Labs;