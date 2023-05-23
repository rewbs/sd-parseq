import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
//@ts-ignore
import { MenuItem, TextField, Tooltip } from '@mui/material';
import { SmallTextField } from './SmallTextField';
import { useState } from 'react';
import { createAudioBufferCopy } from '../utils/utils';

type BiquadFilterProps = {
    unfilteredAudioBuffer: AudioBuffer;
    updateAudioBuffer: (audioBuffer: AudioBuffer) => void;
};

export function BiquadFilter({ unfilteredAudioBuffer, updateAudioBuffer }: BiquadFilterProps) {

    const [biquadFilterFreq, setBiquadFilterFreq] = useState(800);
    const [biquadFilterQ, setBiquadFilterQ] = useState(0.5);
    const [biquadFilterType, setBiquadFilterType] = useState<"lowpass" | "highpass" | "bandpass">("lowpass");

  
    const handleResetFilter = () => {
        if (unfilteredAudioBuffer) {
          updateAudioBuffer(createAudioBufferCopy(unfilteredAudioBuffer));
        }
      }
    
      const handleApplyFilter = () => {
        if (!unfilteredAudioBuffer) {
          return;
        }
    
        const audioData = unfilteredAudioBuffer.getChannelData(0);
        const context = new OfflineAudioContext(1, audioData.length, unfilteredAudioBuffer.sampleRate);
        const source = context.createBufferSource();
        const filteredBuffer = context.createBuffer(1, audioData.length, unfilteredAudioBuffer.sampleRate);
        filteredBuffer.getChannelData(0).set(audioData);
        source.buffer = filteredBuffer;
    
        const biquadFilter = context.createBiquadFilter();
        biquadFilter.type = biquadFilterType;
        biquadFilter.frequency.value = biquadFilterFreq;
        biquadFilter.Q.value = biquadFilterQ;
        source.connect(biquadFilter);
        biquadFilter.connect(context.destination);
    
        source.start();
        context.startRendering().then(renderedBuffer => updateAudioBuffer(renderedBuffer));
      }    


    return <Stack direction={"row"} alignItems={"center"} spacing={1}>
    <Typography fontSize={"0.75em"}>Filter: </Typography>
    <TextField
        size="small"
        style={{ width: "6em" }}
        label="Type"
        InputLabelProps={{ shrink: true, }}
        InputProps={{ style: { fontSize: '0.75em' } }}
        value={biquadFilterType}
        onChange={(e) => setBiquadFilterType(e.target.value as "lowpass" | "highpass" | "bandpass")}
        select
      >
        <MenuItem value={"lowpass"}>lowpass</MenuItem>
        <MenuItem value={"highpass"}>highpass</MenuItem>
        <MenuItem value={"bandpass"}>bandpass</MenuItem>
      </TextField>                
      <SmallTextField
        label="Freq (Hz)"
        type="number"
        value={biquadFilterFreq}
        onChange={(e) => setBiquadFilterFreq(Number(e.target.value))}
      />
      <SmallTextField
        label="Resonance"
        type="number"
        value={biquadFilterQ}
        onChange={(e) => setBiquadFilterQ(Number(e.target.value))}
      />
      <Tooltip arrow placement="top" title={"Apply a filter to your audio."} >
        <Button size='small' variant='contained' onClick={handleApplyFilter}> Apply</Button>
      </Tooltip>
      <Tooltip arrow placement="top" title={"Undo the filter to restore your original audio."} >
        <Button size='small' variant='outlined' onClick={handleResetFilter}> Reset</Button>
      </Tooltip>
    </Stack>;
}