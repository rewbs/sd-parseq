
import { Typography } from '@mui/material';
import { experimental_extendTheme as extendTheme } from "@mui/material/styles";
import {
  forwardRef,
  useImperativeHandle,
  useRef
} from 'react';
import { themeFactory } from "../theme";

// This is an "editor" from ag-grid's perspective, but is actually
// a read-only view of the prompt at this cell.
export const PromptCellEditor = forwardRef((props: any, ref) => {
  const refText = useRef<HTMLDivElement | null>(null);
  const theme = extendTheme(themeFactory());

  /* Component Editor Lifecycle methods */
  useImperativeHandle(ref, () => {
    return {
      getValue() {
        return props.value;
      },
    };
  });


  const [positivePrompt, negativePrompt] = props.value.split('--neg');

  return (
    <div
      ref={refText}
      className='ag-custom-component-popup prompt-details'
      style={{
        border: '1px solid #00c',
        padding: '2px',
        background: theme.vars.palette.background.paper,
        overflow: 'wrap',
      }}
    >
      <div
      style = {{userSelect: 'text'}}>
      <Typography  fontSize={'1.1em'} fontFamily={'monospace'} color={theme.vars.palette.positive.main}> {positivePrompt}</Typography>
      {
        negativePrompt && <>
          <Typography fontSize={'1.1em'} fontFamily={'monospace'} color={theme.vars.palette.text.primary }>--neg</Typography>
          <Typography  fontSize={'1.1em'} fontFamily={'monospace'} color={theme.vars.palette.negative.main} >{negativePrompt}</Typography>
        </>
      }
      </div>
    </div>
  );
});
