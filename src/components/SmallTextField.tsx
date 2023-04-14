import TextField, { TextFieldProps } from '@mui/material/TextField';
import React from 'react';

export const SmallTextField = (props: TextFieldProps) => (
  <TextField
    size="small"
    InputLabelProps={{ shrink: true }}
    InputProps={{ style: { fontSize: "0.75em", fontFamily: "monospace", width: "9em" } }}
    margin="dense"
    {...props} />
);
