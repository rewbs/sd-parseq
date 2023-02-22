import { Checkbox, FormControlLabel } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { PropsWithChildren } from 'react'

type ExpandableSectionProps = {
    title: string;
};

// TODO always open by default – may need an option to control this in the future.
export function ExpandableSection({ title, children }: PropsWithChildren<ExpandableSectionProps>) {
    const [open, setOpen] = useState(true);
    return <>
        <FormControlLabel
            control={
                <Checkbox
                    checked={open}
                    onChange={(e) => setOpen(e.target.checked)}
                    checkedIcon={<ExpandMoreIcon/>}
                    icon={<ChevronRightIcon/>}
                />
            }
            label={<h3>{title}</h3>}
        />
        <Collapse in={open}>
            {children}
        </Collapse>
    </>;
}