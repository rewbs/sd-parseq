import { Box, Button, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { useMeasure } from "react-use";
import { defaultFields } from '../data/fields';
import StyledSwitch from './StyledSwitch';
import { isDefinedField } from '../utils/utils';

type FieldSelectorProps = {
    selectedFields: string[];
    customFields: InterpolatableFieldDefinition[];
    keyframes: ParseqKeyframe[];
    promptVariables: string[];
    onChange: (e: any) => void;
};

const StyledList = styled(List)<{ component?: React.ElementType }>({
    '& .MuiListItemButton-root': {
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 0,
        paddingBottom: 0,
    },
    '& .MuiListItemIcon-root': {
        minWidth: 0,
        marginRight: 16,
    },
    '& .MuiListItemButton-dense': {
        border: '1px solid rgb(250, 250, 245)',
    },
    '& .MuiListItemButton-dense:hover': {
        backgroundColor: 'rgb(245, 245, 255)',
        border: '1px solid rgb(220, 220, 240)'
    }
});

export function FieldSelector(props: FieldSelectorProps) {
    const [filter, setFilter] = useState('');
    const [selectedFields, setSelectedFields] = useState(props.selectedFields);
    // eslint-disable-next-line
    const [detailedField, setDetailedField] = useState<InterpolatableFieldDefinition>();
    const [listRef, measure] = useMeasure();

    const itemWidth = 300;
    const numCols = measure.width ? Math.floor(measure.width / itemWidth) : 4;
    const numRows = Math.ceil(defaultFields.concat(props.customFields).length / numCols);

    const list = useMemo(() => <StyledList
        //@ts-ignore
        ref={listRef}
        sx={{
            display: "grid",
            gridTemplateRows: `repeat(${numRows}, 1fr)`,
            gridAutoFlow: "column",
            overflow: "scroll",
            width: '100%',
        }}
    >
        {defaultFields.concat(props.customFields)
            .filter(field => field.name.toLowerCase().includes(filter.toLowerCase())
                || field.labels.some(label => label.toLowerCase().includes(filter.toLowerCase())))
            .filter(field => field.name !== 'frame').map((field, idx) =>
                <ListItem dense sx={{ width: 'auto', maxWidth: itemWidth }} key={field.name}>
                    <ListItemButton
                        onClick={(_) => selectedFields.some(f => f === field.name)
                            ? setSelectedFields(selectedFields.filter(f => f !== field.name))
                            : setSelectedFields([...selectedFields, field.name])}
                        sx={{ backgroundColor: selectedFields.some(f => f === field.name) ? 'rgb(245, 245, 255)' : '' }}
                    >
                        <ListItemIcon>
                            <Typography color={`rgb(${field.color[0]},${field.color[1]},${field.color[2]})`} >█</Typography>
                        </ListItemIcon>
                        <Tooltip arrow placement="top" title={<>
                            <strong>{field.name}</strong>
                            <ul style={{ padding: 5, margin: 0 }}>
                                <li>type: {field.type}</li>
                                <li>default value: {field.defaultValue}</li>
                                {field.labels.length > 0 ? <li>labels: {field.labels.join(',')}</li> : <></>}
                            </ul></>}>
                            <ListItemText
                                primaryTypographyProps={{
                                    fontSize: '0.75em',
                                    overflow: 'hidden',
                                    color: selectedFields.some(f => f === field.name) ? '' : 'text.secondary',
                                }}
                                primary={field.name} />
                        </Tooltip>
                        <Tooltip enterDelay={1000} enterNextDelay={1000} arrow placement="top" title={selectedFields.includes(field.name) ? `Toggle off to control '${field.name}' with Deforum.` : `Toggle on to control '${field.name}' with Parseq.`}>
                            <StyledSwitch
                                edge="end"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedFields([...selectedFields, field.name]);
                                    } else {
                                        setSelectedFields(selectedFields.filter(f => f !== field.name));
                                    }
                                }}
                                checked={selectedFields.includes(field.name)}
                            />
                        </Tooltip>
                    </ListItemButton>
                </ListItem>
            )}
    </StyledList>, [selectedFields, props.customFields, filter, numRows, listRef]);


    const details = useMemo(() => detailedField && <Grid container>
        <Typography>{detailedField.name}</Typography>
        <Typography >{detailedField.description}</Typography>
        <TextField
            read-only
            label="Type"
            value={detailedField.type}
            InputProps={{ style: { fontSize: '0.75em' } }}
            InputLabelProps={{ shrink: true, }}
            size="small"
        />
        <TextField
            read-only
            label="Default value"
            value={detailedField.defaultValue}
            InputProps={{ style: { fontSize: '0.75em' } }}
            InputLabelProps={{ shrink: true, }}
            size="small"
        />
        <TextField
            read-only
            label="Labels"
            value={detailedField.labels.join(', ')}
            InputProps={{ style: { fontSize: '0.75em' } }}
            InputLabelProps={{ shrink: true, }}
            size="small"
        />
    </Grid>, [detailedField]);

    useEffect(() => {
        props.onChange(selectedFields);
    }, [selectedFields, props]);

    return <>
        <p><small>Select which fields you'd like to manage with Parseq. Unselected fields are controllable with Deforum.</small></p>

        {/* TODO: user Grid v2 like everywhere else */}
        <Grid container item xs={12}>
            <Grid item xs={6}>
                <TextField
                    label="Filter"
                    value={filter}
                    sx={{ marginLeft: '16px' }}
                    InputProps={{ style: { fontSize: '0.75em' } }}
                    InputLabelProps={{ shrink: true, }}
                    size="small"
                    onChange={(e: any) => setFilter(e.target.value)}
                />
            </Grid>
            <Grid item xs={6}>
                <Box display='flex' justifyContent="right" gap={1} alignItems='center'>
                    <Tooltip arrow placement="top" title="Uncheck all fields.">
                        <Button size="small" variant='outlined'
                            onClick={(e) => setSelectedFields([])}>
                            None
                        </Button>
                    </Tooltip>
                    <Tooltip arrow placement="top" title="Check all fields.">
                        <Button size="small" variant='outlined'
                            onClick={(e) => setSelectedFields(defaultFields.concat(props.customFields).map(f => f.name))}>
                            All
                        </Button>
                    </Tooltip>                        
                    
                    {
                    // TODO Causes infinite loop - TBI.
                    // Depends on keyframes but also triggers change to keyframes resulting in loop.
                    <Tooltip arrow placement="top" title="Check only fields that have values set in the keyframes or are used in prompts.">
                        <Button size="small" variant='outlined'
                            onClick={(e) => {
                                const usedFields = new Set<string>(props.promptVariables);
                                props.keyframes.forEach(kf => { 
                                    Object.keys(kf).filter(field => field !== "frame" && !field.endsWith("_i")).forEach(field => {
                                        if (isDefinedField(kf[field]) || isDefinedField(kf[field+"_i"])) {
                                            usedFields.add(field);
                                        }
                                }, [])});
                                setSelectedFields(Array.from(usedFields));
                            }}>
                        Used
                        </Button>
                    </Tooltip> 
                    }
                </Box>
            </Grid>
        </Grid>

        {list}
        {details}
    </>;
}