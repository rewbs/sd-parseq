import { Box, Stack } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { AgGridReact } from "ag-grid-react";
import _ from "lodash";
import { useCallback, useRef, useState } from "react";
import { GraphableData, ParseqKeyframe, ParseqKeyframes, ParseqPersistableState, RenderedData } from "./ParseqUI";
import { ParseqGraph } from "./components/ParseqGraph";
import { ParseqGrid } from "./components/ParseqGrid";
import { parseqRender } from "./parseq-renderer";

type MiniParseqProps = {
    keyframes: ParseqKeyframes
    fields: string[]
}

const miniParseqDefaults = {
    fields: ["translation_z"],
    keyframes: [
        {
            "frame": 0,
            "info": "hello",
            "translation_z": (0 as string|number),
            "translation_z_i": 'L'
        },
        {
            "frame": 15,
            "info": "hello",
            "translation_z": 500 ,
            "translation_z_i": ''
        },
        {
            "frame": 30,
            "info": "hello",
            "translation_z": 250 ,
            "translation_z_i": ''
        },
        {
            "frame": 80,
            "info": "hello",
            "translation_z": 600 ,
            "translation_z_i": ''
        },
        {
            "frame": 99,
            "info": "hello",
            "translation_z": 1000,
            "translation_z_i": ''
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
                commonPromptPos: 'append'
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
        <Box width="33%">
            {grid}
        </Box>
        <Box width="33%">
            {graph}
        </Box>
        {/* <Box width="33%">
            {renderedData && <MovementPreview 
                renderedData={renderedData.rendered_frames}
                fps={10}
                height={250}
                width={250}
                />
            }
        </Box> */}
    </Stack>;
}


const Labs = () => {

    const interps = ['L', 'C', 'S', 'bez(c="easeIn1")', 'bez(c="easeIn6")', 'bez(c="easeInOut6")',
        'rand()', 'smrand(20)'];
    const singleValinterps = ['vibe(p=1b, c="easeOut6")'];        

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
                <>
                {
                    interps.slice(0,5).map((interp) => {
                        const miniParseqConfig = _.cloneDeep(miniParseqDefaults);
                        miniParseqConfig.keyframes[0].translation_z_i = interp;
                        return <MiniParseq {...miniParseqConfig} />;
                    })
                }
                {
                    singleValinterps.map((interp) => {
                        const miniParseqConfig = _.cloneDeep(miniParseqDefaults);
                        miniParseqConfig.keyframes[0].translation_z_i = interp;
                        miniParseqConfig.keyframes[1].translation_z = '';
                        miniParseqConfig.keyframes[2].translation_z = '';
                        miniParseqConfig.keyframes[3].translation_z = '';
                        miniParseqConfig.keyframes[4].translation_z = '';
                        return <MiniParseq {...miniParseqConfig} />;
                    })
                }           
                
                </>      

            </Grid>
        </Grid>
    </>
}

export default Labs;