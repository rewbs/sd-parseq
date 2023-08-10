/* eslint-disable react/jsx-no-target-blank */
import React, { useMemo, FC, useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Tabs,
    Tab,
    DialogContentText,
    TextField,
    DialogActions,
    Button,
    MenuItem,
    Typography,
    Box,
    Stack,
    Alert,
    Link,
} from '@mui/material';
import { TabPanel } from './TabPanel';
import { SmallTextField } from './SmallTextField';
import { ParseqKeyframe } from '../ParseqUI';
import { findMatchingKeyframes, unique } from '../utils/utils';
import { frameToXAxisType, xAxisTypeToFrame } from '../utils/maths';
import * as _ from 'lodash';
import { parse } from '../parseq-lang/parseq-lang-parser';
import { InvocationContext } from '../parseq-lang/parseq-lang-ast';
import { SupportedColorScheme, experimental_extendTheme as extendTheme, useColorScheme } from "@mui/material/styles";
import { themeFactory } from '../theme';

interface AddKeyframesDialogProps {
    keyframes: ParseqKeyframe[];
    initialFramesToAdd: number[];
    fps: number;
    bpm: number;
    lastFrame: number;
    addKeyframes: (frames: number[]) => void;
}

export const AddKeyframesDialog: FC<AddKeyframesDialogProps> = ({
    keyframes,
    initialFramesToAdd,
    fps,
    bpm,
    lastFrame,
    addKeyframes,
}) => {

    const [openAddKeyframesDialog, setOpenAddKeyframesDialog] = useState(false);
    const [addKeyframesTab, setAddKeyframesTab] = useState(1);

    const [framesToAddList, setFramesToAddList] = useState(initialFramesToAdd.join(', '));
    const [xaxisType, setXAxisType] = useState<"frames" | "seconds" | "beats">("frames");
    const [interval, setInterval] = useState(String(Math.round(lastFrame / 10)));
    const [start, setStart] = useState("0");
    const [end, setEnd] = useState(String(lastFrame));

    const theme = extendTheme(themeFactory());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {colorScheme, setColorScheme }  = useColorScheme();
    const palette = theme.colorSchemes[(colorScheme||'light') as SupportedColorScheme].palette;

    function handleCloseAddKeyframesDialog(event: any): void {
        setOpenAddKeyframesDialog(false);
        if (event?.target?.id === "add") {
            addKeyframes(framesToAdd);
        }
    }

    const framesToAdd = useMemo(() => {
        let unitsToAdd: number[] = [];
        if (addKeyframesTab === 1) {
            unitsToAdd = framesToAddList
                .split(',')
                .map((x) => Number(x.trim()))
                .filter(x => !isNaN(x));
        } else if (addKeyframesTab === 2) {
            if (Number(end) <= Number(start) || Number(interval) <= 0) {
                unitsToAdd = [];
            } else {
                unitsToAdd = _.range(Number(start), Number(end), Number(interval))
            }
        }

        const newFramesToAdd = unitsToAdd
            .map((x) => Math.round(xAxisTypeToFrame(x, xaxisType, fps, bpm)))
            .filter(unique)
            .filter((x) => x >= 0)
            .filter((x) => !keyframes.some(kf => kf.frame === x));

        return newFramesToAdd;

    }, [addKeyframesTab, framesToAddList, xaxisType, interval, start, end, keyframes, fps, bpm]);

    const handleChangeUnit = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        // If end is the last frame, keep it that way
        const newXAxisType = e.target.value as 'frames' | 'beats' | 'seconds';
        if (Math.round(xAxisTypeToFrame(Number(end), xaxisType, fps, bpm)) === lastFrame) {
            setEnd(frameToXAxisType(lastFrame, newXAxisType, fps, bpm));
        }

        setXAxisType(newXAxisType);
    };
    return <>
        <Dialog maxWidth='md' fullWidth={true} open={openAddKeyframesDialog} onClose={handleCloseAddKeyframesDialog}>
            <DialogTitle>➕ Add keyframes</DialogTitle>
            <DialogContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={addKeyframesTab} onChange={(_, newValue) => setAddKeyframesTab(newValue)}>
                        <Tab label="At positions" value={1} />
                        <Tab label="At intervals" value={2} />
                    </Tabs>
                </Box>
                <TabPanel activeTab={addKeyframesTab} index={1}>
                    <DialogContentText>
                        Add keyframes at the following positions (comma separated list):
                    </DialogContentText>
                    <Stack direction="row" spacing={1} paddingTop={'1em'}>
                        <TextField
                            select
                            size="small"
                            label="Unit"
                            margin='dense'
                            style={{ marginTop: '0px' }}
                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                            InputLabelProps={{ shrink: true, }}
                            SelectProps={{ style: { fontSize: '0.75em' } }}
                            value={xaxisType}
                            onChange={handleChangeUnit}
                        >
                            <MenuItem key="frames" value="frames">frames</MenuItem>
                            <MenuItem key="seconds" value="seconds">seconds</MenuItem>
                            <MenuItem key="beats" value="beats">beats</MenuItem>
                        </TextField>
                        <SmallTextField
                            label="Positions"
                            placeholder='1,2,3'
                            type="text"
                            InputProps={{ style: { fontSize: "0.75em", fontFamily: "monospace", width: "12em" } }}
                            value={framesToAddList}
                            onChange={(e) => setFramesToAddList(e.target.value)}
                        />
                    </Stack>
                </TabPanel>
                <TabPanel activeTab={addKeyframesTab} index={2}>
                    <DialogContentText>
                        Add keyframes at the following interval between start and end:
                    </DialogContentText>
                    <Stack direction="row" spacing={1} paddingTop={'1em'}>
                        <TextField
                            select
                            size="small"
                            label="Unit"
                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                            InputLabelProps={{ shrink: true, }}
                            SelectProps={{ style: { fontSize: '0.75em' } }}
                            value={xaxisType}
                            onChange={handleChangeUnit}
                        >
                            <MenuItem key="frames" value="frames">frames</MenuItem>
                            <MenuItem key="seconds" value="seconds">seconds</MenuItem>
                            <MenuItem key="beats" value="beats">beats</MenuItem>
                        </TextField>
                        <SmallTextField
                            label="Start"
                            placeholder='1'
                            type="number"
                            value={start}
                            style={{ marginTop: '0px' }}
                            onChange={(e) => setStart(e.target.value)}
                        />
                        <SmallTextField
                            label="End (exclusive)"
                            placeholder='1'
                            type="number"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                        />
                        <SmallTextField
                            label="Interval"
                            placeholder='1'
                            type="number"
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                        />
                    </Stack>

                </TabPanel>
                <DialogContentText overflow={"wrap"}>
                    {framesToAdd.length > 0 && <>
                        <Typography fontSize={"0.75em"} fontStyle={{ color:  palette.success.main }}>
                            Will add {framesToAdd.length} keyframe(s):
                        </Typography>
                        <Typography fontFamily={"monospace"} fontSize={"0.75em"} fontStyle={{ color:  palette.success.main }}>
                            • Frames: {framesToAdd.sort((a, b) => a - b).join(', ')}<br />
                            • Seconds: {framesToAdd.sort((a, b) => a - b).map(f => frameToXAxisType(f, "seconds", fps, bpm)).join(', ')}<br />
                            • Beats: {framesToAdd.sort((a, b) => a - b).map(f => frameToXAxisType(f, "beats", fps, bpm)).join(', ')}<br />
                        </Typography>
                    </>}
                    {framesToAdd.length <= 0 &&
                        <Typography fontSize={"0.75em"} fontStyle={{ color:  palette.success.main }}>
                            No frames to add.
                        </Typography>
                    }

                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button id="cancel_delete" onClick={handleCloseAddKeyframesDialog}>
                    Cancel
                </Button>
                <Button disabled={framesToAdd.length === 0} variant="contained" id="add" onClick={handleCloseAddKeyframesDialog}>
                    ➕ Add
                </Button>

            </DialogActions>
        </Dialog>
        <Button size="small" variant="outlined" onClick={() => setOpenAddKeyframesDialog(true)}>➕ Add</Button>


    </>

}

interface DeleteKeyframesDialogProps {
    fields: string[];
    keyframes: ParseqKeyframe[];
    initialFramesToDelete: number[];
    fps: number;
    bpm: number;
    deleteKeyframes: (frames: number[]) => void;
}

export const DeleteKeyframesDialog: FC<DeleteKeyframesDialogProps> = ({
    fields,
    keyframes,
    initialFramesToDelete,
    fps,
    bpm,
    deleteKeyframes,
}) => {
    const [openDeleteRowDialog, setOpenDeleteRowDialog] = useState(false);
    const [deleteKeyframesTab, setDeleteKeyframesTab] = useState(1);
    const [framesToDeleteList, setFramesToDeleteList] = useState(initialFramesToDelete.join(', '));
    const [deleteMatchField, setDeleteMatchField] = useState('info');
    const [deleteMatchMethod, setDeleteMatchMethod] = useState<'is' | 'regex'>('is');
    const [deleteMatchRegex, setDeleteMatchRegex] = useState('');
    const [deleteMatchFieldType, setDeleteMatchFieldType] = useState<'value' | 'interpolation'>('value');

    const theme = extendTheme(themeFactory());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {colorScheme, setColorScheme }  = useColorScheme();
    const palette = theme.colorSchemes[(colorScheme||'light') as SupportedColorScheme].palette;


    useEffect(() => {
        setFramesToDeleteList(initialFramesToDelete.join(', '));
    }, [initialFramesToDelete]);

    function handleCloseDeleteRowDialog(event: any): void {
        setOpenDeleteRowDialog(false);
        if (event?.target?.id === "delete") {
            deleteKeyframes(framesToDelete);
        }
    }

    const framesToDelete = useMemo(() => {
        let newFramesToDelete: number[] = [];
        if (deleteKeyframesTab === 1) {
            newFramesToDelete = framesToDeleteList
                .split(',')
                .map((x) => x.trim() ? Number(x.trim()) : NaN)
                .filter((x) => keyframes.some(kf => kf.frame === x));
        } else if (deleteKeyframesTab === 2) {
            if (deleteMatchRegex) {
                newFramesToDelete = findMatchingKeyframes(keyframes, deleteMatchRegex, deleteMatchMethod, deleteMatchField,
                    fields.includes(deleteMatchField) ? deleteMatchFieldType : 'value').map((x) => x.frame);
            } else {
                newFramesToDelete = [];
            }
        }

        return newFramesToDelete;
    }, [framesToDeleteList, deleteKeyframesTab, deleteMatchField, deleteMatchFieldType, deleteMatchMethod, deleteMatchRegex, fields, keyframes]);

    return <>
        <Dialog maxWidth='md' fullWidth={true} open={openDeleteRowDialog} onClose={handleCloseDeleteRowDialog}>
            <DialogTitle>❌ Delete keyframes</DialogTitle>
            <DialogContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={deleteKeyframesTab} onChange={(_, newValue) => setDeleteKeyframesTab(newValue)}>
                        <Tab label="Delete" value={1} />
                        <Tab label="Find & delete" value={2} />
                    </Tabs>
                </Box>

                <TabPanel index={1} activeTab={deleteKeyframesTab}>
                    <DialogContentText>
                        Delete the following keyframes (comma separated list):
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ style: { fontSize: '0.75em' } }}
                        margin="dense"
                        label="Keyframes to delete"
                        placeholder='1,2,3'
                        type="text"
                        variant="outlined"
                        value={framesToDeleteList}
                        onChange={(e) => setFramesToDeleteList(e.target.value)}
                    />
                </TabPanel>
                <TabPanel index={2} activeTab={deleteKeyframesTab}>
                    <DialogContentText>
                        Delete keyframes that match the following:
                    </DialogContentText>
                    <Stack direction="row" spacing={1} paddingTop={'1em'}>
                        <TextField
                            select
                            size="small"
                            style={{ paddingBottom: '10px' }}
                            label="Field"
                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                            InputLabelProps={{ shrink: true, }}
                            SelectProps={{ style: { fontSize: '0.75em' } }}
                            value={deleteMatchField}
                            onChange={(e) => setDeleteMatchField(e.target.value)}
                        >
                            <MenuItem key="frame" value="frame">frame</MenuItem>
                            <MenuItem key="info" value="info">info</MenuItem>
                            {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                        </TextField>
                        <TextField
                            select
                            disabled={deleteMatchField === 'frame' || deleteMatchField === 'info'}
                            size="small"
                            style={{ paddingBottom: '10px' }}
                            label="type"
                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                            InputLabelProps={{ shrink: true, }}
                            SelectProps={{ style: { fontSize: '0.75em' } }}
                            value={deleteMatchFieldType}
                            onChange={(e) => setDeleteMatchFieldType(e.target.value as 'value' | 'interpolation')}
                        >
                            <MenuItem key="value" value="value">value</MenuItem>
                            <MenuItem key="interpolation" value="interpolation">interpolation</MenuItem>
                        </TextField>
                        <TextField
                            select
                            size="small"
                            style={{ paddingBottom: '10px' }}
                            label="method"
                            inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                            InputLabelProps={{ shrink: true, }}
                            SelectProps={{ style: { fontSize: '0.75em' } }}
                            value={deleteMatchMethod}
                            onChange={(e) => setDeleteMatchMethod(e.target.value as 'is' | 'regex')}
                        >
                            <MenuItem key="is" value="is">is exactly</MenuItem>
                            <MenuItem key="regex" value="regex">matches regex</MenuItem>
                        </TextField>
                        <SmallTextField
                            label={(deleteMatchMethod === "is" ? "value" : "regex") + " to match"}
                            value={deleteMatchRegex}
                            InputProps={{ style: { fontSize: "0.75em", fontFamily: "monospace", width: "18em" } }}
                            onChange={(e) => setDeleteMatchRegex(e.target.value)}
                        />
                    </Stack>
                </TabPanel>
                <DialogContentText overflow={"wrap"}>
                    {framesToDelete.length > 0 && <>
                        <Typography fontSize={"0.75em"} fontStyle={{ color: palette.warning.dark }}>
                            Will delete {framesToDelete.length} keyframe(s):
                        </Typography>
                        <Typography fontFamily={"monospace"} fontSize={"0.75em"} fontStyle={{ color: palette.warning.dark }}>
                            • Frames: {framesToDelete.sort((a, b) => a - b).join(', ')}<br />
                            • Seconds: {framesToDelete.sort((a, b) => a - b).map(f => frameToXAxisType(f, "seconds", fps, bpm)).join(', ')}<br />
                            • Beats: {framesToDelete.sort((a, b) => a - b).map(f => frameToXAxisType(f, "beats", fps, bpm)).join(', ')}<br />
                        </Typography>
                    </>}
                    {framesToDelete.length <= 0 &&
                        <Typography fontSize={"0.75em"}>
                            No frames to delete.
                        </Typography>
                    }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button id="cancel_delete" onClick={handleCloseDeleteRowDialog}>
                    Cancel
                </Button>
                <Button disabled={framesToDelete.length === 0} variant="contained" id="delete" onClick={handleCloseDeleteRowDialog}>
                    ❌ Delete
                </Button>
            </DialogActions>
        </Dialog>
        <Button size="small" variant="outlined" onClick={() => setOpenDeleteRowDialog(true)}>❌ Delete</Button>
    </>
};


interface BulkEditDialogProps {
    keyframes: ParseqKeyframe[];
    fields: string[];
    fps: number;
    bpm: number;
    timeSeries: any;
    editKeyframes: (frames: number[], fieldToUpdate: string, fieldTypeToUpdate: 'value' | 'interpolation', newValue: string) => void;
}

export const BulkEditDialog: FC<BulkEditDialogProps> = ({
    keyframes,
    fields,
    fps,
    bpm,
    timeSeries,
    editKeyframes,
}) => {

    const [openDialog, setOpenDialog] = useState(false);

    const [matchField, setMatchField] = useState('info');
    const [matchMethod, setMatchMethod] = useState<'is' | 'regex'>('is');
    const [matchRegex, setMatchRegex] = useState('');
    const [matchFieldType, setMatchFieldType] = useState<'value' | 'interpolation'>('value');

    const [fieldToUpdate, setFieldToUpdate] = useState('info');
    const [fieldTypeToUpdate, setFieldTypeToUpdate] = useState<'value' | 'interpolation'>('value');
    const [newValue, setNewValue] = useState('');

    const theme = extendTheme(themeFactory());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {colorScheme, setColorScheme }  = useColorScheme();
    const palette = theme.colorSchemes[(colorScheme||'light') as SupportedColorScheme].palette;

    const framesToEdit = useMemo(() => {
        if (matchRegex) {
            return findMatchingKeyframes(keyframes, matchRegex, matchMethod, matchField,
                fields.includes(matchField) ? matchFieldType : 'value').map((x) => x.frame);
        } else {
            return [];
        }
    }, [keyframes, matchField, matchFieldType, matchMethod, matchRegex, fields]);

    function handleCloseDialog(event: any): void {
        setOpenDialog(false);
        if (event?.target?.id === "edit") {
            editKeyframes(framesToEdit, fieldToUpdate, fieldTypeToUpdate, newValue);
        }
    }

    const statusMessage = useMemo(() => {
        if (fields.includes(fieldToUpdate) && newValue) {
            switch (fieldTypeToUpdate) {
                case 'value':
                    return isNaN(Number(newValue.trim())) ? <Alert severity="error">When setting a value, the new value must be a number. Did you mean to set an interpolation formula?</Alert> : <></>
                case 'interpolation':
                    try {
                        const dummyContext: InvocationContext = {
                            frame: 0,
                            FPS: fps,
                            BPM: bpm,
                            activeKeyframe: 0,
                            allKeyframes: keyframes,
                            definedFrames: keyframes.map(kf => kf.frame),
                            definedValues: keyframes.map(kf => kf[fieldToUpdate] as number),
                            fieldName: fieldToUpdate,
                            timeSeries: timeSeries,
                            variableMap: new Map([['prev_computed_value', 0]]),
                            computed_values: [],
                        }
                        parse(newValue).invoke(dummyContext);
                    } catch (e: any) {
                        return <Alert severity="warning">That may not be a valid Parseq formula: {_.truncate(e.toString(), { length: 200 })}</Alert>;
                    }
            }
        }
        return <></>;

    }, [newValue, fieldToUpdate, fieldTypeToUpdate, timeSeries, bpm, fps, keyframes, fields]);

    return <>
        <Dialog maxWidth='md' fullWidth={true} open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>🖌️ Bulk edit keyframes</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Select the keyframes to update:
                </DialogContentText>
                <Stack direction="row" spacing={1} paddingTop={'1em'}>
                    <TextField
                        select
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        label="Field"
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        InputLabelProps={{ shrink: true, }}
                        SelectProps={{ style: { fontSize: '0.75em' } }}
                        value={matchField}
                        onChange={(e) => setMatchField(e.target.value)}
                    >
                        <MenuItem key="frame" value="frame">frame</MenuItem>
                        <MenuItem key="info" value="info">info</MenuItem>
                        {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                    </TextField>
                    <TextField
                        select
                        disabled={matchField === 'frame' || matchField === 'info'}
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        label="type"
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        InputLabelProps={{ shrink: true, }}
                        SelectProps={{ style: { fontSize: '0.75em' } }}
                        value={matchFieldType}
                        onChange={(e) => setMatchFieldType(e.target.value as 'value' | 'interpolation')}
                    >
                        <MenuItem key="value" value="value">value</MenuItem>
                        <MenuItem key="interpolation" value="interpolation">interpolation</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        label="method"
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        InputLabelProps={{ shrink: true, }}
                        SelectProps={{ style: { fontSize: '0.75em' } }}
                        value={matchMethod}
                        onChange={(e) => setMatchMethod(e.target.value as 'is' | 'regex')}
                    >
                        <MenuItem key="is" value="is">is exactly</MenuItem>
                        <MenuItem key="regex" value="regex">matches regex</MenuItem>
                    </TextField>
                    <SmallTextField
                        label={(matchMethod === "is" ? "value" : "regex") + " to match"}
                        value={matchRegex}
                        InputProps={{ style: { fontSize: "0.75em", fontFamily: "monospace", width: "18em" } }}
                        onChange={(e) => setMatchRegex(e.target.value)}
                    />
                </Stack>
                <DialogContentText>
                    Update matching keyframes to the following:
                </DialogContentText>
                <Stack direction="row" spacing={1} paddingTop={'1em'}>
                    <TextField
                        select
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        label="Field"
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        InputLabelProps={{ shrink: true, }}
                        SelectProps={{ style: { fontSize: '0.75em' } }}
                        value={fieldToUpdate}
                        onChange={(e) => setFieldToUpdate(e.target.value)}
                    >
                        <MenuItem key="info" value="info">info</MenuItem>
                        {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                    </TextField>
                    <TextField
                        select
                        disabled={fieldToUpdate === 'frame' || fieldToUpdate === 'info'}
                        size="small"
                        style={{ paddingBottom: '10px' }}
                        label="type"
                        inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                        InputLabelProps={{ shrink: true, }}
                        SelectProps={{ style: { fontSize: '0.75em' } }}
                        value={fieldTypeToUpdate}
                        onChange={(e) => setFieldTypeToUpdate(e.target.value as 'value' | 'interpolation')}
                    >
                        <MenuItem key="value" value="value">value</MenuItem>
                        <MenuItem key="interpolation" value="interpolation">interpolation</MenuItem>
                    </TextField>
                    <SmallTextField
                        label="Edit to..."
                        value={newValue}
                        InputProps={{ style: { fontSize: "0.75em", fontFamily: "monospace", width: "18em" } }}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                </Stack>
                <DialogContentText>
                    {framesToEdit.length > 0 && <>
                        <Typography fontSize={"0.75em"} fontStyle={{ color:  palette.success.main }}>
                            Will edit {framesToEdit.length} keyframe(s):
                        </Typography>
                        <Typography fontFamily={"monospace"} fontSize={"0.75em"} fontStyle={{ color:  palette.success.main }}>
                            • Frames: {framesToEdit.sort((a, b) => a - b).join(', ')}<br />
                            • Seconds: {framesToEdit.sort((a, b) => a - b).map(f => frameToXAxisType(f, "seconds", fps, bpm)).join(', ')}<br />
                            • Beats: {framesToEdit.sort((a, b) => a - b).map(f => frameToXAxisType(f, "beats", fps, bpm)).join(', ')}<br />
                        </Typography>
                    </>}
                    {framesToEdit.length <= 0 &&
                        <Typography fontSize={"0.75em"} fontStyle={{ color: palette.success.main }}>
                            No frames to edit.
                        </Typography>
                    }
                    {statusMessage}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button id="cancel_edit" onClick={handleCloseDialog}>
                    Cancel
                </Button>
                <Button disabled={framesToEdit.length === 0} variant="contained" id="edit" onClick={handleCloseDialog}>
                    🖌️ Apply
                </Button>
            </DialogActions>
        </Dialog>
        <Button size="small" variant="outlined" onClick={() => setOpenDialog(true)}>🖌️ Bulk edit</Button>
    </>
}


interface MergeKeyframesDialogProps {
    keyframes: ParseqKeyframe[];
    activeDocId: string;
    fps: number;
    mergeKeyframes: (incomingKeyframes: ParseqKeyframe[]) => void;
}

export const MergeKeyframesDialog: FC<MergeKeyframesDialogProps> = ({
    fps,
    activeDocId,
    mergeKeyframes,
}) => {

    const [openDialog, setOpenDialog] = useState(false);
    const [dataToMerge, setDataToMerge] = useState("");
    const [keyFrameMergeStatus, setKeyFrameMergeStatus] = useState(<></>);
    const [mergeEnabled, setMergeEnabled] = useState(false);

    function handleCloseDialog(event: any): void {
        setOpenDialog(false);
        if (event?.target?.id === "merge") {
            let json = JSON.parse(dataToMerge);
            if (json['keyframes'] && Array.isArray(json['keyframes'])) {
                mergeKeyframes(json['keyframes']);
            } else if (Array.isArray(json)) {
                mergeKeyframes(json);
            } else {
                console.error('Invalid format of keyframes to merge, should have been validated in dialog.');
            }
        }
    }

    return <>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>🌪️ Merge keyframes</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Merge keyframes from another source into the current document. Try the <Link href={'/browser?refDocId=' + activeDocId} target='_blank' rel="noopener">browser</Link> to find keyframe data from your other documents.
                </DialogContentText>
                <TextField
                    style={{ width: '100%', paddingTop: '10px' }}
                    id="merge-data"
                    multiline
                    onFocus={event => event.target.select()}
                    rows={10}
                    InputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                    placeholder="<Paste your Keyframes JSON here>"
                    value={dataToMerge}
                    onChange={(e) => {
                        setMergeEnabled(false);
                        setDataToMerge(e.target.value);

                        let newKeyframes;
                        let json;

                        try {
                            json = JSON.parse(e.target.value);
                        } catch (e: any) {
                            setKeyFrameMergeStatus(<Alert severity="error">Content to merge must be valid JSON. Got error: {e.message}</Alert>);
                            return;
                        }

                        if (json['keyframes'] && Array.isArray(json['keyframes'])) {
                            newKeyframes = json['keyframes'];
                        } else if (Array.isArray(json)) {
                            newKeyframes = json;
                        } else {
                            setKeyFrameMergeStatus(<Alert severity="error">Content to merge must be valid JSON array, or JSON object with top-level array named 'keyframes'.</Alert>);
                            return;
                        }

                        if (!newKeyframes.every((kf) => typeof kf.frame === "number")) {
                            setKeyFrameMergeStatus(<Alert severity="error">All keyframes must have a numeric 'frame' field.</Alert>);
                            return;
                        }

                        setKeyFrameMergeStatus(<Alert severity="success">Found {newKeyframes.length} keyframes to merge.</Alert>);
                        setMergeEnabled(true);
                    }}
                />
                {keyFrameMergeStatus}
            </DialogContent>
            <DialogActions>
                <Button size="small" id="cancel_add" onClick={handleCloseDialog}>Cancel</Button>
                <Button disabled={!mergeEnabled} size="small" variant="contained" id="merge" onClick={handleCloseDialog}>🌪️ Merge</Button>
            </DialogActions>
        </Dialog>
        <Button size="small" variant="outlined" onClick={() => setOpenDialog(true)}>🌪️ Merge</Button>
    </>
}