import { Box, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Slider, Tooltip } from "@mui/material";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { Stack } from '@mui/system';
import { useCallback, useEffect, useState } from 'react';

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
                positive: "",
                negative: "",
                allFrames: true,
                from: 0,
                to: props.lastFrame,
                weight: 'prompt_weight_1',
                name: 'Prompt 1'
            }]
        } else if (!Array.isArray(initialPrompts)) {
            return [{
                positive: initialPrompts.positive,
                negative: initialPrompts.negative,
                allFrames: true,
                from: 0,
                to: props.lastFrame,
                weight: 'prompt_weight_1',
                name: 'Prompt 1'
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
                from: prompts[newIndex - 1].to + 1,
                to: prompts[newIndex - 1].to + 50,
                allFrames: false,
                weight: 'prompt_weight_' + nameNumber,
                name: 'Prompt ' + nameNumber
            }
        ]);
    }, [prompts]);

    const delPrompt = useCallback((idxToDelete: number) => {
        setPrompts(prompts.filter((_, idx) => idx !== idxToDelete));
    }, [prompts]);


    const displayPrompts = useCallback((advancedPrompts: AdvancedParseqPrompts) =>
        <>
            {
                advancedPrompts.map((prompt, idx) => <>
                    <Box sx={{ width: '100%', padding: 0, marginTop: 2, marginRight: 2, border: 0, backgroundColor: 'rgb(250, 249, 246)', borderRadius: 1 }} >
                        <Grid xs={12} style={{ padding: 0, margin: 0, border: 0 }}>

                            <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center', width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center', width: '75%' }}>
                                    <h5>{prompt.name} –</h5>
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
                                    />
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
                                    />
                                    <Tooltip title="If this prompt's frame range overlaps with another prompt, they will be combined with Composable Diffusion (AND syntax), with the weight determined by the parseq variable you specify here.">
                                        <TextField
                                            type="string"
                                            size="small"
                                            style={{ marginLeft: '10px' }}
                                            id={"weight_" + (idx + 1)}
                                            label={"Weight on overlap ⓘ"}
                                            disabled={false}
                                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                                            InputLabelProps={{ shrink: true, }}
                                            value={prompt.weight}
                                            onChange={(e) => {
                                                const newPrompts = prompts.slice(0);
                                                newPrompts[idx].weight = e.target.value;
                                                setPrompts(newPrompts);
                                            }}
                                        />
                                    </Tooltip>
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
        </>
        , [delPrompt, promptInput, prompts]);


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
            return newPrompt;
        });
        setPrompts(newPrompts);

    }, [prompts, spacePromptsLastFrame, spacePromptsOverlap]);
    const spacePromptsDialog = <Dialog open={openSpacePromptsDialog} onClose={handleCloseSpacePromptsDialog}>
        <DialogTitle>↔️ Evenly space prompts </DialogTitle>
        <DialogContent>
            <DialogContentText>
                Space all {prompts.length} prompts evenly across the entire video. This will overwrite the "From" and "To" fields of all prompts.
            </DialogContentText>
            <TextField
                type="number"
                size="small"
                style={{ marginTop: '10px' }}
                label={"Last frame"}
                inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                InputLabelProps={{ shrink: true, }}
                value={spacePromptsLastFrame}
                onChange={(e) => { setSpacePromptsLastFrame(parseInt(e.target.value)); }}
            />
            <TextField
                type="number"
                size="small"
                style={{ marginTop: '10px' }}
                label={"Overlap frames"}
                inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                InputLabelProps={{ shrink: true, }}
                value={spacePromptsOverlap}
                onChange={(e) => { setSpacePromptsOverlap(parseInt(e.target.value)); }}
            />
            <p><small>Interval: {(spacePromptsLastFrame + 1) / prompts.length} + {spacePromptsOverlap} overlap</small></p>
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


    // update the quick preview if prompts, 
    useEffect(() => {
        const activePrompts = prompts
            .filter(p => p.allFrames || (quickPreviewPosition >= p.from && quickPreviewPosition <= p.to));

        let preview = '';
        if (activePrompts.length === 0) {
            preview = '⚠️ No prompt';
        } else if (activePrompts.length === 1) {
            preview = activePrompts[0].name;
        } else {
            preview = activePrompts.map(p => `${p.name} : <${p.weight}>`).join(' AND ');
        }

        setQuickPreview(preview);
    }, [prompts, quickPreviewPosition]);

    return <Grid xs={12} container style={{ margin: 0, padding: 0 }}>
        {displayPrompts(prompts)}
        {spacePromptsDialog}
        <Grid xs={3}>
            <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={addPrompt}>➕ Add prompts</Button>
            <Button size="small" variant="outlined" style={{ marginRight: 10 }} onClick={() => setOpenSpacePromptsDialog(true)}>↔️ Evenly space prompts</Button>
        </Grid>
        <Grid xs={9} sx={{ paddingRight: '15px' }} >
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
                    <Slider
                        size="small"
                        step={1}
                        value={quickPreviewPosition}
                        min={0}
                        max={props.lastFrame}
                        onChange={(e: any) => setQuickPreviewPosition(e.target?.value)}
                        valueLabelDisplay="auto" />
                </Stack>
            </Tooltip>
        </Grid>
    </Grid>

}


