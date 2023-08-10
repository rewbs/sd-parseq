// See: https://github.com/mui/material-ui/issues/31261#issuecomment-1061101995
import {Tooltip} from '@mui/material';

// @ts-ignore
const PatchTooltip = ({children, ...props}) => <Tooltip {...props}><span>{children}</span></Tooltip>

export default PatchTooltip;