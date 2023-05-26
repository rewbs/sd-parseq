import { CssBaseline } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import Header from "./components/Header";

const Labs = () => {

    return <>
        <Header title="Parseq Labs (experiments)" />
        <Grid container paddingLeft={5} paddingRight={5} spacing={2} sx={{
            '--Grid-borderWidth': '1px',
            borderTop: 'var(--Grid-borderWidth) solid',
            borderLeft: 'var(--Grid-borderWidth) solid',
            borderColor: 'divider',
            '& > div': {
                borderLeft: 'var(--Grid-borderWidth) solid',
                borderRight: 'var(--Grid-borderWidth) solid',
                borderBottom: 'var(--Grid-borderWidth) solid',
                borderColor: 'divider',
            },
        }}>
            <CssBaseline />
            <Grid padding={2} xs={12}>
            </Grid>
        </Grid>
    </>
}

export default Labs;