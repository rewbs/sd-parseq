import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { PitchMethod } from 'aubiojs';
import { range } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Sparklines, SparklinesLine } from 'react-sparklines-typescript-v2';
import { InterpolationType, TimeSeries, TimestampType } from '../parseq-lang/parseq-timeseries';
import { DECIMATION_THRESHOLD } from '../utils/consts';
import { frameToSec } from '../utils/maths';
import {createAudioBufferCopy}  from '../utils/utils';
import WavesurferAudioWaveform from './WavesurferWaveform';
import { TabPanel } from './TabPanel';
import { SmallTextField } from './SmallTextField';

type TimeSeriesUIProps = {
  lastFrame: number,
  bpm: number,
  fps: number,
  allTimeSeries: {
    alias: string;
    ts: TimeSeries;
  }[] | [],
  onChange: (allTimeSeries: {
    alias: string;
    ts: TimeSeries;
  }[] | []) => void;
  afterBlur: (event: any) => void,
  afterFocus: (event: any) => void,

}

const defaultData = {
  datasets: [
    {
      label: 'Raw',
      data: [],
      yAxisID: 'raw',
    },
    {
      label: 'Processed',
      data: [],
      yAxisID: 'processed',
    },
  ],
};


export const TimeSeriesUI = (props: TimeSeriesUIProps) => {

  const { lastFrame, fps, onChange, afterBlur, afterFocus } = props;

  const [open, setOpen] = useState(false);
  const [allTimeSeries, setAllTimeSeries] = useState(props.allTimeSeries);

  const [timestampType, setTimestampType] = useState(TimestampType.Frame);
  const [rawTimeSeries, setRawTimeSeries] = useState<TimeSeries>();
  const [processedTimeSeries, setSetProcessedTimeSeries] = useState<TimeSeries>();
  const [tab, setTab] = useState(1);

  const [chartData, setChartData] = useState(defaultData);

  const [abs, setAbs] = useState(false);
  const [mAwindowSize, setMAwindowSize] = useState('');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  const [limitMin, setLimitMin] = useState('');
  const [limitMax, setLimitMax] = useState('');
  const [normalizeMin, setNormalizeMin] = useState('');
  const [normalizeMax, setNormalizeMax] = useState('');

  const [showValuesAtFrames, setShowValuesAtFrames] = useState(false);

  const [selectionStartMs, setSelectionStartMs] = useState(0);
  const [selectionEndMs, setSelectionEndMs] = useState(0);

  const [pitchMethod, setPitchMethod] = useState("default");
  const pitchProgressRef = useRef<HTMLInputElement>(null);

  const [biquadFilterFreq, setBiquadFilterFreq] = useState(800);
  const [biquadFilterQ, setBiquadFilterQ] = useState(0.5);
  const [biquadFilterType, setBiquadFilterType] = useState<"lowpass" | "highpass" | "bandpass">("lowpass");

  const [unfilteredAudioBuffer, setUnfilteredAudioBuffer] = useState<AudioBuffer>();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();

  const [status, setStatus] = useState(<></>);


  const handleTimestampTypeChange = (event: any) => {
    setTimestampType(event.target.value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddTimeSeries = useCallback(() => {
    setOpen(false);
    if (processedTimeSeries) {
      let num = allTimeSeries.length;
      let alias = 'ts' + num;
      //eslint-disable-next-line no-loop-func
      while (allTimeSeries.some(ts => ts.alias === alias)) {
        num++;
        alias = 'ts' + num;
      }
      const newTimeSeries = [...allTimeSeries, {
        alias,
        ts: processedTimeSeries
      }];
      setAllTimeSeries(newTimeSeries);
      onChange(newTimeSeries);      
    }

  }, [allTimeSeries, processedTimeSeries, onChange]);

  const handleDeleteTimeSeries = useCallback((idx: number) => {
    const newTimeSeries = allTimeSeries.filter((_, i) => i !== idx);
    setAllTimeSeries(newTimeSeries);
    onChange(newTimeSeries);
  }, [allTimeSeries, onChange]);

  const handleOpen = () => {
    setOpen(true);
    setRawTimeSeries(undefined);
    setSetProcessedTimeSeries(undefined);
    setChartData(defaultData);
  };


  const updateChartData = useCallback((raw: TimeSeries, processed?: TimeSeries) => {

    const datasets = [];
    const graphableRaw = showValuesAtFrames ? range(0, lastFrame).map((x) => ({ x: x, y: raw.getValueAt(x, fps, InterpolationType.Step) }))
      : raw.data;

    datasets.push({
      label: 'Raw',
      data: graphableRaw,
      yAxisID: 'raw',
      pointRadius: showValuesAtFrames ? 2 : 0,
      pointStyle: 'cross',
      pointColor: 'black',
      borderColor: 'rgba(100,100,100,0.5)',
      borderWidth: 1
    });

    if (processed) {
      const graphableProcessed = showValuesAtFrames ? range(0, lastFrame).map((x) => ({ x: x, y: processed.getValueAt(x, fps, InterpolationType.Step) }))
        : processed.data;
      datasets.push({
        label: 'Processed',
        data: graphableProcessed,
        yAxisID: 'processed',
        pointRadius: showValuesAtFrames ? 2 : 0,
        pointStyle: 'cross',
        pointColor: 'red',
        borderColor: 'red',
        borderWidth: 1
      });

      if (!showValuesAtFrames) {
        datasets.push({
          label: 'Frame positions',
          data: range(0, lastFrame).map((x) => ({
              x: (processed.timestampType === TimestampType.Millisecond) ? frameToSec(x, fps) * 1000 : x,
              y: processed.getValueAt(x, fps, InterpolationType.Step)
            })),
          yAxisID: 'processed',
          pointRadius: 2,
          pointStyle: 'circle',
          pointColor: 'rgb(0,200,0)',
          pointBackgroundColor: 'rgba(0,200,0,0.8)',
          borderColor: 'rgb(0,200,0)',
          backgroundColor: 'rgb(0,200,0,0.8)',
          borderWidth: 1,
          showLine: false
        });
      }
    }
    //console.log(datasets);
    //@ts-ignore    
    setChartData({ datasets });
  }, [lastFrame, showValuesAtFrames, fps]);

  const handleLoadFromAudio = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file || !lastFrame) {
        return;
      }
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setUnfilteredAudioBuffer(createAudioBufferCopy(newAudioBuffer));
      setAudioBuffer(newAudioBuffer);
    } catch (e: any) {
      console.error(e);
    }
  }

  const handleResetBandPass = () => {
    if (unfilteredAudioBuffer) {
      setAudioBuffer(createAudioBufferCopy(unfilteredAudioBuffer));
    }
  }

  const handleApplyBandPass = () => {
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
    context.startRendering().then(renderedBuffer => setAudioBuffer(renderedBuffer));
  }

  const handleLoadFromCSV = async (event: any) => {
    const file = event.target.files[0];
    if (file && lastFrame) {
      try {
        const newRawTimeSeries = await TimeSeries.loadFromCSV(file, timestampType);
        setRawTimeSeries(newRawTimeSeries);
        updateChartData(newRawTimeSeries);
      } catch (error) {
        console.error('Error loading TimeSeries:', error);
      }
    } else {
      console.warn('File or maxOffset is missing');
    }
  };

  // TODO: can be optimised to fewer full walks over the data.
  const handleProcess = useCallback(() => {
    setStatus(<></>);

    if (rawTimeSeries) {
      let processedTimeSeries = rawTimeSeries;

      if (abs) {
        processedTimeSeries = processedTimeSeries.abs();
      }

      if (mAwindowSize) {
        processedTimeSeries = processedTimeSeries.movingAverage(Number(mAwindowSize));
      }

      if (filterMin.length || filterMax.length) {
        const min = isNaN(parseFloat(filterMin)) ? Number.MIN_VALUE : parseFloat(filterMin);
        const max = isNaN(parseFloat(filterMax)) ? Number.MAX_VALUE : parseFloat(filterMax);
        if (min >= max) {
          setStatus(<Alert severity="error">Filter min must be less than filter max</Alert>);
          return;
        }
        processedTimeSeries = processedTimeSeries.filter(min, max);
      }

      if (limitMin || limitMax) {
        const min = isNaN(parseFloat(limitMin)) ? Number.MIN_VALUE : parseFloat(limitMin);
        const max = isNaN(parseFloat(limitMax)) ? Number.MAX_VALUE : parseFloat(limitMax);
        if (min >= max) {
          setStatus(<Alert severity="error">Limit min must be less than limit max</Alert>);
          return;
        }
        processedTimeSeries = processedTimeSeries.limit(min, max);
      }

      if (normalizeMin && normalizeMax) {
        processedTimeSeries = processedTimeSeries.normalize(Number(normalizeMin), Number(normalizeMax));
      } else if (normalizeMin || normalizeMax) {
        setStatus(<Alert severity="error">Normalization requires both a min and max.</Alert>);
        return;
      }

      setSetProcessedTimeSeries(processedTimeSeries);
      updateChartData(rawTimeSeries, processedTimeSeries);
    }
  }, [abs,
    filterMax,
    filterMin,
    limitMax,
    limitMin,
    mAwindowSize,
    normalizeMax,
    normalizeMin,
    rawTimeSeries,
    updateChartData]);

    /*eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => handleProcess(), [showValuesAtFrames]);


  const extractAmplitude = () => {
    if (!audioBuffer) {
      return;
    }
    const intervalMs = 1000 / audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStartMs * audioBuffer.sampleRate / 1000);
    const endSample = Math.floor(selectionEndMs * audioBuffer.sampleRate / 1000);
    const newRawTimeSeries = TimeSeries.loadSingleSeries(
      Array.from(audioBuffer.getChannelData(0).slice(startSample, endSample + 1))
      , intervalMs);
    setRawTimeSeries(newRawTimeSeries);
    updateChartData(newRawTimeSeries);
  }

  const extractPitch = useCallback(() => {

    if (!audioBuffer) {
      return;
    }

    //@ts-ignore
    const pitchDetectionWorker = new Worker(new URL('../analysisWorker-pitch.ts', import.meta.url));

    const startSample = Math.floor(selectionStartMs * audioBuffer.sampleRate / 1000);
    const endSample = Math.floor(selectionEndMs * audioBuffer.sampleRate / 1000);
    const bufferToAnalyse = audioBuffer.getChannelData(0).slice(startSample, endSample + 1);

    const pitchPointsAccumulator: { x: number, y: number }[] = [];

    pitchDetectionWorker.onmessage = (e: any) => {
      const bufferLengthInMs = bufferToAnalyse.length / audioBuffer.sampleRate * 1000;
      const posInMs = e.data.progress * bufferLengthInMs;

      pitchPointsAccumulator.push({
        x: Math.round(posInMs),
        y: (e.data.pitchHz || 0),
      })

      if (pitchProgressRef.current) {
        pitchProgressRef.current.innerText = `(${(e.data.progress * 100).toFixed(2)}%)`;
      }
      if (e.data.progress >= 1) {
        const newRawTimeSeries = TimeSeries.fromPoints(pitchPointsAccumulator, TimestampType.Millisecond);
        setRawTimeSeries(newRawTimeSeries);
        updateChartData(newRawTimeSeries);
      }
    };
    pitchDetectionWorker.onerror = (e: any) => {
      //setStatusMessage(<Alert severity="error">Error analysing pitch: {e.message}</Alert>);
      //setPitchProgress(100);
      pitchDetectionWorker.terminate();
    }

    // Kick off workers. 
    // TODO: consider passing buffer as a shared array buffer, could speed things up (but there appears
    // to be browser restrictions because of Spectre/Meltdown).


    const pitchInitData = {
      buffer: bufferToAnalyse,
      sampleRate: audioBuffer?.sampleRate,
      bufferSize: 4096,
      hopSize: 256,
      method: pitchMethod,
      tolerance: 0.7,
    };
    pitchDetectionWorker.postMessage(pitchInitData);

  }, [audioBuffer, pitchMethod, selectionEndMs, selectionStartMs, updateChartData]);

  const timeSeriesList = useMemo(() => allTimeSeries.map(({ ts, alias }, idx) => <>
    <Box key={"ts-" + idx} sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center', width: '100%', padding: 0, marginTop: 2, marginRight: 2, border: 0, backgroundColor: 'rgb(250, 249, 246)', borderRadius: 1 }} >
      <Grid xs={2}>
        <SmallTextField
          value={allTimeSeries[idx].alias}
          label={"name"}
          onChange={(e) => {
            allTimeSeries[idx].alias = e.target.value.trim();
            setAllTimeSeries([...allTimeSeries]);
            onChange(allTimeSeries);
          }}
          onBlur={(e: any) => afterBlur(e)}
          onFocus={(e: any) => afterFocus(e)}
          helperText={allTimeSeries.find((t, i) => i !== idx && t.alias === allTimeSeries[idx].alias) ? "⚠️ duplicate name" : ""}
        />
      </Grid>
      <Grid xs={9}>
        <Sparklines data={ts.data.map(({ x, y }) => y)} height={25}>
          <SparklinesLine style={{ fill: 'none', strokeWidth: 0.25, stroke: 'rgba(30,100,0,0.8)', }} />
        </Sparklines>
      </Grid>
      <Grid xs={1}>
        <Button variant='outlined' onClick={(e) => handleDeleteTimeSeries(idx)}>❌</Button>
      </Grid>
    </Box>
  </>), [allTimeSeries, handleDeleteTimeSeries, onChange, afterBlur, afterFocus]);

  const waveSuferWaveform = useMemo(() => audioBuffer &&
    <WavesurferAudioWaveform
      audioBuffer={audioBuffer}
      initialSelection={{ start: 0, end: frameToSec(lastFrame, fps) * 1000 }}
      onSelectionChange={(start, end) => {
        setSelectionStartMs(start);
        setSelectionEndMs(end);
      }} />, [audioBuffer, fps, lastFrame]);

  return <>
    <p><small>Custom time series are arbitrary sequences of numbers that can be referenced from you Parseq formula. You can import them from audio data, or from a CSV file.</small></p>
    <Grid xs={12} container>
      {timeSeriesList}
    </Grid>
    <Button variant="outlined" onClick={handleOpen}>
      ➕ Add TimeSeries
    </Button>
    <Dialog open={open} onClose={handleClose} maxWidth='xl' fullWidth>
      <DialogTitle>Load TimeSeries</DialogTitle>
      <DialogContent>
        <h3>Load from...</h3>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(event: React.SyntheticEvent, newValue: number) => setTab(newValue)}>
            <Tab label="Audio file" value={1} />
            <Tab label="CSV file" value={2} />
          </Tabs>
        </Box>
        <TabPanel index={1} activeTab={tab}>
          <Stack direction="row" alignContent={"center"} justifyContent="space-between">
            <Box>
              <input
                type="file" accept=".mp3,.wav,.flac,.flc,.wma,.aac,.ogg,.aiff,.alac"
                onClick={
                  //@ts-ignore
                  e => e.target.value = null // Ensures onChange fires even if same file is re-selected.
                }                
                onChange={handleLoadFromAudio} />
            </Box>
            {audioBuffer && <>
            <Stack direction={"row"} alignItems={"center"} spacing={1}>
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
                  <Button size='small' variant='contained' onClick={handleApplyBandPass}> Apply</Button>
                </Tooltip>
                <Tooltip arrow placement="top" title={"Undo the filter to restore your original audio."} >
                  <Button size='small' variant='outlined' onClick={handleResetBandPass}> Reset</Button>
                </Tooltip>
              </Stack>
            </>}
          </Stack>
          {waveSuferWaveform}
          {audioBuffer &&
            <Stack paddingTop={"5px"} direction="row" alignContent={"center"} justifyContent="left" spacing={6}>
              <Box>
                <Tooltip arrow placement="top" title={"Convert your audio's amplitude to a time series input, ready for processing."} >
                  <Button size='small' variant='contained' onClick={extractAmplitude}> Extract Amplitude</Button>
                </Tooltip>
              </Box>
              <Stack direction={"row"} alignItems={"center"} spacing={1}>
                <Tooltip arrow placement="top" title={"Select the method used for pitch detection. Different methods can yield very different results and some are much faster than others. See the aubio documentation for information on each method."} >
                <TextField
                  size="small"
                  style={{width: "8em" }}
                  id="pitchMethod"
                  label="Pitch method"
                  InputLabelProps={{ shrink: true, }}
                  InputProps={{ style: { fontSize: '0.75em' } }}
                  value={pitchMethod}
                  onChange={(e) => setPitchMethod(e.target.value as PitchMethod)}
                  select
                >
                  <MenuItem value={"default"}>default</MenuItem>
                  <MenuItem value={"schmitt"}>schmitt</MenuItem>
                  <MenuItem value={"fcomb"}>fcomb</MenuItem>
                  <MenuItem value={"mcomb"}>mcomb</MenuItem>
                  <MenuItem value={"specacf"}>specacf</MenuItem>
                  <MenuItem value={"yin"}>yin</MenuItem>
                  <MenuItem value={"yinfft"}>yinfft</MenuItem>
                </TextField>
                </Tooltip>
                <Tooltip arrow placement="top" title={"Convert your audio's pitch to a time series input, ready for processing."} >
                  <Button size='small' variant='contained' onClick={extractPitch}> Extract Pitch &nbsp; <Typography fontSize={"0.7em"} fontFamily={"monospace"} ref={pitchProgressRef}>(0%)</Typography></Button>
                </Tooltip>
                <Typography fontSize={"0.5em"}>Parseq uses <a href="https://github.com/qiuxiang/aubiojs">Aubio.js</a> extract pitch. This works best with isolated melodies (no beat).</Typography>
              </Stack>
            </Stack>
          }
        </TabPanel>
        <TabPanel index={2} activeTab={tab}>
          <Stack direction="row" alignItems={"center"} gap="1" >
            <input type="file" onChange={handleLoadFromCSV} />
            <FormControl fullWidth>
              <TextField value={timestampType}
                select
                label="Timestamp type"
                size='small'
                fullWidth={true}
                InputProps={{ style: { fontSize: '0.75em', width: '20em' } }}
                onChange={handleTimestampTypeChange}>
                <MenuItem value={TimestampType.Frame}>Frame</MenuItem>
                <MenuItem value={TimestampType.Millisecond}>Millisecond</MenuItem>
              </TextField>
            </FormControl>
          </Stack>
          <Typography fontSize="0.75em">Each row of the supplied file must be formatted like &nbsp;&nbsp; <span><code>timestamp,value</code></span> &nbsp;&nbsp; where the type of the timestamp can be milliseconds or frames as selected above.</Typography>
        </TabPanel>

        {/* <FormControl fullWidth>
            <InputLabel>Previously Loaded TimeSeries</InputLabel>
            <Select value={selectedTimeSeriesIndex} onChange={handleSelectTimeSeries}>
              {timeSeriesList.map((_, index) => (
                <MenuItem key={index} value={index}>
                  TimeSeries {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
        <h3>Processing</h3>
        <small><p>Modify the loaded data before adding it as a timeseries.</p></small>
        <Stack direction="row" alignItems={"center"} justifyContent="space-around" >
          <Box>
            <FormControlLabel
              style={{ fontSize: '0.75em', paddingLeft: '10px' }}
              control={
                <Checkbox
                  checked={abs}
                  onChange={(e) => setAbs(e.target.checked)}
                  size='small' />
              } label={<Box component="div" fontSize="0.75em">Absolute value</Box>} />
          </Box>
          <Box>
            <Typography fontSize={"0.8em"}>Smoothing:</Typography>
            <SmallTextField
              label="Window size"
              type="number"
              value={mAwindowSize}
              onChange={(e) => setMAwindowSize(e.target.value)}
            />
          </Box>
          <Box>
            <Typography fontSize={"0.8em"}>Exclude points beyond range:</Typography>
            <SmallTextField
              label="Filter Min"
              type="number"
              value={filterMin}
              onChange={(e) => setFilterMin(e.target.value)}
            />
            <SmallTextField
              label="Filter Max"
              type="number"
              value={filterMax}
              onChange={(e) => setFilterMax(e.target.value)}
            />
          </Box>
          <Box>
            <Typography fontSize={"0.8em"}>Clamp points to range:</Typography>
            <SmallTextField
              label="Limit Min"
              type="number"
              value={limitMin}
              onChange={(e) => setLimitMin(e.target.value)}
            />
            <SmallTextField
              label="Limit Max"
              type="number"
              value={limitMax}
              onChange={(e) => setLimitMax(e.target.value)}
            />
          </Box>
          <Box>
            <Typography fontSize={"0.8em"}>Normalise to range:</Typography>
            <SmallTextField
              label="Normalize Min"
              type="number"
              value={normalizeMin}
              onChange={(e) => setNormalizeMin(e.target.value)}
            />
            <SmallTextField
              label="Normalize Max"
              type="number"
              value={normalizeMax}
              onChange={(e) => setNormalizeMax(e.target.value)}
            />
          </Box>
        </Stack>
        <Button size='small' variant='contained' onClick={handleProcess} disabled={!rawTimeSeries} >Process</Button>
        <Line
          data={chartData}
          options={{
            parsing: false,
            //@ts-ignore
            normalised: true,
            spanGaps: true,
            aspectRatio: 4,
            responsive: true,
            animation: {
              duration: 175,
              delay: 0
            },
            cubicInterpolationMode: "monotone",
            stepped: 'true',
            plugins: {
              legend: {
                position: 'top' as const,
                labels: {
                  usePointStyle: true,
                }
              },
              decimation: {
                enabled: true,
                algorithm: 'lttb',
                threshold: DECIMATION_THRESHOLD,
                samples: DECIMATION_THRESHOLD,
              },
            },
            scales: {
              x: {
                type: 'linear',
                title: {
                  display: true,
                  text: (showValuesAtFrames || (rawTimeSeries?.timestampType === TimestampType.Frame)) ? "frame" : "ms"
                },
                ticks: {
                  minRotation: 0,
                  maxRotation: 0,
                },
                min: 0,
                //@ts-ignore
                max: showValuesAtFrames ? lastFrame : (chartData.datasets[0].data.at(-1)?.x) ?? lastFrame,
              },
              raw: {
                type: 'linear',
                position: 'left',
                title: {
                  text: 'raw',
                  display: true
                },
                ticks: {
                  minRotation: 0,
                  maxRotation: 0,
                },
              },
              processed: {
                type: 'linear',
                position: 'right',
                title: {
                  text: 'processed',
                  display: true,
                  color: 'red',
                },
                ticks: {
                  color: 'red',
                  minRotation: 0,
                  maxRotation: 0,
                },
              },
            },
          }}
        />
        <FormControlLabel
          style={{ fontSize: '0.75em', paddingLeft: '10px' }}
          control={
            <Checkbox
              checked={showValuesAtFrames}
              onChange={(e) => {
                setShowValuesAtFrames(e.target.checked);
              }}
              size='small' />
          } label={<Box component="div" fontSize="0.75em">Only show values at frame positions</Box>} />
      {status}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button variant='contained' onClick={handleAddTimeSeries} disabled={!processedTimeSeries || status.props['severity'] === 'error'} >Add Timeseries</Button>
      </DialogActions>

    </Dialog>
  </>;
};