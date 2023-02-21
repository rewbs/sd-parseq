import { Box, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, MenuItem, Tooltip, Typography } from "@mui/material";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { Stack } from '@mui/system';
import { Timeline, TimelineEffect, TimelineRow } from '@xzdarcy/react-timeline-editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface PromptsProps {
    initialPrompts: ParseqPrompts,
    lastFrame: number,
    afterBlur: (event: any) => void,
    afterChange: (event: any) => void
}

export function Prompts(props: PromptsProps) {

    const convertPrompts = useCallback((initialPrompts: ParseqPrompts): AdvancedParseqPrompts => {
        if (!initialPrompts) {
            return [{
                name: 'Prompt 1',
                positive: "",
                negative: "",
                allFrames: true,
                from: 0,
                to: props.lastFrame,
                overlap: {
                    inFrames: 0,
                    outFrames: 0,
                    type: "none",
                    custom: "prompt_weight_1",
                }
            }]
        } else if (!Array.isArray(initialPrompts)) {
            return [{
                name: 'Prompt 1',
                positive: initialPrompts.positive,
                negative: initialPrompts.negative,
                allFrames: true,
                from: 0,
                to: props.lastFrame,
                overlap: {
                    inFrames: 0,
                    outFrames: 0,
                    type: "none",
                    custom: "prompt_weight_1",
                }
            }]
        } else {
            return initialPrompts as AdvancedParseqPrompts;
        }
    }, [props]);

    const [prompts, setPrompts] = useState<AdvancedParseqPrompts>(convertPrompts(props.initialPrompts));
    const [quickPreviewPosition, setQuickPreviewPosition] = useState(0);
    const [quickPreview, setQuickPreview] = useState("");

    const promptInput = useCallback((index: number, positive: boolean) => {
        return <TextField
            multiline
            minRows={2}
            maxRows={16}
            fullWidth={true}
            style={{ paddingRight: '20px' }}
            label={(positive ? "Positive" : "Negative") + " " + prompts[index]?.name?.toLowerCase()}
            value={positive ? prompts[index]?.positive : prompts[index]?.negative}
            InputProps={{ style: { fontSize: '0.7em', fontFamily: 'Monospace', color: positive ? 'DarkGreen' : 'Firebrick' } }}
            onBlur={(e: any) => props.afterBlur(e)}
            onChange={(e: any) => {
                if (positive) {
                    prompts[index].positive = e.target.value;
                } else {
                    prompts[index].negative = e.target.value;
                }
                setPrompts([...prompts]);
            }}
            InputLabelProps={{ shrink: true, style: { fontSize: '0.9em' } }}
            size="small"
            variant="outlined" />
    }, [prompts, props]);

    const addPrompt = useCallback(() => {
        const newIndex = prompts.length;
        let nameNumber = newIndex + 1;
        //eslint-disable-next-line no-loop-func
        while (prompts.some(prompt => prompt.name === 'Prompt ' + nameNumber)) {
            nameNumber++;
        }

        setPrompts([
            ...prompts,
            {
                positive: "",
                negative: "",
                from: Math.min(props.lastFrame, prompts[newIndex - 1].to + 1),
                to: Math.min(props.lastFrame, prompts[newIndex - 1].to + 50),
                allFrames: false,
                name: 'Prompt ' + nameNumber,
                overlap: {
                    inFrames: 0,
                    outFrames: 0,
                    type: "none",
                    custom: "prompt_weight_" + nameNumber,
                }
            }
        ]);
    }, [prompts, props.lastFrame]);

    const delPrompt = useCallback((idxToDelete: number) => {
        setPrompts(prompts.filter((_, idx) => idx !== idxToDelete));
    }, [prompts]);


    const displayFadeOptions = useCallback((promptIdx: number) => {
        const prompt = prompts[promptIdx];
        return <>
            <Tooltip arrow placement="top" title="Specify how this prompt will be weighted if it overlaps with other prompts.">
                <TextField
                    select
                    fullWidth={false}
                    size="small"
                    style={{ width: '7em', marginLeft: '5px' }}
                    label={"Overlap weight: "}
                    InputLabelProps={{ shrink: true, }}
                    InputProps={{ style: { fontSize: '0.75em' } }}
                    value={prompt.overlap.type}
                    onChange={(e: any) => {
                        const newPrompts = prompts.slice(0);
                        newPrompts[promptIdx].overlap.type = (e.target.value as OverlapType);
                        setPrompts(newPrompts);
                    }}
                    onBlur={(e: any) => props.afterBlur(e)}
                >
                    <MenuItem value={"none"}>Fixed</MenuItem>
                    <MenuItem value={"linear"}>Linear fade </MenuItem>
                    <MenuItem value={"custom"}>Custom</MenuItem>
                </TextField>
            </Tooltip>
            <Tooltip arrow placement="top" title="Length of fade-in (frames).">
                <TextField
                    type="number"
                    size="small"
                    style={{ paddingBottom: '0px', width: '5em', display: prompt.overlap.type !== "linear" ? "none" : "" }}
                    label={"In"}
                    disabled={prompt.overlap.type === "none"}
                    inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                    InputLabelProps={{ shrink: true, }}
                    value={prompt.overlap.inFrames}
                    onChange={(e) => {
                        const newPrompts = prompts.slice(0);
                        newPrompts[promptIdx].overlap.inFrames = parseInt(e.target.value);
                        setPrompts(newPrompts);
                    }}
                    onBlur={(e) => {
                        if (parseInt(e.target.value) > (prompts[promptIdx].to - prompts[promptIdx].from)) {
                            const newPrompts = prompts.slice(0);
                            newPrompts[promptIdx].overlap.inFrames = (prompts[promptIdx].to - prompts[promptIdx].from);
                            setPrompts(newPrompts);
                        }
                        if (parseInt(e.target.value) < 0) {
                            const newPrompts = prompts.slice(0);
                            newPrompts[promptIdx].overlap.inFrames = 0;
                            setPrompts(newPrompts);
                        }
                        props.afterBlur(e);
                    }}
                />
            </Tooltip>
            <Tooltip arrow placement="top" title="Length of fade-out (frames)">
                <TextField
                    type="number"
                    size="small"
                    style={{ paddingBottom: '0px', width: '5em', display: prompt.overlap.type !== "linear" ? "none" : "" }}
                    label={"Out"}
                    disabled={prompt.overlap.type === "none"}
                    inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                    InputLabelProps={{ shrink: true, }}
                    value={prompt.overlap.outFrames}
                    onChange={(e) => {
                        const newPrompts = prompts.slice(0);
                        newPrompts[promptIdx].overlap.outFrames = parseInt(e.target.value);
                        setPrompts(newPrompts);
                    }}
                    onBlur={(e) => {
                        if (parseInt(e.target.value) > (prompts[promptIdx].to - prompts[promptIdx].from)) {
                            const newPrompts = prompts.slice(0);
                            newPrompts[promptIdx].overlap.outFrames = (prompts[promptIdx].to - prompts[promptIdx].from);
                            setPrompts(newPrompts);
                        }
                        if (parseInt(e.target.value) < 0) {
                            const newPrompts = prompts.slice(0);
                            newPrompts[promptIdx].overlap.outFrames = 0;
                            setPrompts(newPrompts);
                        }
                        props.afterBlur(e);
                    }}
                />
            </Tooltip>
            <Tooltip arrow placement="top" title="If fade mode is custom, the weight during the fade will be the result of the parseq formula you specify here.">
                <TextField
                    type="string"
                    size="small"
                    style={{ marginLeft: '10px', display: prompt.overlap.type !== "custom" ? "none" : "" }}
                    label={"Custom formula"}
                    disabled={prompt.overlap.type !== "custom"}
                    inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                    InputLabelProps={{ shrink: true, }}
                    value={prompt.overlap.custom}
                    onChange={(e) => {
                        const newPrompts = prompts.slice(0);
                        newPrompts[promptIdx].overlap.custom = e.target.value;
                        setPrompts(newPrompts);
                    }}
                    onBlur={(e: any) => props.afterBlur(e)}
                />
            </Tooltip>
        </>
    }, [prompts, props]);


    const displayPrompts = useCallback((advancedPrompts: AdvancedParseqPrompts) =>
        <Grid container>
            {
                advancedPrompts.map((prompt, idx) => <>
                    <Box key={"prompt-"+idx} sx={{ width: '100%', padding: 0, marginTop: 2, marginRight: 2, border: 0, backgroundColor: 'rgb(250, 249, 246)', borderRadius: 1 }} >
                        <Grid xs={12} style={{ padding: 0, margin: 0, border: 0 }}>

                            <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center', width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center', width: '75%' }}>
                                    <h5>{prompt.name} –</h5>
                                    <Tooltip arrow placement="top" title="Make this prompt active for the whole animation">
                                        <FormControlLabel
                                            style={{ fontSize: '0.75em', paddingLeft: '10px' }}
                                            control={
                                                <Checkbox
                                                    checked={prompt.allFrames}
                                                    onChange={(e) => {
                                                        const newPrompts = prompts.slice(0);
                                                        newPrompts[idx].allFrames = e.target.checked;
                                                        setPrompts(newPrompts);
                                                    }}
                                                    size='small' />
                                            } label={<Box component="div" fontSize="0.75em">All frames OR</Box>} />
                                    </Tooltip>
                                    <Tooltip arrow placement="top" title="Frame number where this prompt begins">
                                        <TextField
                                            type="number"
                                            size="small"
                                            style={{ paddingBottom: '0px', width: '5em' }}
                                            id={"from" + (idx + 1)}
                                            label={"From"}
                                            disabled={prompt.allFrames}
                                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                                            InputLabelProps={{ shrink: true, }}
                                            value={prompt.from}
                                            onChange={(e) => {
                                                const newPrompts = prompts.slice(0);
                                                newPrompts[idx].from = parseInt(e.target.value);
                                                setPrompts(newPrompts);
                                            }}
                                            onBlur={(e) => {
                                                if (parseInt(e.target.value) >= prompts[idx].to) {
                                                    const newPrompts = prompts.slice(0);
                                                    newPrompts[idx].from = newPrompts[idx].to;
                                                    setPrompts(newPrompts);
                                                }
                                                if (parseInt(e.target.value) > props.lastFrame) {
                                                    const newPrompts = prompts.slice(0);
                                                    newPrompts[idx].to = props.lastFrame;
                                                    setPrompts(newPrompts);
                                                }
                                                props.afterBlur(e);
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip arrow placement="top" title="Frame number where this prompt ends">
                                        <TextField
                                            type="number"
                                            size="small"
                                            style={{ paddingBottom: '0px', width: '5em' }}
                                            id={"to" + (idx + 1)}
                                            label={"To"}
                                            disabled={prompt.allFrames}
                                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                                            InputLabelProps={{ shrink: true, }}
                                            value={prompt.to}
                                            onChange={(e) => {
                                                const newPrompts = prompts.slice(0);
                                                newPrompts[idx].to = parseInt(e.target.value);
                                                setPrompts(newPrompts);
                                            }}
                                            onBlur={(e) => {
                                                if (parseInt(e.target.value) <= prompts[idx].from) {
                                                    const newPrompts = prompts.slice(0);
                                                    newPrompts[idx].to = newPrompts[idx].from;
                                                    setPrompts(newPrompts);
                                                }
                                                if (parseInt(e.target.value) > props.lastFrame) {
                                                    const newPrompts = prompts.slice(0);
                                                    newPrompts[idx].to = props.lastFrame;
                                                    setPrompts(newPrompts);
                                                }
                                                props.afterBlur(e);
                                            }}
                                        />
                                    </Tooltip>
                                    {displayFadeOptions(idx)}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center', paddingRight: '15px', width: '25%' }}>
                                    <Button
                                        disabled={prompts.length < 2}
                                        size="small"
                                        variant="outlined"
                                        color='warning'
                                        style={{ marginLeft: '40px', float: 'right', fontSize: '0.75em' }}
                                        onClick={(e) => delPrompt(idx)}>
                                        ❌ Delete prompt
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid container xs={12} style={{ margin: 0, padding: 0 }}>
                            <Grid xs={6} style={{ margin: 0, padding: 0 }}>
                                {promptInput(idx, true)}
                            </Grid>
                            <Grid xs={6} style={{ margin: 0, padding: 0 }}>
                                {promptInput(idx, false)}
                            </Grid>
                        </Grid>
                    </Box>
                </>)
            }
        </Grid>
        , [delPrompt, promptInput, prompts, props, displayFadeOptions]);


    const [openSpacePromptsDialog, setOpenSpacePromptsDialog] = useState(false);
    const [spacePromptsLastFrame, setSpacePromptsLastFrame] = useState(props.lastFrame);
    const [spacePromptsOverlap, setSpacePromptsOverlap] = useState(0);

    // TODO: Not sure why this is necessary, but without it, spacePromptsLastFrame doesn't update when new props are passed in.
    // I thought it would always re-evaluate.
    useEffect(() => {
        setSpacePromptsLastFrame(props.lastFrame);
    }, [props]);

    const handleCloseSpacePromptsDialog = useCallback((e: any): void => {
        setOpenSpacePromptsDialog(false);

        const span = (spacePromptsLastFrame + 1) / prompts.length;
        const newPrompts = prompts.map((p, idx) => {
            const newPrompt = { ...p };
            newPrompt.from = Math.max(0, Math.ceil(idx * span) - spacePromptsOverlap);
            newPrompt.to = Math.floor((idx + 1) * span);
            newPrompt.allFrames = false;
            newPrompt.overlap.type = spacePromptsOverlap > 0 ? 'linear' : 'none';
            newPrompt.overlap.inFrames = newPrompt.from <= 0 ? 0 : spacePromptsOverlap;
            newPrompt.overlap.outFrames = newPrompt.to >= props.lastFrame ? 0 : spacePromptsOverlap;
            return newPrompt;
        });
        setPrompts(newPrompts);

    }, [prompts, spacePromptsLastFrame, spacePromptsOverlap, props.lastFrame]);
    const spacePromptsDialog = <Dialog open={openSpacePromptsDialog} onClose={handleCloseSpacePromptsDialog}>
        <DialogTitle>↔️ Evenly space prompts </DialogTitle>
        <DialogContent>
            <DialogContentText>
                Space all {prompts.length} prompts evenly across the entire video, with optional fade between prompts.
                <br />

            </DialogContentText>
            <TextField
                type="number"
                size="small"
                style={{ marginTop: '10px', display: 'none' }}
                label={"Last frame"}
                inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                InputLabelProps={{ shrink: true, }}
                value={spacePromptsLastFrame}
                onChange={(e) => { setSpacePromptsLastFrame(parseInt(e.target.value)); }}
            />
            <TextField
                type="number"
                size="small"
                style={{ marginTop: '10px', width: '5em' }}
                label={"Fade frames"}
                inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                InputLabelProps={{ shrink: true, }}
                value={spacePromptsOverlap}
                onChange={(e) => { setSpacePromptsOverlap(parseInt(e.target.value)); }}
            />
            <Typography><small>This will overwrite the "From", "To" and "Fade" fields of all prompts.</small></Typography>
        </DialogContent>
        <DialogActions>
            <Button size="small" id="cancel_space" onClick={handleCloseSpacePromptsDialog}>Cancel</Button>
            <Button size="small" variant="contained" id="space" onClick={handleCloseSpacePromptsDialog}>↔️ Space</Button>
        </DialogActions>
    </Dialog>


    // Call the parent's callback on every prompt change
    useEffect(() => {
        props.afterChange(prompts);
    }, [prompts, props]);

    const [timelineWidth, setTimelineWidth] = useState(600);
    const timelineRef = useRef<any>(null);
    const timeline = useMemo(() => {
        const data: TimelineRow[] = prompts.map((p, idx) => ({
            id: idx.toString(),
            actions: [
                {
                    id: p.name,
                    start: p.allFrames ? 0 : p.from,
                    end: p.allFrames ? props.lastFrame : p.to,
                    effectId: "effect0",
                },
            ],

        }));

        const effects: Record<string, TimelineEffect> = {
            effect0: {
                id: "effect0",
                name: "Zero",
            },
            effect1: {
                id: "effect1",
                name: "One",
            },
        };

        // scale to 1/25th of frame length and round to nearest 5 
        const scale = Math.ceil(props.lastFrame / 25 / 5) * 5;
        const scaleWidth = timelineWidth / ((props.lastFrame * 1.1) / scale);
        //console.log("re-rendering with", timelineWidth, scale, scaleWidth);

        return (
            <span ref={timelineRef}>
                <Timeline
                    style={{ height: (50 + Math.min(prompts.length, 4) * 25) + 'px', width: '100%' }}
                    editorData={data}
                    effects={effects}
                    scale={scale}
                    scaleWidth={scaleWidth}
                    rowHeight={15}
                    gridSnap={true}
                    disableDrag={true}
                    //maxScaleCount={props.lastFrame*1.1}
                    getActionRender={(action: any, row: any) => {
                        return <div style={{ borderRadius: '5px', marginTop: '1px', overflow: 'hidden', maxHeight: '15px', backgroundColor: 'rgba(125,125,250,0.5)' }}>
                            <Typography paddingLeft={'5px'} color={'white'} fontSize='0.7em'>
                                {`${action.id}: ${action.start.toFixed(0)}-${action.end.toFixed(0)}`}
                            </Typography>
                        </div>
                    }}
                    getScaleRender={(scale: number) => scale < props.lastFrame ?
                        <Typography fontSize={'0.75em'}>{scale}</Typography>
                        : scale === props.lastFrame ?
                            <Typography fontSize={'0.75em'} color='orange'>{scale}</Typography>
                            : <Typography fontSize={'0.75em'} color='red'>{scale}</Typography>}
                    onCursorDrag={(e: any) => {
                        setQuickPreviewPosition(Math.round(e));
                    }}
                    onClickTimeArea={(time: number, e: any): boolean => {
                        setQuickPreviewPosition(Math.round(time));
                        return true;
                    }}
                />
            </span>
        );

    }, [prompts, props, timelineWidth]);

    useEffect((): any => {
        function handleResize() {
            setTimelineWidth(timelineRef.current.offsetWidth);
            //console.log("resized to", timelineRef.current.offsetWidth);
        }
        window.addEventListener('resize', handleResize)

        return (_: any) => window.removeEventListener('resize', handleResize);

    }, []);


    // type Overlap = {
    //     from: number,
    //     to: number,
    //     fadeOuts: Set<AdvancedParseqPrompt>
    //     fadeIns: Set<AdvancedParseqPrompt>
    //     transients: Set<AdvancedParseqPrompt>
    //     constants: Set<AdvancedParseqPrompt>
    // }

    // // const findOverlaps = (): Overlap[] => {


    //     let inOverlap = false;
    //     let newOverlap: Overlap = {
    //         from: -1,
    //         to: -1,
    //         fadeOuts: new Set(),
    //         fadeIns: new Set(),
    //         transients: new Set(),
    //         constants: new Set()
    //     }
    //     let overlaps: Overlap[] = [];
    //     for (let f = 0; f <= props.lastFrame; f++) {
    //         const activePrompts = prompts.filter(p => p.allFrames || (f >= p.from && f <= p.to));
    //         if (activePrompts.length > 1 && !inOverlap) {
    //             // new overlap
    //             inOverlap = true;
    //             const frameBeforeOverlap = Math.max(0, f - 1);
    //             newOverlap = {
    //                 from: f,
    //                 to: -1,
    //                 fadeOuts: new Set(),
    //                 fadeIns: new Set(),
    //                 transients: new Set(),
    //                 constants: new Set()
    //             }
    //         } else if ((activePrompts.length <= 1 || f === props.lastFrame) && inOverlap) {
    //             // end of overlap
    //             newOverlap.to = f;
    //             overlaps.push(newOverlap);
    //         }
    //     }

    //     overlaps = overlaps.map(o => ({
    //         from: o.from,
    //         to: o.to,
    //         fadeOuts: new Set(prompts.filter(p => p.from < o.from && p.to <= o.to)),
    //         fadeIns: new Set(prompts.filter(p => p.from >= o.from && (p.to > o.to || p.to === props.lastFrame))),
    //         transients: new Set(prompts.filter(p => p.from > o.from && p.to < o.to)),
    //         constants: new Set(prompts.filter(p => p.from <= o.from && p.to >= o.to)),
    //     }));

    //     return overlaps;
    // }

    // update the quick preview if prompts, 
    useEffect(() => {
        const f = quickPreviewPosition;
        const activePrompts = prompts
            .filter(p => p.allFrames || (f >= p.from && f <= p.to));

        let preview = '';
        if (activePrompts.length === 0) {
            preview = '⚠️ No prompt';
        } else if (activePrompts.length === 1) {
            preview = activePrompts[0].name.replace(' ', '_');
        } else {
            preview = activePrompts
                .map(p => `${p.name.replace(' ', '_')} : ${calculateWeight(p, f, props.lastFrame)}`)
                .join(' AND ');
        }

        setQuickPreview(preview);
    }, [prompts, quickPreviewPosition, props.lastFrame]);

    return <Grid xs={12} container style={{ margin: 0, padding: 0 }}>
        {displayPrompts(prompts)}
        {spacePromptsDialog}
        <Grid xs={12}>
            <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={addPrompt}>➕ Add prompts</Button>
            <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={() => setOpenSpacePromptsDialog(true)}>↔️ Evenly space prompts</Button>
        </Grid>
        <Grid xs={4} sx={{ paddingRight: '15px' }} >
            <Tooltip title="Quickly see which prompts will be used at each frame, and whether they will be composed. To see the full rendered prompts, use the main preview below." >
                <Stack>
                    <TextField
                        multiline
                        minRows={2}
                        maxRows={16}
                        size="small"
                        fullWidth={true}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: true, style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        value={quickPreview}
                        label={`Quick preview [frame ${quickPreviewPosition}]`}
                        variant="outlined"
                    />
                </Stack>
            </Tooltip>
        </Grid>
        <Grid xs={8}>
            {timeline}
        </Grid>
    </Grid>

}


export function calculateWeight(p: AdvancedParseqPrompt, f: number, lastFrame: number) {

    switch (p.overlap.type) {
        case "linear":
            const promptStart = p.allFrames ? 0 : p.from;
            const promptEnd = p.allFrames ? lastFrame : p.to;
            if (p.overlap.inFrames && f < (promptStart + p.overlap.inFrames)) {
                const fadeOffset = f - promptStart;
                const fadeRatio = fadeOffset / p.overlap.inFrames;
                return fadeRatio.toPrecision(4);
            } else if (p.overlap.outFrames && f > (promptEnd - p.overlap.outFrames)) {
                const fadeOffset = f - (promptEnd - p.overlap.outFrames);
                const fadeRatio = fadeOffset / p.overlap.outFrames;
                return (1 - fadeRatio).toPrecision(4);
            } else {
                return '1';
            }
        case "custom":
            return "${" + p.overlap.custom + "}";
        default:
            return '1';
    }

}

