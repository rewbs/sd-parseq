import React, { useState } from 'react';
import { TimeSeries, TimestampType, InterpolationType } from '../parseq-lang/parseq-timeseries';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Line } from 'react-chartjs-2';

export const TimeSeriesDialog = () => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [maxOffset, setMaxOffset] = useState('');
  const [timestampType, setTimestampType] = useState(TimestampType.Frame);
  const [timeSeriesList, setTimeSeriesList] = useState([]);
  const [selectedTimeSeriesIndex, setSelectedTimeSeriesIndex] = useState(-1);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Original',
        data: [],
        yAxisID: 'original',
      },
      {
        label: 'Processed',
        data: [],
        yAxisID: 'processed',
      },
    ],
  });

  const handleFileInput = (event: any) => {
    setFile(event.target.files[0]);
  };

  const handleMaxOffsetInput = (event: any) => {
    setMaxOffset(event.target.value);
  };

  const handleTimestampTypeChange = (event: any) => {
    setTimestampType(event.target.value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleLoad = async () => {
    if (file && maxOffset) {
      try {
        TimeSeries.loadFromCSV(file, Number(maxOffset), timestampType).then((timeSeries) => {

          //@ts-ignore
          setTimeSeriesList([...timeSeriesList, timeSeries]);
          setSelectedTimeSeriesIndex(timeSeriesList.length);
          updateChartData(timeSeries);
        }).catch((error) => {
          console.error('Error loading TimeSeries:', error);
        });
      } catch (error) {
        console.error('Error loading TimeSeries:', error);
      }
    };
  };

  const updateChartData = (timeSeries: TimeSeries) => {
    const data = {
      labels: timeSeries.data.map((d) => d.timestamp),
      datasets: [
        {
          label: 'Original',
          data: timeSeries.data.map((d) => d.value),
          yAxisID: 'original',
        },
        {
          label: 'Processed',
          data: timeSeries
            .filter(/*minValue=*/ 0.1, /*maxValue=*/ 0.9)
            .limit(/*minValue=*/ 0, /*maxValue=*/ 1)
            .normalize()
            .data.map((d) => d.value),
          yAxisID: 'processed',
        },
      ],
    };
    setChartData(data);
  };

  const handleSelectTimeSeries = (event: any) => {
    setSelectedTimeSeriesIndex(event.target.value);
    updateChartData(timeSeriesList[event.target.value]);
  };

  return (
    <div>
      <Button variant="outlined" onClick={handleOpen}>
        Load TimeSeries
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Load TimeSeries from CSV</DialogTitle>
        <DialogContent>
          <input type="file" onChange={handleFileInput} />
          <TextField
            label="Max Offset"
            value={maxOffset}
            onChange={handleMaxOffsetInput}
            type="number"
          />
          <FormControl fullWidth>
            <InputLabel>Timestamp Type</InputLabel>
            <Select value={timestampType}
              onChange={handleTimestampTypeChange}>
              <MenuItem value={TimestampType.Frame}>Frame</MenuItem>
              <MenuItem value={TimestampType.Millisecond}>Millisecond</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Previously Loaded TimeSeries</InputLabel>
            <Select value={selectedTimeSeriesIndex} onChange={handleSelectTimeSeries}>
              {timeSeriesList.map((_, index) => (
                <MenuItem key={index} value={index}>
                  TimeSeries {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoad}>Load</Button>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <Line
        data={chartData}
        options={{
          scales: {
            original: {
              type: 'linear',
              position: 'left',
            },
            processed: {
              type: 'linear',
              position: 'right',
            },
          },
        }}
      />
    </div>
  );
};