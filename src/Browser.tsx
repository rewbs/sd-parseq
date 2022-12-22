import { Box, Button, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Unstable_Grid2';
import { useLiveQuery } from "dexie-react-hooks";
import React from 'react';
import ReactTimeAgo from 'react-time-ago';
import Header from './components/Header';
import { db } from './db';

export const getLatestVersion = async (docId: DocId): Promise<ParseqDocVersion | undefined> => {
    // Load latest version of doc
    const versions = await db.parseqVersions.where('docId').equals(docId).reverse().sortBy('timestamp');
    if (versions.length > 0) {
        return versions[0];
    }
}

export default function Browser() {

    const allDocsAllVersion = useLiveQuery(
        async () => {
            const allDocs = await db.parseqDocs.reverse().sortBy('timestamp');
            return await Promise.all(allDocs.map(async (d) => ({
                doc: d,
                versions: await db.parseqVersions.where('docId').equals(d.docId).reverse().sortBy('timestamp')
            })));
        }, []
    );
    const showBorders = { border: '1px solid', borderColor: 'divider' };

    return <>
        <Header title="Parseq - local storage browser" />
        <Grid container paddingLeft={5} paddingRight={5} spacing={2}>
            <CssBaseline />
            <Grid xs={12}>
                <a href='/'>⬅️ Home</a>
                <p>Here is a list of all the Parseq docs in your browser local storage:</p>
            </Grid>
            <Grid container xs={12}>
                <Grid xs={2} sx={showBorders}><strong>Doc</strong></Grid>
                <Grid xs={2} sx={showBorders}><strong>Version</strong></Grid>
                <Grid xs={8} sx={showBorders}><strong>Details</strong></Grid>
            </Grid>
            {
                allDocsAllVersion?.map((a) => {
                    return <Grid container xs={12}>
                        {a.versions.flatMap((v) => [
                            <Grid xs={2} sx={showBorders}>{a.doc.name} <small style={{ display: 'none' }} >({a.doc.docId})</small></Grid>,
                            <Grid xs={2} sx={showBorders}>
                                <ReactTimeAgo date={v.timestamp} locale="en-US" />
                                <Typography fontSize={'0.6em'}>
                                    <p>{new Date(v.timestamp).toLocaleString( 'sv', { timeZoneName: 'short' } )}</p>
                                    <p>UTC: {new Date(v.timestamp).toISOString()}</p>
                                    <small style={{ display: 'none' }}>({v.versionId})</small>
                                </Typography>
                            </Grid>,
                            <Grid xs={8} sx={showBorders}>
                                <p style={{ fontSize: '0.75em', color: 'DarkGreen', whiteSpace: 'pre-line' }} >{v.prompts.positive}</p>
                                <p style={{ fontSize: '0.75em', color: 'Firebrick', whiteSpace: 'pre-line'  }} >{v.prompts.negative}</p>
                                <Button id={'toggle_' + v.versionId} variant='outlined' style={{ fontSize: '0.75em' }} onClick={(e) => {
                                    const pre = e.currentTarget.parentElement?.querySelector('pre');
                                    if (pre) {
                                        pre.style.display = pre.style.display === 'none' ? 'block' : 'none';
                                    }

                                }} >Toggle raw data</Button>
                                <Box bgcolor={'ghostwhite'}>
                                    <pre style={{ display: 'none', fontSize: '0.75em' }} >{JSON.stringify(v, undefined, 2)}</pre>
                                </Box>
                            </Grid>])}
                    </Grid>
                })
            }
        </Grid>
    </>;

}