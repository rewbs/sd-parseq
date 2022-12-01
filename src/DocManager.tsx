import React, { useState, useEffect, ReactElement } from 'react';
import { TextField, FormControlLabel, Checkbox, Button, Dialog, DialogTitle, DialogContentText, DialogContent, DialogActions } from '@mui/material';
import { generateDocName } from './doc-name-generator'
import { v4 as uuidv4 } from 'uuid';
import Dexie, { Table, Version, } from 'dexie';
import { useLiveQuery } from "dexie-react-hooks";
import ReactTimeAgo from 'react-time-ago'
import TimeAgo from 'javascript-time-ago'
import equal from 'fast-deep-equal';
import debounce from 'lodash.debounce';

export class ParseqDexie extends Dexie {
    parseqVersions!: Table<ParseqDocVersion>;
    parseqDocs!: Table<ParseqDoc>;

    constructor() {
        super('parseqDB');
        this.version(1).stores({
            parseqVersions: 'versionId, docId, timestamp',
            parseqDocs: 'docId, name'
        });
    }
}
export const db = new ParseqDexie();
const MAX_DOCS = 100; // Number of docs to store
const MAX_VERSIONS = 25; // Number of historical versions of doc to store

export const makeDocId = (): DocId => "doc-" + uuidv4() as DocId
const makeVersionId = (): VersionId => "version-" + uuidv4() as VersionId



export const loadVersion = async (docId: DocId, versionId?:VersionId): Promise<ParseqDocVersion | undefined> => {
    if (versionId) {
        // Load a specific version of doc.
        // Verion IDs are globally unique, so we can just lookup by the versionId (no need to check docId).
        return db.parseqVersions.get(versionId);
    } else {
        // Load latest version of doc
        const versions = await db.parseqVersions.where('docId').equals(docId).reverse().sortBy('timestamp');
        if (versions.length > 0) {
            return versions[0];
        }
    }
}

export const saveVersion = async (docId: DocId, content: ParseqPersistableState) => {
    console.time("Save");
    //Deep-compare content to previous version so we don't save consecutive identical versions.
    const lastVersion = await loadVersion(docId);
    if (lastVersion 
        && Object.keys(content)
            .filter((k) => k !== 'meta') // exclude this field because it has a timestamp that is expected to change.
            .every((k) => equal(content[k as keyof ParseqPersistableState], lastVersion[k as keyof ParseqPersistableState]))) {
        console.log("Not saving, would be identical to previous version.");
    } else {
        const version: ParseqDocVersion = {
            docId: docId,
            versionId: makeVersionId(),
            timestamp: Date.now(),
            ...content
        }    
        console.log("Saving: ", version);
        console.timeEnd("Save");
        return db.parseqVersions.add(version, version.versionId);
    }
    
}



type MyProps = {
    docId: DocId;
    onLoadContent: (latestVersion?: ParseqDocVersion) => void;
};

// TODO: separate React UI component from the service class.
export function DocManagerUI({ docId, onLoadContent }: MyProps) { 

    const [openRevertDialog, setOpenRevertDialog] = useState(false);
    const [selectedVersionIdForRevert, setSelectedVersionIdForRevert] = useState<VersionId>();
    const [openLoadDialog, setOpenLoadDialog] = useState(false);
    const [selectedDocIdForLoad, setSelectedDocIdForLoad] = useState<DocId>();
    const [openShareDialog, setOpenShareDialog] = useState(false);
    const [lastModified, setLastModified] = useState(0);
    const [activeDoc, setActiveDoc] = useState({docId : docId, name: "loading"} as ParseqDoc);

    const activeDocSetter = useLiveQuery(
        async () => {
            const doc = await db.parseqDocs.get(docId)
            if (doc) {
                console.log(`Doc ${docId} loaded: `, doc);
                setActiveDoc(doc);
                return doc;
            } else {
                let newDoc = { name: generateDocName(), docId: docId };
                console.log(`Creating new ${docId}: `, newDoc);                
                await db.parseqDocs.put(newDoc, docId);
                setActiveDoc(newDoc);
                return newDoc;
            }
        }, [docId]);
    const docVersions = useLiveQuery(
        async () => {
            if (activeDoc) {
                const versions = await db.parseqVersions.where('docId').equals(activeDoc.docId).reverse().sortBy('timestamp');
                versions && versions.length > 0 && setLastModified(versions[0].timestamp);
                return versions;
            } else {
                return [];
            }
        },
        [activeDoc]
    );
    const allDocsWithInfo = useLiveQuery(
        async () => {
            const alldocs = await db.parseqDocs.toArray();
            return Promise.all(alldocs.map(async (doc) => {
                const versions = await db.parseqVersions.where('docId').equals(doc.docId).reverse().sortBy('timestamp');
                if (!versions || versions.length === 0) {
                    return undefined;
                }
                return {
                    ...doc,
                    lastModified: versions[0].timestamp,
                    versionCount: versions.length
                }
            }));
        }, []
    );

    const handleClickOpenRevertDialog = (): void => {
        setOpenRevertDialog(true);
    };
    const handleCloseRevertDialog = (e: any): void => {
        setOpenRevertDialog(false);
        if (e.target.id === "revert" && selectedVersionIdForRevert) {
            console.log(selectedVersionIdForRevert);
            loadVersion(activeDoc.docId, selectedVersionIdForRevert).then((version) => {
                console.log(version);
                onLoadContent(version);
            });
        }  
    };
    const revertDialog = <Dialog open={openRevertDialog} onClose={handleCloseRevertDialog}>
        <DialogTitle>Revert to a previous version</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Revert to the version of <strong>{activeDoc?.name}</strong> saved at...:
            </DialogContentText>
            <TextField style={{ marginTop: 20 }}
                id="doc-history"
                select
                label="History"
                value={selectedVersionIdForRevert}
                onChange={(e) => setSelectedVersionIdForRevert(e.target.value as VersionId)}
                SelectProps={{ native: true, style: {fontSize: "0.75em"} }}
                >
                {
                    docVersions?.map((version: ParseqDocVersion) => (
                        <option key={version.timestamp} value={version.versionId}>
                            {new Date(version.timestamp).toISOString() + " (" + new TimeAgo("en-US").format(version.timestamp) + ")"}
                        </option>
                    ))
                }
            </TextField>
        </DialogContent>
        <DialogActions>
            <Button id="cancel_revert" onClick={handleCloseRevertDialog}>Cancel</Button>
            <Button variant="contained" id="revert" onClick={handleCloseRevertDialog}>Revert</Button>
        </DialogActions>
    </Dialog>

    const handleClickOpenLoadDialog = (): void => {
        setOpenLoadDialog(true);
    };
    const handleCloseLoadDialog = (e: any): void => {
        setOpenLoadDialog(false);
        if (e.target.id === "load" && selectedDocIdForLoad) {
            const qps = new URLSearchParams(window.location.search);
            qps.delete("docId");
            qps.set("docId", selectedDocIdForLoad);
            const newUrl = window.location.href.split("?")[0] + "?" + qps.toString()
            window.location.assign(newUrl);
        }  
    };

    const loadDialog = <Dialog open={openLoadDialog} onClose={handleCloseLoadDialog}>
        <DialogTitle>Load a Parseq document</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Switch to a Parseq doc you were working on previously on this system:
            </DialogContentText>
            <TextField style={{ marginTop: 20 }}
                id="doc-load"
                select
                label="Local storage"
                value={selectedDocIdForLoad}
                onChange={(e) => setSelectedDocIdForLoad(e.target.value as DocId)}
                SelectProps={{ native: true, style: {fontSize: "0.75em"} }}
                >
                {
                    allDocsWithInfo?.sort((a:any,b:any) => {
                            if (a && b) {
                              return b.lastModified - a.lastModified;
                            } else if (a) {
                                return -1;
                            } else if (b) {
                                return 1;
                            } else {
                                return 0;
                            }
                        }).map((d) => (
                        d ? <option key={d.docId} value={d.docId}>
                            {d.name 
                                + " (saves: " + d.versionCount.toString()
                                + ", last saved: " + ((d.lastModified) ?  new TimeAgo("en-US").format(d.lastModified) + ")" : "never)")}
                        </option>
                        : <></>
                    ))
                }
            </TextField>
        </DialogContent>
        <DialogActions>
            <Button id="cancel_revert" onClick={handleCloseLoadDialog}>Cancel</Button>
            <Button variant="contained" id="load" onClick={handleCloseLoadDialog}>Load</Button>
        </DialogActions>
    </Dialog>

const handleClickOpenShareDialog = (): void => {
    setOpenLoadDialog(true);
};
const handleCloseShareDialog = (e: any): void => {
    setOpenLoadDialog(false);
};

const shareDialog = <Dialog open={openShareDialog} onClose={handleCloseShareDialog}>
    <DialogTitle>Load a Parseq document</DialogTitle>
    <DialogContent>
        <DialogContentText>
            Import this into Parseq on another system:
        </DialogContentText>
        <TextField style={{ marginTop: 20 }}
            id="doc-share"
            select
            label="Parseq Document"
            
            >
        </TextField>
    </DialogContent>
    <DialogActions>
        <Button id="done_share" onClick={handleCloseLoadDialog}>Done</Button>
    </DialogActions>
</Dialog>    

    return <div>
        {revertDialog}
        {loadDialog}
        {shareDialog}
        <TextField
            id="doc-name"
            label="Doc name"
            value={activeDoc?.name}
            InputProps={{ style: { fontSize: '0.75em' } }}
            size="small"
            onChange={debounce((e: any) => (db.parseqDocs.put({ name: e.target.value, docId: docId }, docId)), 200)}
        />
        {
            // <FormControlLabel  style={{ marginLeft: 10}}  control={<Checkbox defaultChecked />} label="Sync to Google Drive" /> 
        }
        <Button variant="outlined" disabled={!docVersions || docVersions.length < 1} onClick={handleClickOpenRevertDialog} style={{ marginLeft: 10 }}>Revert...</Button>
        <Button variant="outlined" onClick={handleClickOpenLoadDialog} style={{ marginLeft: 10 }}>Load...</Button>
        <Button variant="contained" onClick={handleClickOpenShareDialog} style={{ marginLeft: 10 }}>Share...</Button>
        <br /><small><small>Last saved: {lastModified ? <ReactTimeAgo date={lastModified} locale="en-US" /> : "never"} </small></small>
    </div>
}