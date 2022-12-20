import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { getDownloadURL, getStorage, ref as storageRef, uploadString } from "firebase/storage";
import * as React from 'react';
import { useState } from 'react';
//@ts-ignore
import { useUserAuth } from "./../UserAuthContext";

type MyProps = {
    docId: DocId,
    renderedJson: string
    autoUpload: boolean
};

let _lastUploadAttempt = '';

export function UploadButton({ docId, renderedJson, autoUpload }: MyProps) {

    const [uploadStatus, setUploadStatus] = useState(<></>);
    const { user } = useUserAuth();
    
    function upload(): void {
        try {
            _lastUploadAttempt = renderedJson;
            setUploadStatus(<Alert severity='info'>Upload in progress...<CircularProgress size='1em' /></Alert>);
            const storage = getStorage();
            const objectPath = `rendered/${docId}.json`;
            const sRef = storageRef(storage, objectPath);
            uploadString(sRef, renderedJson, "raw", { contentType: 'application/json' }).then((snapshot) => {
                getDownloadURL(sRef).then((url) => {
                    const matchRes = url.match(/rendered%2F(doc-.*?\.json)/);
                    if (matchRes && matchRes[1]) {
                        setUploadStatus(<Alert severity="success">Rendered output <a href={url}>available here</a>.</Alert>);
                    } else {
                        setUploadStatus(<Alert severity="error">Unexpected upload path: {url}</Alert>);
                        return;
                    }
                });
            });
        } catch (e: any) {
            console.error(e);
            setUploadStatus(<Alert severity="error">Upload failed: {e.toString()}</Alert>);
        }
    }

    if (autoUpload) {
        if (_lastUploadAttempt !== renderedJson) {
            setTimeout(() => upload(), 100);
        }
    }
   
    return (<Box sx={{ display:'flex', justifyContent:"left", gap:1, alignItems:'center'}}>
        <Button style={{marginTop:'5px'}} size="small" variant="contained" disabled={!user} onClick={() => upload()}>⬆️ Upload output</Button>
        {user ?
            uploadStatus
            :
            <Alert variant='outlined' severity="warning">Please log in (top right) to be enabled output uploads.</Alert>
        }

    </Box>);
}