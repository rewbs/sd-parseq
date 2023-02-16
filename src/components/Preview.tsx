import { Slider, Typography } from "@mui/material";
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { useState } from 'react';
import { percentageToColor } from "../utils";

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

    const half = Math.ceil(props.data.interpolatableFields.length / 2);
    const fields1 = props.data.interpolatableFields.slice(0, half);
    const fields2 = props.data.interpolatableFields.slice(half);


    return <Grid xs={12} container style={{ margin: 0, padding: 0, marginRight: 1 }}>
        <Grid xs={12} sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center', gap: 1}}>
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
            [fields1, fields2].map((fields) =>
            <Grid xs={6}>
            <Typography fontSize={"0.7em"} fontFamily={"monospace"}>
                <ul>
                    {
                        fields.map(field => {
                        
                            //@ts-ignore
                            const valueAsPercent = (renderedFrames[frame][field.name]-renderedFramesMeta[field.name].min)/(renderedFramesMeta[field.name].max-renderedFramesMeta[field.name].min)*100;
                        return <li>
                            <div style={{
                                 float:'none',
                                 overflow:'visible',
                                 backgroundColor: percentageToColor(valueAsPercent/100, 100, 0, 0.5),
                                 width: (valueAsPercent +'%') }} >
                                {field.name}&nbsp;:&nbsp;{renderedFrames[frame][field.name].toFixed(4)}
                            </div>
                        </li>
                        })
                    }
                </ul>
            </Typography>
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