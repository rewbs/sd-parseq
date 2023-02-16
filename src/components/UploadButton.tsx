import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CopyToClipboard from 'react-copy-to-clipboard';
import { getDownloadURL, getStorage, ref as storageRef, uploadString } from "firebase/storage";
import { useEffect, useState } from 'react';
//@ts-ignore
import { useUserAuth } from "../UserAuthContext";
import ReactTimeAgo from 'react-time-ago';

type UploadButtonProps = {
    docId: DocId,
    renderedJson: string
    autoUpload: boolean,
    onNewUploadStatus: (status: JSX.Element) => void
};

let _lastUploadAttempt = '';

export function UploadButton({ docId, renderedJson, autoUpload, onNewUploadStatus }: UploadButtonProps) {

    const [uploadStatus, setUploadStatus] = useState(<></>); 
    const [lastUploadTime, setLastUploadTime] = useState(0);
    //@ts-ignore
    const { user } = useUserAuth();


    // useEffect(() => {
    //     if (!user) {
    //         setUploadStatus(<Alert severity="error">Sign in above to upload.</Alert>);
    //     } else {
    //         setUploadStatus(<></>);
    //     }
    // }, []);
    useEffect(() => onNewUploadStatus(uploadStatus), [uploadStatus]);

    function upload(): void {
        if (!user) {
            setUploadStatus(<Alert severity="error">Sign in above to upload.</Alert>);
            return;
        }
        try {
            _lastUploadAttempt = renderedJson;
            setUploadStatus(<Button size="small" variant="outlined" color='warning' ><CircularProgress size='1em' style={{marginRight:'0.5em'}} /> Uploading...</Button>)
            const storage = getStorage();
            const objectPath = `rendered/${docId}.json`;
            const sRef = storageRef(storage, objectPath);
            uploadString(sRef, renderedJson, "raw", { contentType: 'application/json' }).then((snapshot) => {
                getDownloadURL(sRef).then((url) => {
                    const matchRes = url.match(/rendered%2F(doc-.*?\.json)/);
                    if (matchRes && matchRes[1]) {
                        //setUploadStatus(<Alert severity="success">Rendered output <a href={url}>available here</a>. </Alert>);
                        setUploadStatus(
                            <Stack direction={'column'}>
                             <CopyToClipboard text={url}>
                                  <Button size="small"  variant="outlined">✅ Copy URL</Button>
                              </CopyToClipboard>
                                <Typography fontSize={'0.7em'}><a target={'_blank'} href={url}>See uploaded file</a></Typography>
                            </Stack>);
                        setLastUploadTime(Date.now());
                    } else {
                        setUploadStatus(<Alert severity="error"><Typography fontSize='0.75em' >Unexpected upload path: {url}</Typography></Alert>);
                        return;
                    }
                });
            });
        } catch (e: any) {
            console.error(e);
            setUploadStatus(<Alert severity="error"><Typography fontSize='0.75em' >Upload failed: {e.toString()}</Typography></Alert>);
        }
    }

    if (autoUpload
        && user
        && _lastUploadAttempt !== renderedJson) {
        setTimeout(() => upload(), 100);
    }
    
   
    return <Stack>
            <Button size="small" variant="contained" disabled={!user} onClick={() => upload()}> {user ? "⬆️ Upload output" : "⬆️ Sign in to upload" }</Button>
            {lastUploadTime ? <Typography fontSize='0.7em' >Last uploaded: <ReactTimeAgo date={lastUploadTime} locale="en-US" />.</Typography> : <></>}
        </Stack>;
}