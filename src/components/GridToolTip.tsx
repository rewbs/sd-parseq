import { experimental_extendTheme as extendTheme } from "@mui/material/styles";
import { frameToBeat, frameToSec } from '../utils/maths';
import { themeFactory } from "../theme";

export const GridTooltip = (props : any) => {
    const column = props.colDef.field;
    const data = props.api.getDisplayedRowAtIndex(props.rowIndex).data;
    const theme = extendTheme(themeFactory());
    
    return (
      <div style={{ backgroundColor: theme.vars.palette.background.paper, padding: '5px', borderWidth: '1px', borderStyle:'solid',  borderColor: theme.vars.palette.info.main }}>
        <strong>{column?.endsWith('_i')?column.slice(0, -2):column}</strong>
        <div>Frame: {data?.frame}</div>
        <div>Seconds: {data && frameToSec(data.frame, props.getFps()).toFixed(3)}</div>
        <div>Beat:  {data && frameToBeat(data?.frame, props.getFps(), props.getBpm()).toFixed(3)}</div>
        <div>Info:  {data?.info ? data.info : ""}</div>
      </div>
    );
  };