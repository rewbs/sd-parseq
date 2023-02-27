import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { defaultFields } from '../data/fields';

type FieldSelectorProps = {
    selectedFields: string[];
    customFields: InterpolatableFieldDefinition[];
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
        backgroundColor: 'rgb(250, 250, 245)',
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

    const list = useMemo(() => <StyledList
            sx={{
                display: "flex",
                flexFlow: "column wrap",
                gap: "0 10px",
                maxHeight: 490,
                overflow: "scroll",
                width: '100%'  
            }}
        >
            {defaultFields.concat(props.customFields)
                .filter(field => field.name.toLowerCase().includes(filter.toLowerCase())
                    || field.labels.some( label => label.toLowerCase().includes(filter.toLowerCase())))   
                .filter(field => field.name !== 'frame').map((field, idx) =>
                <ListItem dense sx={{ width: 'auto', maxWidth: '300px' }} key={idx}>
                    <ListItemButton>
                        <ListItemIcon>
                            <Typography color={`rgb(${field.color[0]},${field.color[1]},${field.color[2]})`} >█</Typography>
                        </ListItemIcon>
                        <Tooltip arrow placement="top" title={field.name}>
                            <ListItemText
                                primaryTypographyProps={{
                                    fontSize: '0.75em',
                                    overflow: 'hidden',
                                }}
                                primary={field.name} />
                        </Tooltip>
                        <Tooltip enterDelay={1000} enterNextDelay={1000} arrow placement="top" title={selectedFields.includes(field.name) ? `Toggle off to control '${field.name}' with Deforum.` : `Toggle on to control '${field.name}' with Parseq.`}>
                            <Switch
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
        </StyledList>, [selectedFields, props.customFields, filter]);


        useEffect(() => {
            props.onChange(selectedFields);
        }, [selectedFields, props]);

    return <>
        <p>Select which parameters you'd like to control with Parseq. Unselected parameters are controllable via Deforum.</p>
        <TextField
            label="Filter"
            value={filter}
            InputProps={{ style: { fontSize: '0.75em' } }}
            InputLabelProps={{ shrink: true, }}            
            size="small"
            onChange={(e: any) => setFilter(e.target.value) }
        />
        {list}
        


    </>;
}