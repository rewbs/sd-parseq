import React, { useCallback, useState } from "react";
import Header from "./components/Header";
//@ts-ignore
import ParseqUI from './ParseqUI';
import {createTheme, ThemeProvider} from '@mui/material/styles';

const Deforum = () => {
  const [darkMode, setDarkMode] = useState(false);
  const updateDarkMode = useCallback((darkMode: boolean) => setDarkMode(darkMode), []);

  const darkTheme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });
    
  return (<ThemeProvider theme={darkTheme}>
    <Header title="Parseq for Deforum" updateDarkMode={updateDarkMode} darkMode={darkMode} />
    <ParseqUI defaultTemplate='catduck' />
  </ThemeProvider>)
}

export default Deforum;

