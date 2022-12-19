import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
//@ts-ignore
import { useUserAuth } from "./../UserAuthContext";

type MyProps = {
    docId: DocId,
    renderedJson: string
    autoUpload: boolean
};

// TODO: separate React UI component from the service class.
export function UploadButton({ docId, renderedJson, autoUpload }: MyProps) {

    const [uploadStatus, setUploadStatus] = useState(<></>);
    const [resourceUrl, setResourceUrl] = useState('');
    const { user } = useUserAuth();

    function upload(): void {
        try {
            setUploadStatus(<Alert severity='info'>Upload in progress...<CircularProgress size='1em' /></Alert>);
            const storage = getStorage();
            const objectPath = `rendered/${docId}.json`;
            const sRef = storageRef(storage, objectPath);
            uploadString(sRef, renderedJson, "raw", { contentType: 'application/json' }).then((snapshot) => {
                getDownloadURL(sRef).then((url) => {
                    setResourceUrl(url);
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
        //upload()
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