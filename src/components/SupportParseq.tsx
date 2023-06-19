import { faPatreon } from '@fortawesome/free-brands-svg-icons';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Chip, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { supporterList } from '../data/supporterList';

const Supporters = () => {

    const [currentSupporter, setCurrentSupporter] = useState(Math.floor(Math.random() * supporterList.length));

    useEffect(() => {
        setInterval(() => {
            setCurrentSupporter(Math.floor(Math.random() * supporterList.length));
        }, 30000);
    }, []);

    return <Typography fontSize='0.75em'>
        <a href={supporterList[currentSupporter].link}>{supporterList[currentSupporter].name}</a>
    </Typography>
}


export default function SupportParseq() {

    return <Stack>
        <Stack direction={'row'} justifyContent={'flex-end'}>
            <Typography fontSize='0.75em'>
                Support Parseq:&nbsp;
            </Typography>
            <Chip style={{ paddingLeft: '4px' }} size='small' variant="filled" component="a" href="https://www.buymeacoffee.com/rewbs" clickable icon={<FontAwesomeIcon color='#C4A484' size='2xs' icon={faCoffee} />} label="Coffee" />
            &nbsp;/&nbsp;
            <Chip style={{ paddingLeft: '4px' }} size='small' variant="filled" component="a" href="https://www.patreon.com/rewbs" clickable icon={<FontAwesomeIcon color='#f1465a' size='2xs' icon={faPatreon} />} label="Patreon" />
        </Stack>
        <Stack direction={'row'} justifyContent={'flex-end'}>
            <Supporters />
        </Stack >
    </Stack>;
}