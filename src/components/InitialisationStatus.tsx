import Alert, { AlertColor } from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
//@ts-ignore

type MyProps = {
    status: {
        severity: AlertColor | undefined;
        message: string;
    }
};

export function InitialisationStatus({ status }: MyProps) {
    const [open, setOpen] = useState(true);
    return (
        status.severity && status.message && <Collapse in={open}>
            <Alert
                severity={status.severity}
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => {
                            setOpen(false);
                        }}>
                        ❎
                    </IconButton>
                }
                sx={{ mb: 2 }}
            >
                {status.message}
            </Alert>
        </Collapse>
    );
}