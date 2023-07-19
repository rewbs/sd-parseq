import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faBook, faBug, faFilm, faWaveSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Chip, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { getAnalytics, isSupported } from "firebase/analytics";
import GitInfo from 'react-git-info/macro';
import Login from "../Login";
import { UserAuthContextProvider } from "../UserAuthContext";
import { app, auth } from '../firebase-config';
import '../robin.css';
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
    title: string,
    darkMode: boolean,
    updateDarkMode: (darkMode: boolean) => void
};

export default function Header({ title, darkMode, updateDarkMode  }: MyProps) {

    const displayDate = GIT_COMMIT_DATE;
    const displayBranch = (!GIT_BRANCH || GIT_BRANCH === 'master') ? '' : `Branch: ${GIT_BRANCH};`;
    const commitLink = <a href={"https://github.com/rewbs/sd-parseq/commit/" + GIT_COMMIT_HASH}>{GIT_COMMIT_SHORTHASH}</a>
    const changeLogLink = <a href={"https://github.com/rewbs/sd-parseq/commits/" + (GIT_BRANCH ?? '')}>all changes</a>

    return (
        <Grid container paddingLeft={5} paddingRight={5} paddingBottom={1}>
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
            <Grid xs={6} display='flex' justifyContent="right">
                <Stack  justifyContent="right" gap={1} alignItems={{ sm: 'stretch', md: 'center' }}  direction={{  xs: 'column-reverse', sm: 'column-reverse', md: 'row' }}>
                {darkMode && <Chip variant="outlined" component="a" clickable onClick={() => updateDarkMode(false)} icon={<FontAwesomeIcon icon={faLightbulb} />} label="Light Mode" />}
                {!darkMode && <Chip variant="outlined" component="a" clickable onClick={() => updateDarkMode(true)} icon={<FontAwesomeIcon icon={faMoon} />} label="Dark Mode" />}
                <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" href="https://www.youtube.com/playlist?list=PLXbx1PHKHwIHsYFfb5lq2wS8g1FKz6aP8" clickable icon={<FontAwesomeIcon  size='2xs' icon={faFilm} />} label="Tutorial" />
                <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" href="https://github.com/rewbs/sd-parseq#readme" clickable icon={<FontAwesomeIcon size='2xs' icon={faBook} />} label="Docs" />
                <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" href="/functionDocs" clickable icon={<FontAwesomeIcon size='2xs' icon={faWaveSquare} />} label="Reference" />
                <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" href="https://github.com/rewbs/sd-parseq/issues" clickable icon={<FontAwesomeIcon  size='2xs' icon={faBug} />} label="Bugs" />
                <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" href="https://github.com/rewbs/sd-parseq" clickable icon={<FontAwesomeIcon  size='2xs' icon={faGithub} />} label="Code" />
                <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" href="https://discord.gg/deforum" clickable icon={<FontAwesomeIcon  size='2xs' icon={faDiscord} />} label="Chat" />
                <UserAuthContextProvider>
                    <Login />
                </UserAuthContextProvider>
                </Stack>
            </Grid>
        </Grid>
    );
}