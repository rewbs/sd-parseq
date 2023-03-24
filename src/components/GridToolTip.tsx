import { frameToBeats, frameToSeconds } from '../utils/maths';

export const GridTooltip = (props : any) => {
    const data = props.api.getDisplayedRowAtIndex(props.rowIndex).data;
    return (
      <div style={{ backgroundColor: '#d0ecd0' }}>
        <div>Frame: {data.frame}</div>
        <div>Seconds: {frameToSeconds(data.frame, props.getFps()).toFixed(3)}</div>
        <div>Beat:  {frameToBeats(data.frame, props.getFps(), props.getBpm()).toFixed(3)}</div>
        <div>Info:  {data.info ? data.info : ""}</div>
      </div>
    );
  };