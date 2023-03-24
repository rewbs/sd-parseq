import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Checkbox, FormControlLabel } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import { PropsWithChildren, useState } from 'react';

type ExpandableSectionProps = {
    title: string;
    renderChildrenWhenCollapsed?: boolean;
};

// TODO always open by default – may need an option to control this in the future.
export function ExpandableSection({ title, children, renderChildrenWhenCollapsed=false}: PropsWithChildren<ExpandableSectionProps>) {
    const [expanded, setExpanded] = useState(true);
    const [animating, setAnimating] = useState(true);
    return <>
        <FormControlLabel
            control={
                <Checkbox
                    checked={expanded}
                    onChange={(e) => setExpanded(e.target.checked)}
                    checkedIcon={<ExpandMoreIcon/>}
                    icon={<ChevronRightIcon/>}
                />
            }
            label={<h3>{title}</h3>}
        />
        <Collapse
            onEnter={() => setAnimating(true)}
            onExit={() => setAnimating(true)}
            onEntered={() => setAnimating(false)}
            onExited={() => setAnimating(false)}
            in={expanded}>
            {(expanded || animating || renderChildrenWhenCollapsed) ? children :  <></>}
        </Collapse>
    </>;
}