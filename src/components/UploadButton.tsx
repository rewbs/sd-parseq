import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
//@ts-ignore
import ReactTimeAgo from 'react-time-ago';
import { useUserAuth } from "../UserAuthContext";

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

    useEffect(() => onNewUploadStatus(uploadStatus), [uploadStatus, onNewUploadStatus]);

    function upload(): void {
        if (!user) {
            setUploadStatus(<Alert severity="error">Sign in above to upload.</Alert>);
            return;
        }
        //console.log(user);
        try {
            _lastUploadAttempt = renderedJson;
            setUploadStatus(<Button size="small" variant="outlined" color='warning' ><CircularProgress size='1em' style={{ marginRight: '0.5em' }} /> Uploading...</Button>)
            const storage = getStorage();
            const objectPath = `rendered/${user.uid}/${docId}.json`;
            const sRef = storageRef(storage, objectPath);
            const uploadTask = uploadBytesResumable(sRef, new Blob([renderedJson], { type: 'application/json' }));
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadStatus(<Button size="small" variant="outlined" color='warning' ><CircularProgress size='1em' style={{ marginRight: '0.5em' }} /> {Math.round(progress)}%</Button>)
                },
                (error) => {
                    console.error(error);
                    setUploadStatus(<Alert severity="error"><Typography fontSize='0.75em' >Upload failed: {error.toString()}</Typography></Alert>);
                },
                () => {
                    getDownloadURL(sRef).then((url) => {
                        setUploadStatus(
                            <Stack direction={'column'}>
                                <CopyToClipboard text={url}>
                                    <Button size="small" variant="outlined">✅ Copy URL</Button>
                                </CopyToClipboard>
                                <Typography fontSize={'0.7em'}><a rel="noreferrer" target={'_blank'} href={url}>See uploaded file</a></Typography>
                            </Stack>);
                        setLastUploadTime(Date.now());
                    });
                }
            );
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
        <Button size="small" variant="contained" disabled={!user} onClick={() => upload()}> {user ? "⬆️ Upload output" : "⬆️ Sign in to upload"}</Button>
        {lastUploadTime ? <Typography fontSize='0.7em' >Last uploaded: <ReactTimeAgo date={lastUploadTime} locale="en-US" />.</Typography> : <></>}
    </Stack>;
}