import React, { useCallback, useMemo, useState } from "react";
import Header from "./components/Header";
import ParseqUI from './ParseqUI';
import {createTheme, ThemeOptions, ThemeProvider} from '@mui/material/styles';
import { useMediaQuery } from "@mui/material";

const Deforum = () => {

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const theme = useMemo(() => createTheme(themeFactory(darkMode)), [darkMode]);
  const updateDarkMode = useCallback((darkMode: boolean) => setDarkMode(darkMode), []);

  return (<ThemeProvider theme={theme}>
    <Header title="Parseq for Deforum" darkMode={darkMode} updateDarkMode={updateDarkMode} />

    {/* @ts-ignore */}
    <ParseqUI
      defaultTemplate='catduck'
      darkMode={darkMode} />

  </ThemeProvider>)
}

export default Deforum;

function themeFactory(darkMode: boolean): ThemeOptions { 
  return {
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#252525' : '#fff',
      }
    }
  }
}