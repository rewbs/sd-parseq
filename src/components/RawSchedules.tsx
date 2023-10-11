import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { RenderedData } from '../ParseqUI';

type RawSchedulesProps = {
  renderedData: RenderedData;
  managedFields: string[];
}

export default function RawSchedules({ renderedData, managedFields }: RawSchedulesProps) {

  const [selectedField, setSelectedField] = useState<string>(managedFields ? managedFields[0] : '');
  const [variant, setVariant] = useState<'delta' | 'absolute'>('delta');


  const rawSchedule = React.useMemo(() => {

    if (['Prompt', 'PositivePrompt', 'NegativePrompt'].includes(selectedField))  {
      return renderedData?.rendered_frames
      ?.map(frame => {
        const fullPrompt = frame['deforum_prompt'];
        const promptPiece = selectedField === 'Prompt' ? fullPrompt
          : selectedField === 'PositivePrompt' ? fullPrompt.split('--neg')[0]
            : fullPrompt.split('--neg')[1];
        return `"${frame['frame']}": "${promptPiece}"`
      })
      ?.join(",\n");
    } else {
      return renderedData?.rendered_frames
      ?.map(frame => `${frame['frame']}: (${frame[selectedField + (variant === 'delta' ? '_delta' : '')]})`)
      ?.join(', ');
    }

  }, [renderedData, selectedField, variant]);

  return (
    <Stack>
      <Stack direction={'row'} gap={1}>
        <TextField
          label="Field"
          InputLabelProps={{ shrink: true, }}
          InputProps={{ style: { width: "20em", fontSize: '0.75em' } }}
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          select
          size='small'
        >
          {managedFields?.map(f => <MenuItem value={f}>{f}</MenuItem>)}
          <MenuItem value="Prompt">Full prompt</MenuItem>
          <MenuItem value="PositivePrompt">Positive prompt</MenuItem>
          <MenuItem value="NegativePrompt">Negative prompt</MenuItem>
        </TextField>
        <TextField
          label="Variant"
          InputLabelProps={{ shrink: true, }}
          InputProps={{ style: { width: "20em", fontSize: '0.75em' } }}
          value={variant}
          onChange={(e) => setVariant(e.target.value as 'delta' | 'absolute')}
          select
          size='small'
        >
          <MenuItem value="delta">Delta values</MenuItem>
          <MenuItem value="absolute">Absolute values</MenuItem>
        </TextField>
      </Stack>
      {rawSchedule && selectedField && <TextField
        style={{ width: '100%' }}
        multiline
        onFocus={event => event.target.select()}
        rows={4}
        InputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
        value={rawSchedule}
        variant="filled"
      />
      }
      <Typography fontSize="0.75em" paddingBottom={"5px"}>
        You use this schedule directly in Deforum, or in ComfyUI using  <a href="https://github.com/FizzleDorf/ComfyUI_FizzNodes">FizzNodes</a>.
      </Typography>

    </Stack>

  );
}