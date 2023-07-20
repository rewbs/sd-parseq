/* eslint-disable react/jsx-no-target-blank */
import { faPatreon } from '@fortawesome/free-brands-svg-icons';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Chip, Fade, Link, Stack, Typography } from '@mui/material';

import { supporterList } from '../data/supporterList';
import { useEffect, useState } from 'react';
import _ from 'lodash';

const SUPPORTER_DISPLAY_SECONDS = 10;
const DEFAULT_SUPPORTER = { name: '(Your name here? Click to find out more. :) )', link: 'https://www.patreon.com/rewbs' };

const Supporters = () => {
    const [supporter, setSupporter] = useState<{name:string, link:string}>(DEFAULT_SUPPORTER);
    const [shuffledSupporterList, setShuffledSupporterList] = useState(_.shuffle(supporterList));
    const [fadeIn, setFadeIn] = useState(true);

    const fadeSupporterTo = (supporter : {name:string, link:string}) => {
        setFadeIn(false);
        setTimeout(() => {
            setFadeIn(true);
            setSupporter(supporter);
        }, 200);
    }

    useEffect(() => {
        const timeout = setInterval(() => {
            const newSupporter = shuffledSupporterList.pop();
            if (newSupporter) {
                fadeSupporterTo(newSupporter);
            } else {
                fadeSupporterTo(DEFAULT_SUPPORTER);
                setShuffledSupporterList(_.shuffle(supporterList));
            }
        }, SUPPORTER_DISPLAY_SECONDS * 1000);
        return () => clearInterval(timeout);
    }, [shuffledSupporterList])

    return <Fade in={fadeIn} appear={false} style={{paddingBottom:'0.5em'}}>
            <Typography fontWeight={'bold'} fontSize='0.75em'> {
                supporter.link
                    ? <Link target='_blank' rel="noopener" href={supporter.link}>{supporter.name}</Link>
                    :  supporter.name }
            </Typography>
        </Fade>
}


export default function SupportParseq() {

    return <Stack direction={'column'} sx={{ width:'100%'}}>
        <Stack direction={'column'}>
            <center> {/*lol*/}
                <Typography fontSize='0.75em'>
                    Thank you to our <em>Oscillator</em> level supporter:
                </Typography>
                <Supporters />
            </center>
        </Stack >
        <Stack direction={'row'} justifyContent={'flex-end'} alignItems={'center'}>
            <Typography fontSize='0.75em'>
                Support Parseq:&nbsp;
            </Typography>
            <Chip style={{ paddingLeft: '4px' }} size='small' variant="filled" component="a" target='_blank' rel="noopener" href="https://www.buymeacoffee.com/rewbs" clickable icon={<FontAwesomeIcon color='#C4A484' size='2xs' icon={faCoffee} />} label="Coffee" />
            &nbsp;/&nbsp;
            <Chip style={{ paddingLeft: '4px' }} size='small' variant="filled" component="a" target='_blank' rel="noopener" href="https://www.patreon.com/rewbs" clickable icon={<FontAwesomeIcon color='#f1465a' size='2xs' icon={faPatreon} />} label="Patreon" />
        </Stack>        
    </Stack>;
}