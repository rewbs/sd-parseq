import { frameToBeats, frameToSeconds } from '../utils/maths';

export const GridTooltip = (props : any) => {
    const column = props.colDef.field;
    const data = props.api.getDisplayedRowAtIndex(props.rowIndex).data;

    
    return (
      <div style={{ backgroundColor: '#d0ecd0' }}>
        <strong>{column?.endsWith('_i')?column.slice(0, -2):column}</strong>
        <div>Frame: {data?.frame}</div>
        <div>Seconds: {data && frameToSeconds(data.frame, props.getFps()).toFixed(3)}</div>
        <div>Beat:  {data && frameToBeats(data?.frame, props.getFps(), props.getBpm()).toFixed(3)}</div>
        <div>Info:  {data?.info ? data.info : ""}</div>
      </div>
    );
  };