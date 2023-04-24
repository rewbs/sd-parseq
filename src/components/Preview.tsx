import { Slider } from "@mui/material";
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { useState } from 'react';
import { percentageToColor } from "../utils/utils";

interface PreviewProps {
    data: RenderedData
}

export function Preview(props: PreviewProps) {

    const [frame, setFrame] = useState(0);

    const keyframes = props.data.keyframes;
    const renderedFrames = props.data.rendered_frames;
    const renderedFramesMeta = props.data.rendered_frames_meta;

    if (!keyframes) {
        return;
    }

    const half = Math.ceil(props.data.managedFields.length / 2);
    const fields1 = props.data.managedFields.slice(0, half);
    const fields2 = props.data.managedFields.slice(half);

    return <Grid xs={12} container style={{ margin: 0, padding: 0, marginRight: 1 }}>
        <Grid xs={12} sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center', gap: 1 }}>
            <TextField
                type="number"
                size="small"
                style={{ paddingBottom: '0px', width: '5em' }}
                label={"Frame"}
                inputProps={{ style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                InputLabelProps={{ shrink: true, }}
                value={frame}
                onChange={(e: any) => setFrame(e.target?.value)} />
            <Slider
                size="small"
                step={1}
                value={frame}
                min={0}
                max={keyframes[keyframes.length - 1].frame}
                onChange={(e: any) => setFrame(e.target?.value)}
                valueLabelDisplay="auto" />
        </Grid>
        {
            [fields1, fields2].map((fields, col) =>
                <Grid xs={6} key={fields.join('_').substring(5)+'_'+col}>
                    <div style={{ fontSize: "0.7em", fontFamily: "monospace" }}>
                        <ul>
                            {
                                fields.map((field, index) => {

                                    //@ts-ignore
                                    const valueAsPercent = (renderedFrames[frame][field] - renderedFramesMeta[field].min) / (renderedFramesMeta[field].max - renderedFramesMeta[field].min) * 100;
                                    return <li key={`${field}_${col}_${index}`}>
                                        <div style={{
                                            float: 'none',
                                            overflow: 'visible',
                                            backgroundColor: percentageToColor(valueAsPercent / 100, 100, 0, 0.5),
                                            width: (valueAsPercent + '%')
                                        }} >
                                            {field}&nbsp;:&nbsp;{renderedFrames[frame][field].toFixed(4)}&nbsp;&nbsp;(Δ&nbsp;{renderedFrames[frame][field+'_delta'].toFixed(4)})
                                        </div>
                                    </li>
                                })
                            }
                        </ul>
                    </div>
                </Grid>
            )}
        <Grid xs={12}>
            <TextField
                multiline
                minRows={2}
                maxRows={16}
                size="small"
                fullWidth={true}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true, style: { fontFamily: 'Monospace', fontSize: '0.75em' } }}
                value={renderedFrames[frame].deforum_prompt}
                label={`Prompt [frame ${frame}]`}
                variant="outlined"
            />
        </Grid>
    </Grid>


}