import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faBook, faBug, faFilm, faWaveSquare, faMoon, faLightbulb, faKeyboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Link, Stack, SupportedColorScheme, Typography, useColorScheme, useMediaQuery } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { getAnalytics, isSupported } from "firebase/analytics";
import GitInfo from 'react-git-info/macro';
import Login from "../Login";
import { UserAuthContextProvider } from "../UserAuthContext";
import { app, auth } from '../firebase-config';
import { getVersionNumber, getModifierKey } from '../utils/utils';
import { useLocation } from 'react-router-dom';
import { UserSettings } from '../UserSettings';
import { useEffect, useState } from 'react';
import { KeyBadge } from './KeyBadge';

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


export default function Header() {

    const displayDate = GIT_COMMIT_DATE;
    const displayBranch = (!GIT_BRANCH || GIT_BRANCH === 'master') ? '' : `Branch: ${GIT_BRANCH};`;
    const commitLink = <Link href={"https://github.com/rewbs/sd-parseq/commit/" + GIT_COMMIT_HASH}>{GIT_COMMIT_SHORTHASH}</Link>
    const changeLogLink = <Link href={"https://github.com/rewbs/sd-parseq/commits/" + (GIT_BRANCH ?? '')}>all changes</Link>
    const environment = (process.env.NODE_ENV === 'development' ? 'dev' : getEnvFromHostname()) ;

    const [openHotkeysDialog, setOpenHotkeysDialog] = useState(false);

    function getEnvFromHostname() {
        const hostname = window.location.hostname;
        if (hostname.includes('--dev')) {
            return 'dev (hosted)';
        }
        if (hostname.includes('--staging')) {
            return 'staging (hosted)';
        }
        if (hostname === 'sd-parseq.web.app') {
            return 'production';
        }
        return 'unknown';
    }

    const { colorScheme, setColorScheme } = useColorScheme();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    // Retrieve color scheme setting from local db if any, and apply.
    // Else, use browser settings, and default to light.
    useEffect(() => {
        UserSettings.getColorScheme().then((colorScheme) => {
            if (colorScheme !== undefined) {
                console.log("Setting color scheme based on local db");
                setColorScheme(colorScheme as SupportedColorScheme);
            } else if (prefersDarkMode) {
                console.log("Setting color scheme based prefers-color-scheme");
                setColorScheme('dark');
            } else {
                console.log("defaulting to light scheme");
                setColorScheme('light');
            }
        })}, [prefersDarkMode, setColorScheme]);

    const location = useLocation();
    // Don't render a header in raw view.
    if (location.pathname === '/raw') {
        return <></>
    }

    return (
        <Grid container paddingLeft={5} paddingRight={5} paddingBottom={1}>
            <Grid xs={6}>
                <h2> 
                    Parseq <small>v{getVersionNumber()}</small>
                    <Typography fontSize='0.4em'>
                        [{environment}] {displayBranch} Built {displayDate} ({commitLink} - {changeLogLink})
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
                    {/* @ts-ignore */}
                    <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" clickable icon={<FontAwesomeIcon icon={colorScheme === 'dark'?faLightbulb:faMoon} />} label={(colorScheme === 'dark'?"Light":"Dark")+" Mode"}
                        onClick={() => {
                            console.log("Setting color scheme");
                            const newColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
                            setColorScheme(newColorScheme);
                            UserSettings.setColorScheme(newColorScheme);
                        }} 
                    /> 
                    <Chip style={{paddingLeft:'2px'}} size='small' variant="outlined" component="a" clickable icon={<FontAwesomeIcon  size='2xs' icon={faKeyboard} />} label="Hotkeys"
                        onClick={() => setOpenHotkeysDialog(true)}
                    />

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
                <Dialog maxWidth='md' fullWidth={true} open={openHotkeysDialog} onClose={() => setOpenHotkeysDialog(false)}>
                    <DialogTitle><FontAwesomeIcon  size='2xs' icon={faKeyboard} /> Keyboard shortcuts</DialogTitle>
                    <DialogContent>
                        <h3>Editing</h3>
                        <ul>
                            <li><KeyBadge>{getModifierKey()}</KeyBadge>+<KeyBadge>z</KeyBadge>: Undo</li>
                            <li><KeyBadge>{getModifierKey()}</KeyBadge>+<KeyBadge>shift</KeyBadge>+<KeyBadge>z</KeyBadge>: Undo</li>
                        </ul>
                        <h3>Audio playback</h3>
                        <ul>
                            <li><KeyBadge>space</KeyBadge>: Play/pause</li>
                            <li><KeyBadge>shift</KeyBadge>+<KeyBadge>space</KeyBadge>: Play from start</li>
                            <li><KeyBadge>ctrl</KeyBadge>+<KeyBadge>space</KeyBadge>: Play from cursor</li>
                            <li><KeyBadge>ctrl</KeyBadge>+<KeyBadge>a</KeyBadge>: Add event marker at cursor position</li>
                        </ul>
                        <h3>Graph & audio views</h3>
                        <ul>
                            <li><KeyBadge>shift</KeyBadge>+<KeyBadge>↑</KeyBadge>: Zoom in</li>
                            <li><KeyBadge>shift</KeyBadge>+<KeyBadge>↓</KeyBadge>: Zoom out</li>
                            <li><KeyBadge>shift</KeyBadge>+<KeyBadge>←</KeyBadge>: Scroll left</li>
                            <li><KeyBadge>shift</KeyBadge>+<KeyBadge>→</KeyBadge>: Scroll right</li>
                        </ul>
                        <DialogActions>
                            <Button variant='contained' onClick={()=>setOpenHotkeysDialog(false)}>Close</Button>
                        </DialogActions>
                    </DialogContent>
                </Dialog>
            </Grid>
        </Grid>
    );
}