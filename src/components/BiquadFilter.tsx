/* eslint-disable react/jsx-no-target-blank */
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
//@ts-ignore
import { Link, MenuItem, TextField, Tooltip } from '@mui/material';
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
    const [biquadFilterGain, setBiquadFilterGain] = useState(0);
    const [biquadFilterType, setBiquadFilterType] = useState<BiquadFilterType>("lowpass");

  
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
        biquadFilter.gain.value = biquadFilterGain;
        source.connect(biquadFilter);
        biquadFilter.connect(context.destination);
    
        source.start();
        context.startRendering().then(renderedBuffer => updateAudioBuffer(renderedBuffer));
      }    

    return <Stack direction={"row"} alignItems={"center"} spacing={1}>
    <Typography fontSize={"0.75em"}>Filter <Link href="https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/type" target='_blank' rel="noopener">(?)</Link>: </Typography>
    <TextField
        size="small"
        style={{ width: "6em" }}
        label="Type"
        InputLabelProps={{ shrink: true, }}
        InputProps={{ style: { fontSize: '0.75em' } }}
        value={biquadFilterType}
        onChange={(e) => setBiquadFilterType(e.target.value as BiquadFilterType) }
        select
      >
        <MenuItem value={"lowpass"}>lowpass</MenuItem>
        <MenuItem value={"highpass"}>highpass</MenuItem>
        <MenuItem value={"bandpass"}>bandpass</MenuItem>
        <MenuItem value={"lowshelf"}>lowshelf</MenuItem>
        <MenuItem value={"highshelf"}>highshelf</MenuItem>
        <MenuItem value={"peaking"}>peaking</MenuItem>
        <MenuItem value={"notch"}>notch</MenuItem>
        <MenuItem value={"allpass"}>allpass</MenuItem>
      </TextField>                
      <SmallTextField
        label="Freq (Hz)"
        type="number"
        value={biquadFilterFreq}
        onChange={(e) => setBiquadFilterFreq(Number(e.target.value))}
      />
      <SmallTextField
        label = {filterTypeToQLabel(biquadFilterType)}
        disabled = {["lowshelf", "highshelf"].includes(biquadFilterType)}
        type="number"
        value={biquadFilterQ}
        onChange={(e) => setBiquadFilterQ(Number(e.target.value))}
      />
      <SmallTextField
        label = {["lowshelf", "highshelf", "peaking"].includes(biquadFilterType)? "Gain (db)" : "Gain (unused)"}
        disabled = {!["lowshelf", "highshelf", "peaking"].includes(biquadFilterType)}
        type="number"
        value={biquadFilterGain}
        onChange={(e) => setBiquadFilterGain(Number(e.target.value))}
      />      
      <Tooltip arrow placement="top" title={"Apply a filter to your audio."} >
        <Button size='small' variant='contained' onClick={handleApplyFilter}> Apply</Button>
      </Tooltip>
      <Tooltip arrow placement="top" title={"Undo the filter to restore your original audio."} >
        <Button size='small' variant='outlined' onClick={handleResetFilter}> Reset</Button>
      </Tooltip>
    </Stack>;
}


function filterTypeToQLabel(biquadFilterType: BiquadFilterType): string {
  switch(biquadFilterType) {
    case "lowpass":
    case "highpass":
      return "Q (peak)";
    case "bandpass":
    case "notch":        
    case "peaking":      
      return "Q (width)";
    case "allpass":
      return "Q (phase)";
    case "lowshelf":
    case "highshelf":
        return "Q (unused)";      
  }
}
