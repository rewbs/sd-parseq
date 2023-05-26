import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { faBroom, faCopy, faDownload, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Unstable_Grid2';
import { ImportOptions, exportDB, importInto, peakImportFile } from "dexie-export-import";
import { useLiveQuery } from "dexie-react-hooks";
import { saveAs } from 'file-saver';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import ReactTimeAgo from 'react-time-ago';
import { useEffectOnce } from 'react-use';
import { DocId, ParseqDoc, ParseqPrompts, VersionId } from './ParseqUI';
import Header from './components/Header';
import LinearProgressWithLabel from './components/LinearProgressWithLabel';
import { SmallTextField } from './components/SmallTextField';
import { TabPanel } from './components/TabPanel';
import { db } from './db';
import { isStoragePersisted, showEstimatedQuota, persist } from './persistance';
import { navigateToClone, smartTrim } from './utils/utils';
import prettyBytes from 'pretty-bytes';
import React from 'react';

function VersionCount({ docId }: { docId: DocId }) {
    const [versionCount, setVersionCount] = useState(<Typography>loading...</Typography>);
    db.parseqVersions.where("docId").equals(docId).count().then(
        (count) => setVersionCount(<Typography>{count}</Typography>)
    )
    return versionCount;
}


export default function Browser() {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeTab, setActiveTab] = useState(1);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchParams, setSearchParams] = useSearchParams();

    const [loadedDocs, setLoadedDocs] = useState(0);
    const [totalDocs, setTotalDocs] = useState(0);
    const [mostRecentVersions, setMostRecentVersions] = useState([]);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedDoc, setSelectedDoc] = useState(searchParams.get('selectedDocId'));
    const [totalVersions, setTotalVersions] = useState(0);
    const [loadedVersions, setLoadedVersions] = useState(0);    

    const [exportProgress, setExportProgress] = useState(0);
    const [importProgress, setImportProgress] = useState(0);
    const [activity, setActivity] = useState<'exporting' | 'importing' | 'deleting' | 'cleaning' | undefined>();
    const [importableBlob, setImportableBlob] = useState<Blob | undefined>();
    const [dbOperationStatus, setDbOperationStatus] = useState(<></>);

    const [confirmImportDialogOpen, setConfirmImportDialogOpen] = useState(false);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);

    const [validateDelete, setValidateDelete] = useState('');
    const [validateImport, setValidateImport] = useState('');
    const [validateSingleDelete, setValidateSingleDelete] = useState('');
    const [cleanStatus, setCleanStatus] = useState("");

   const [isPersisted, setIsPersisted] = useState<boolean|undefined>();
   const [storageQuota, setStorageQuota] = useState<StorageEstimate|undefined>();

    useEffect(() => {
        isStoragePersisted().then((persisted) => setIsPersisted(persisted));
        showEstimatedQuota().then((quota) => setStorageQuota(quota));
    }, []);


    useEffectOnce(() => {
        db.parseqDocs.count().then(count => setTotalDocs(count));
        const resultMap = new Map<DocId, any>();
        db.parseqDocs.orderBy('timestamp').reverse().toArray().then(docs =>
            docs.forEach((doc: ParseqDoc) => {
                if (doc.latestVersionId) {
                    db.parseqVersions.get(doc.latestVersionId).then((version) => {
                        const condensed = {
                            timestamp: doc.timestamp,
                            docId: doc.docId,
                            docName: doc.name,
                            prompts: version.prompts,
                            timeSeriesNames: version.timeSeries?.map((ts: any) => ts.alias),
                            managedFields: version.managedFields
                        };
                        resultMap.set(doc.docId, condensed);
                        setLoadedDocs(resultMap.size);
                        //@ts-ignore
                        setMostRecentVersions(Array.from(resultMap.values()));    
                    }).catch((e) => {
                        console.error(e)
                    });
                }
            })
        ).catch((e) => {
            console.error(e)
        });
    });

    const selectedDocVersions = useLiveQuery(
        async () => {
            if (selectedDoc) {
                const versions: any[] = [];
                setTotalVersions(await db.parseqVersions.where('docId').equals(selectedDoc).count());
                await db.parseqVersions.where('docId').equals(selectedDoc).each(
                    (version: ParseqDocVersion) => {
                        const condensed = {
                            timestamp: version.timestamp,
                            docId: version.docId,
                            docName: version.meta.docName,
                            prompts: version.prompts,
                            timeSeriesNames: version.timeSeries.map((ts: any) => ts.alias),
                            managedFields: version.managedFields
                        };
                        versions.push(condensed);
                        setLoadedVersions(versions.length);
                    });
                versions.sort((a, b) => b.timestamp - a.timestamp);
                return versions;
            } else {
                return [];
            }
        }, [selectedDoc]
    );

    const doImport = useCallback(async () => {
        if (!importableBlob) {
            return;
        }
        setActivity('importing');
        setDbOperationStatus(<Alert severity='info'>Importing...</Alert>)
        try {
            const importOptions: ImportOptions = {
                progressCallback: updateImportProgress,
                clearTablesBeforeImport: true, // TODO: explore setting to false and allow DB merge.
                acceptVersionDiff: true
            }
            await importInto(db, importableBlob, importOptions);
            setDbOperationStatus(<Alert severity='success'>Import complete.</Alert>)
        } catch (error) {
            setDbOperationStatus(<Alert severity='error'>Import failed: {error?.toString()}</Alert>)
            console.error(error);
        } finally {
            setImportableBlob(undefined);
            setActivity(undefined);
        }
    }, [importableBlob]);

    const onConfirmImportDialogClose = useCallback((event: any) => {
        setConfirmImportDialogOpen(false);
        if (event?.target?.id === "import") {
            doImport();
        }
    }, [doImport]);

    const confirmImportDialog = useMemo(() => <Dialog
        open={confirmImportDialogOpen}
        onClose={onConfirmImportDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
    >
        <DialogTitle id="alert-dialog-title">
            {"Do you want to overwrite your Parseq data?"}
        </DialogTitle>
        <DialogContent>
            <DialogContentText id="alert-dialog-description">
                Importing a new Parseq database will completely delete all your existing Parseq data. We strongly suggest creating an export of your existing data before overwriting it with an import.
            </DialogContentText>
            <Stack paddingTop={'10px'} direction={'row'} alignItems={'center'} spacing={1}>
                <Typography fontSize={"0.9em"}>Type <em>confirmed</em> here to proceed:</Typography>
                <SmallTextField
                    value={validateImport}
                    onChange={(e) => setValidateImport(e.target.value)}
                />
            </Stack>            
        </DialogContent>
        <DialogActions>
            <Button variant='contained' onClick={onConfirmImportDialogClose} autoFocus>Keep my data</Button>
            <Button variant='outlined'  disabled={validateImport !== 'confirmed'}  id='import' onClick={onConfirmImportDialogClose}>
                ⚠️ Overwrite all my Parseq data
            </Button>
        </DialogActions>
    </Dialog>, [confirmImportDialogOpen, validateImport, onConfirmImportDialogClose]);


    function onConfirmDeleteDialogClose(event: any) {
        setConfirmDeleteDialogOpen(false);
        if (event?.target?.id === "delete") {
            setActivity('deleting');
            db.delete().then(() => {
                console.log("Database successfully deleted");
                setDbOperationStatus(<Alert severity='success'>DB deleted.</Alert>)
            }).catch((err) => {
                setDbOperationStatus(<Alert severity='error'>DB deletion failed: {err?.toString()}</Alert>)
                console.error("Could not delete database: ", err);
            }).finally(() => {
                setActivity(undefined);
            });
        }
    }
    const confirmDeleteDialog = useMemo(() => <Dialog
        open={confirmDeleteDialogOpen}
        onClose={onConfirmDeleteDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
    >
        <DialogTitle id="alert-dialog-title">
            {"🗑️ Do you want to delete your Parseq data?"}
        </DialogTitle>
        <DialogContent>
            <DialogContentText id="alert-dialog-description">
                You are about to completely delete all your local Parseq data.
            </DialogContentText>
            
            <Stack paddingTop={'10px'} direction={'row'} alignItems={'center'} spacing={1}>
                <Typography fontSize={"0.9em"}>Type <em>confirmed</em> here to proceed:</Typography>
                <SmallTextField
                    value={validateDelete}
                    onChange={(e) => setValidateDelete(e.target.value)}
                />
            </Stack>
        </DialogContent>

        <DialogActions>
            <Button variant='contained' onClick={onConfirmDeleteDialogClose} autoFocus>Keep my data</Button>
            <Button variant='outlined' disabled={validateDelete !== 'confirmed'} id='delete' onClick={onConfirmDeleteDialogClose}>
                🗑️ Delete all my Parseq data from this browser
            </Button>
        </DialogActions>
    </Dialog>, [confirmDeleteDialogOpen, validateDelete]);


    const updateExportProgress = ({ totalRows, completedRows }: { totalRows: any, completedRows: number }): boolean => {
        setExportProgress(100 * completedRows / totalRows);
        return true;
    }

    const updateImportProgress = ({ totalRows, completedRows }: { totalRows: any, completedRows: number }): boolean => {
        setImportProgress(100 * completedRows / totalRows);
        return true;
    }



    return <React.StrictMode>
        <Header title="Parseq - local storage browser" />
        <Grid container paddingLeft={5} paddingRight={5} spacing={2}>
            <CssBaseline />
            <Grid xs={12}>
                <a href={'/' + (searchParams.get('refDocId') ? '?docId=' + searchParams.get('refDocId') : '')}>⬅️ Home</a>
            </Grid>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label="Browse documents" value={1} />
                    <Tab label="Manage database" value={3} />
                </Tabs>
            </Box>
            <TabPanel activeTab={activeTab} index={1}>
                <Grid container xs={12}>
                    {
                        selectedDoc &&
                        <>
                            <Grid xs={12}>
                                Loaded {loadedVersions}/{totalVersions} versions.
                            </Grid>
                            {
                                selectedDocVersions &&
                                <>
                                    <Grid xs={12}>
                                        <ul>
                                            <li>Showing {selectedDocVersions?.length} versions for document: <strong>{selectedDocVersions[0]?.docName}</strong></li>
                                            <li><a href={'/Browser?refDocId=' + searchParams.get('refDocId')} >Back to recent docs</a></li>
                                        </ul>
                                    </Grid>
                                    <Grid xs={12}>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><strong>Version date</strong></TableCell>
                                                        <TableCell><strong>Prompts</strong></TableCell>
                                                        <TableCell><strong>Timeseries</strong></TableCell>
                                                        <TableCell><strong>Managed fields</strong></TableCell>
                                                        <TableCell><strong>Actions</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {
                                                        selectedDocVersions.map((v: any) => {
                                                            return <tr>
                                                                <TableCell>
                                                                    <ReactTimeAgo
                                                                        date={v.timestamp}
                                                                        tooltip={true}
                                                                        locale="en-GB" />
                                                                    <Typography fontSize={"0.75em"}>{new Date(v.timestamp).toLocaleString("en-GB", { dateStyle: 'full', timeStyle: 'medium' })}</Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {Array.isArray(v.prompts) ? v.prompts.map((p: any, idx: number) => <>
                                                                        <Typography fontSize={'0.75em'}><strong>Prompt {idx + 1}:</strong> {v.prompts[idx].from} - {v.prompts[idx].to}</Typography> 
                                                                        {getPromptSummary(v.prompts, idx, false)}
                                                                    </>)
                                                                        : getPromptSummary(v.prompts, 0, false)
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography fontSize='0.75em'>{v.timeSeriesNames?.length}</Typography>
                                                                    <Typography fontSize='0.75em'>{v.timeSeriesNames.join(',')}</Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Tooltip title={v.managedFields?.join(',')}>
                                                                        <Typography fontSize='0.75em'>{v.managedFields?.length}</Typography>
                                                                    </Tooltip>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Stack spacing={1}>
                                                                        <Tooltip title="Clone this version to a new document">
                                                                            <Button
                                                                                onClick={() => {
                                                                                    navigateToClone(v.docId, v.versionId);
                                                                                }}
                                                                                size='small' variant='outlined'><FontAwesomeIcon icon={faCopy} />&nbsp;Clone</Button>
                                                                        </Tooltip>
                                                                    </Stack>
                                                                </TableCell>
                                                            </tr>
                                                        })
                                                    }
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        <Stack paddingTop={'10px'} direction="row" spacing={1} alignItems="center">
                                            <Typography fontSize={"0.9em"}>Permanently deleted this document and all its versions? Type <em>confirmed</em> here to proceed:</Typography>
                                            <SmallTextField
                                                value={validateSingleDelete}
                                                onChange={(e) => setValidateSingleDelete(e.target.value)}
                                            />
                                            <Button
                                                color='error'
                                                variant='contained'
                                                disabled={validateSingleDelete !== 'confirmed'}
                                                onClick={async () => {
                                                    await db.transaction('rw', db.parseqDocs, db.parseqVersions, async () => {
                                                        db.parseqDocs.delete(selectedDoc);
                                                        db.parseqVersions.bulkDelete(selectedDocVersions);
                                                    });
                                                    const qps = new URLSearchParams(window.location.search);
                                                    qps.delete("selectedDocId");
                                                    const newUrl = window.location.href.split("?")[0] + "?" + qps.toString();
                                                    window.location.assign(newUrl);
                                                }}>
                                                <FontAwesomeIcon icon={faTrash} />&nbsp;Delete this document
                                            </Button>
                                        </Stack>                                        
                                    </Grid>
                                </>
                            }
                        </>
                    }
                    {!selectedDoc && <>
                        <Grid xs={12}>
                            Loaded {loadedDocs}/{totalDocs} documents.
                        </Grid>
                        Most recently edited:
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Doc (click to open)</strong></TableCell>
                                        <TableCell><strong>Last modified</strong></TableCell>
                                        <TableCell><strong>Prompts</strong></TableCell>
                                        <TableCell><strong>Timeseries</strong></TableCell>
                                        <TableCell><strong>#&nbsp;Versions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {
                                        mostRecentVersions ?
                                            mostRecentVersions.map((v: any) => {
                                                return <TableRow>
                                                    <TableCell><a href={'/?docId=' + v.docId}>{v.docName}</a></TableCell>
                                                    <TableCell>
                                                        <ReactTimeAgo date={v.timestamp} locale="en-US" />
                                                        <Typography fontSize={"0.75em"}>{new Date(v.timestamp).toLocaleString("en-GB", { dateStyle: 'full', timeStyle: 'medium' })}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {Array.isArray(v.prompts) ? v.prompts.map((p: any, idx: number) => <>
                                                            <Typography fontSize={'0.75em'}><strong>Prompt {idx + 1}:</strong> {v.prompts[idx].from} - {v.prompts[idx].to}</Typography> 
                                                            {getPromptSummary(v.prompts, idx, false)}
                                                        </>)
                                                            : getPromptSummary(v.prompts, 0, false)
                                                        }
                                                    </TableCell>
                                                    <TableCell>{v.timeSeriesNames?.length}</TableCell>
                                                    <TableCell><VersionCount docId={v.docId} /><a href={'/browser?refDocId=' + searchParams.get('refDocId') + '&selectedDocId=' + v.docId}>show</a></TableCell>
                                                </TableRow>
                                            }) : <></>

                                    }
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                    }

                </Grid>
            </TabPanel>
            <TabPanel activeTab={activeTab} index={2}>
                    {
                    //TODO: search
                    }
            </TabPanel>
            <TabPanel activeTab={activeTab} index={3}>
                <Grid container spacing={3}>
                    <Grid xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center"  >
                            <Typography>Persistence enabled: { isPersisted+'' }</Typography>
                            <Typography>Estimated quota usage: { storageQuota ? `${prettyBytes(storageQuota.usage||0)} of ${prettyBytes(storageQuota.quota||0)} (${(100*(storageQuota.usage||0)/(storageQuota.quota||1)).toFixed(2)}%)` : '?' }</Typography>
                            { (isPersisted === false) &&
                                <Button
                                    variant='contained'
                                    size='small'
                                    onClick={async () => {
                                        await persist();
                                        setIsPersisted(!await isStoragePersisted());
                                        setStorageQuota(await showEstimatedQuota());
                                    }}
                                >Enable persistence</Button>
                            }
                        </Stack>
                    </Grid>
                    <Grid xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant='contained'
                                disabled={activity !== undefined}
                                onClick={async () => {
                                    setActivity('exporting')
                                    setDbOperationStatus(<Alert severity='info'>Preparing export...</Alert>)
                                    try {
                                        const blob = await exportDB(db, { progressCallback: updateExportProgress, numRowsPerChunk: 10 });
                                        saveAs(blob, "parseq-db-export.json");
                                        setDbOperationStatus(<Alert severity='success'>Export downloading now.</Alert>)
                                    } catch (error) {
                                        console.error(error);
                                        setDbOperationStatus(<Alert severity='error'>Export failed: {error?.toString()}</Alert>)
                                    } finally {
                                        setActivity(undefined);
                                    }
                                }
                                }>
                                <FontAwesomeIcon icon={faDownload} />&nbsp;Export Parseq database
                            </Button>
                            {activity === 'exporting' &&
                                <span>
                                    <Typography fontSize={'0.75em'}>Preparing export: </Typography>
                                    <LinearProgressWithLabel value={exportProgress} />
                                </span>
                            }
                        </Stack>
                    </Grid>
                    <Grid xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {confirmImportDialog}
                            <Button
                                component="label"
                                variant='outlined'
                                disabled={activity !== undefined}>
                                <FontAwesomeIcon icon={faUpload} />&nbsp;Import Parseq database
                                <input hidden type="file" accept='.json'
                                  onClick={
                                    //@ts-ignore
                                    e => e.target.value = null // Ensures onChange fires even if same file is re-selected.
                                  }
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) {
                                        console.log("No file selected");
                                        setImportableBlob(undefined);
                                        return;
                                    }
                                    const blob = new Blob([file], { type: file.type });
                                    const importMeta = await peakImportFile(blob);
                                    if (!importMeta || importMeta?.formatName !== 'dexie' || importMeta.data.databaseName !== 'parseqDB') {
                                        console.error("Not a Parseq database", importMeta);
                                        setDbOperationStatus(<Alert severity='warning'>Selected file seemed invalid. See console for details.</Alert>);
                                        setImportableBlob(undefined);
                                        return;
                                    }
                                    setImportableBlob(blob);
                                    setValidateImport('');
                                    setConfirmImportDialogOpen(true);
                                }} />                                
                            </Button>
                            {activity === 'importing' &&
                                <span>
                                    <Typography fontSize={'0.75em'}>Importing: </Typography>
                                    <LinearProgressWithLabel value={importProgress} />
                                </span>
                            }
                        </Stack>
                    </Grid>
                    <Grid xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant='contained'
                                color='warning'
                                disabled={activity !== undefined}
                                onClick={ async ()  => {
                                    setActivity('cleaning')
                                    setDbOperationStatus(<Alert severity='info'>DB cleanup in progres...</Alert>)
                                    try {
                                        let docCount = 0;
                                        let versionCount = 0;
                                        let deletableDocs : DocId[] = [];
                                        let deletableVersions : VersionId[] = [];
                                        
                                        // Walk all documents...
                                        const allDocs = await db.parseqDocs.toArray();
                                        for (const doc of allDocs) {
                                            const docVersions = db.parseqVersions.where('docId').equals(doc.docId); 
                                            const timeToVersion: Map<number, VersionId> = new Map();
                                            
                                            // Build a timestamp -> versionId map for all saves of this doc.
                                            // eslint-disable-next-line no-loop-func
                                            await docVersions.each((version) => {
                                                timeToVersion.set(version.timestamp, version.versionId);
                                                versionCount++;
                                            });

                                            if (timeToVersion.size < 1) {
                                                // If there are no saves, delete the doc. 
                                                console.log("Document with no versions:", doc.docId);
                                                deletableDocs.push(doc.docId);
                                            } else if (timeToVersion.size === 1) {
                                                // If there is only 1 save and it's over 1 week old, delete the doc and the version.
                                                const time = timeToVersion.keys().next().value;
                                                if (Date.now() - time > 7 * 24 * 60 * 60 * 1000) {
                                                    console.log("Document with single version with timestamp older than 7d:", doc.docId);
                                                    deletableDocs.push(doc.docId);
                                                    //@ts-ignore
                                                    deletableVersions.push(timeToVersion.get(time));
                                                }
                                            } else if (timeToVersion.size > 65) {
                                                // If there are more than 65 saves, keep the 15 most recent and another 50 evenly spaced out.

                                                // Sort the timestamps in descending order, take the 15 most recent timestamps,
                                                // and the rest for further processing.
                                                const sortedTimestamps = Array.from(timeToVersion.keys()).sort((a, b) => b - a);
                                                const mostRecentTimestamps = sortedTimestamps.slice(0, 15);
                                                let remainingTimestamps = sortedTimestamps.slice(15);

                                                while (remainingTimestamps.length > 50) {
                                                    // Calculate the total time span and each interval length
                                                    const oldestTimestamp = _.last(remainingTimestamps)||0;
                                                    const newestTimestamp = _.first(remainingTimestamps)||0;
                                                    const totalSpan = newestTimestamp - oldestTimestamp; 
                                                    const intervalLength = totalSpan / 50;                                                            
                                                    // Group remaining timestamps by interval                                                            
                                                    const groupedTimestamps = _.groupBy(remainingTimestamps, (timestamp) =>
                                                        Math.floor((timestamp - oldestTimestamp) / intervalLength)
                                                    );
                                                    // find interval with most timestamps
                                                    const biggestBucket = _.maxBy(Object.values(groupedTimestamps), (timestamps) => timestamps.length) || [];
                                                    // remove the median value from the biggest bucket
                                                    const medianTimestamp = _.sortBy(biggestBucket)[Math.floor(biggestBucket.length / 2)];
                                                    remainingTimestamps.splice(remainingTimestamps.indexOf(medianTimestamp), 1);
                                                }

                                                // Combine the two lists and return the result
                                                const timestampsToKeep = [...mostRecentTimestamps, ...remainingTimestamps];
                                                const timestampsToDelete = _.difference(sortedTimestamps, timestampsToKeep);
                                                const versionsToDelete = timestampsToDelete.flatMap((timestamp) => (timestamp && timeToVersion.has(timestamp)) ? [timeToVersion.get(timestamp)] : []);
                                                console.log(`Document ${doc.name} has ${timeToVersion.size} versions, will be reduced to ${timestampsToKeep.length}.`, );
                                                //@ts-ignore
                                                deletableVersions.push(...versionsToDelete);
                                            }
                                            setCleanStatus(`Analysed ${++docCount} documents and ${versionCount} saves. Found ${deletableDocs.length} documents and ${deletableVersions.length} saves to delete.`);
                                        }

                                        await db.transaction('rw', db.parseqDocs, db.parseqVersions, async () => {
                                            db.parseqDocs.bulkDelete(deletableDocs);
                                            db.parseqVersions.bulkDelete(deletableVersions);
                                        });
                                        setDbOperationStatus(<Alert severity='success'>DB cleanup complete.</Alert>);

                                    } catch (error) {
                                        setDbOperationStatus(<Alert severity='error'>DB cleanup failed.</Alert>);
                                        console.error(error);
                                    } finally {
                                        setActivity(undefined);
                                    }
                                }}>

                                <FontAwesomeIcon icon={faBroom} />&nbsp;Clean Parseq Database</Button>
                            <Typography>{cleanStatus}</Typography>
                        </Stack>
                    </Grid>
                    <Grid xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {confirmDeleteDialog}
                            <Button
                                color='error'
                                variant='contained'
                                disabled={activity !== undefined}
                                onClick={() => {
                                    setValidateDelete('');
                                    setConfirmDeleteDialogOpen(true);
                                }}>
                                <FontAwesomeIcon icon={faTrash} />&nbsp;Delete Parseq database
                            </Button>
                        </Stack>
                    </Grid>
                    <Grid xs={12}>
                        {dbOperationStatus}
                    </Grid>
                </Grid>
            </TabPanel>

        </Grid>
    </React.StrictMode>;

}

function getPromptSummary(prompts: ParseqPrompts, offset: number, trim: boolean): JSX.Element | undefined {
    if (Array.isArray(prompts)) {
        return <>
            <Tooltip title={prompts[offset]?.positive}>
                <Typography fontSize='0.75em' color='DarkGreen'>
                    {smartTrim(prompts[offset]?.positive, trim ? 80 : Number.MAX_SAFE_INTEGER)}
                </Typography>
            </Tooltip>
            <Tooltip title={prompts[offset]?.negative}>
                <Typography fontSize='0.75em' color='Firebrick' >
                    {smartTrim(prompts[offset]?.negative, trim ? 80 : Number.MAX_SAFE_INTEGER)}
                </Typography>
            </Tooltip>
        </>

    } else {
        // Old style single prompt (backwards compat)
        return <>
            <Tooltip title={prompts.positive}>
                <Typography fontSize='0.75em' color='DarkGreen'>
                    {smartTrim(prompts.positive, trim ? 80 : Number.MAX_SAFE_INTEGER)}
                </Typography>
            </Tooltip>
            <Tooltip title={prompts.negative}>
                <Typography fontSize='0.75em' color='Firebrick' >
                    {smartTrim(prompts.negative, trim ? 80 : Number.MAX_SAFE_INTEGER)}
                </Typography>
            </Tooltip>
        </>
    }
}