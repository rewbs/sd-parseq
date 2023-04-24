import { Button } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
//@ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
//@ts-ignore
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';

//import 'wavesurfer.js/dist/wavesurfer.min.css';

interface AudioWaveformProps {
  audioBuffer: AudioBuffer;
  initialSelection: { start: number, end: number }
  onSelectionChange: (start: number, end: number) => void;
}

const WavesurferAudioWaveform = ({ audioBuffer, initialSelection, onSelectionChange }: AudioWaveformProps) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const [playbackStart, setPlaybackStart] = useState<number>(initialSelection.start);
  const [isPlaying, setIsPlaying] = useState(false);


  useEffect(() => {
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    if (waveformRef.current) {
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        plugins: [
          RegionsPlugin.create({
            maxRegions: 1,
            dragSelection: {
              slop: 5
            }
          }),
          TimelinePlugin.create({
            container: '#timeline_dialog',
          }),
        ],
        normalize: true
      });

      waveSurferRef.current = wavesurfer;

      wavesurfer.on("ready", () => {
        console.log("WaveSurfer is ready");
        if (waveSurferRef.current) {
          waveSurferRef.current.regions.add({
            start: initialSelection.start/1000,
            end: Math.min(initialSelection.end/1000, waveSurferRef.current.getDuration()),
            loop: false,
            drag: true,
            resize: false,
            color: 'hsla(200, 50%, 70%, 0.2)',
          })
          setIsPlaying(false);
        }
      });
      wavesurfer.on('region-created', (region: any) => {
        const newStart = Math.floor(region.start * 1000);
        const newEnd = Math.floor(region.end * 1000);
        onSelectionChange(newStart, newEnd);
        setPlaybackStart(region.start);
      });
      wavesurfer.on('region-updated', (region: any) => {
        const newStart = Math.floor(region.start * 1000);
        const newEnd = Math.floor(region.end * 1000);
        onSelectionChange(newStart, newEnd);
        setPlaybackStart(region.start);
      });
      wavesurfer.on("finish", (data) => {
        setIsPlaying(false);
      });
      
      wavesurfer.loadDecodedBuffer(audioBuffer);

    }

  }, [audioBuffer, initialSelection, onSelectionChange]);

  return (
    <div>
      <div ref={waveformRef} id="waveform_dialog" />
      <div id="timeline_dialog" />
      <Button size="small" variant='outlined' onClick={(e) => {
        if (isPlaying) {
          waveSurferRef.current?.pause();
        } else {
          waveSurferRef.current?.play(playbackStart??0);
        }
        setIsPlaying(!isPlaying);
      }}>
        {isPlaying ? "⏸️ Pause" : "▶️ Play"}
      </Button>
    </div>
  );
};

export default WavesurferAudioWaveform;