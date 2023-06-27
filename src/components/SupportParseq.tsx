import { faPatreon } from '@fortawesome/free-brands-svg-icons';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Chip, Stack, Typography } from '@mui/material';
import { Fade } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css'
import { supporterList } from '../data/supporterList';
import _ from 'lodash';


const Supporters = () => {
    return (
        <div className="slide-container" style={{paddingBottom:'0.25em' }}>
          <Fade  duration={10000} arrows={false} >
           { _.shuffle(supporterList).map((supporter, index)=> (
              <div key={index}>
                <Typography fontWeight={'bold'} fontSize='0.75em'> { supporter.link ? <a target='_blank' rel="noreferrer" href={supporter.link}>{supporter.name}</a> : supporter.name } </Typography>
              </div>
            ))} 
          </Fade>
        </div>
      )
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
            <Chip style={{ paddingLeft: '4px' }} size='small' variant="filled" component="a" target='_blank' rel="noreferrer" href="https://www.buymeacoffee.com/rewbs" clickable icon={<FontAwesomeIcon color='#C4A484' size='2xs' icon={faCoffee} />} label="Coffee" />
            &nbsp;/&nbsp;
            <Chip style={{ paddingLeft: '4px' }} size='small' variant="filled" component="a" target='_blank' rel="noreferrer" href="https://www.patreon.com/rewbs" clickable icon={<FontAwesomeIcon color='#f1465a' size='2xs' icon={faPatreon} />} label="Patreon" />
        </Stack>        
    </Stack>;
}