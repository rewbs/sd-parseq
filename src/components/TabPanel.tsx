import { Box } from '@mui/material';
import React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  activeTab: number;
}
export const TabPanel = ({ children, activeTab, index, ...other }: TabPanelProps) => <div
  role="tabpanel"
  hidden={activeTab !== index}
  id={`simple-tabpanel-${index}`}
  aria-labelledby={`simple-tab-${index}`}
  {...other}
>
  {activeTab === index && (
    <Box sx={{ p: 3 }}>
      {children}
    </Box>
  )}
</div>;
