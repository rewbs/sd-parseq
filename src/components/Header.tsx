import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Chip, Typography, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoffee, faBook, faBug } from '@fortawesome/free-solid-svg-icons'
import { faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons'
import { UserAuthContextProvider } from "../UserAuthContext";
import Login from "../Login";
import { auth, app} from '../firebase-config';
import GitInfo from 'react-git-info/macro';
import '../robin.css';
import {isSupported, getAnalytics} from "firebase/analytics";
import { getVersionNumber } from '../utils/utils';

var analytics: any;
isSupported().then((isSupported) => { 
    if (isSupported) { 
        analytics = getAnalytics(app); 
    } else {
        analytics = null;
    }
});

const gitInfo = GitInfo();
const GIT_BRANCH = gitInfo.branch;
const GIT_COMMIT_HASH = gitInfo.commit.hash;
const GIT_COMMIT_SHORTHASH = gitInfo.commit.shortHash;
const GIT_COMMIT_DATE = gitInfo.commit.date;

type MyProps = {
    title: string
};

// TODO: separate React UI component from the service class.
export default function Header({ title }: MyProps) {

    const displayDate = GIT_COMMIT_DATE;
    const displayBranch = (!GIT_BRANCH || GIT_BRANCH === 'master') ? '' : `Branch: ${GIT_BRANCH};`;
    const commitLink = <a href={"https://github.com/rewbs/sd-parseq/commit/" + GIT_COMMIT_HASH}>{GIT_COMMIT_SHORTHASH}</a>
    const changeLogLink = <a href={"https://github.com/rewbs/sd-parseq/commits/" + (GIT_BRANCH ?? '')}>all changes</a>

    return (
        <Grid container paddingLeft={5} paddingRight={5}>
            <Grid xs={6}>
                <h2>
                    {title} <small>v{getVersionNumber()}</small>
                    <Typography fontSize='0.4em'>
                        [{process.env.NODE_ENV}] {displayBranch} Built {displayDate} ({commitLink} - {changeLogLink})
                    </Typography>
                </h2>
                <Box display='none'>
                    <Typography fontSize='0.4em'>
                        App: {JSON.stringify(app, undefined, 2)}
                        Analytics: {JSON.stringify(analytics, undefined, 2)}
                        Auth: {JSON.stringify(auth, undefined, 2)}
                    </Typography>
                </Box>
            </Grid>
            <Grid xs={6} display='flex' justifyContent="right" gap={1} alignItems='center'>
                <Chip variant="outlined" component="a" href="https://github.com/rewbs/sd-parseq#readme" clickable icon={<FontAwesomeIcon icon={faBook} />} label="Docs" />
                <Chip variant="outlined" component="a" href="https://github.com/rewbs/sd-parseq/issues" clickable icon={<FontAwesomeIcon icon={faBug} />} label="Bugs" />
                <Chip variant="outlined" component="a" href="https://github.com/rewbs/sd-parseq" clickable icon={<FontAwesomeIcon icon={faGithub} />} label="Code" />
                <Chip variant="outlined" component="a" href="https://discord.gg/deforum" clickable icon={<FontAwesomeIcon icon={faDiscord} />} label="Chat" />
                <Chip variant="outlined" component="a" href="https://www.buymeacoffee.com/rewbs" clickable icon={<FontAwesomeIcon icon={faCoffee} />} label="Coffee" />
                <UserAuthContextProvider>
                    <Login />
                </UserAuthContextProvider>
            </Grid>
        </Grid>
    );
}