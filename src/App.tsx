import { CssBaseline, GlobalStyles } from "@mui/material";
import { Experimental_CssVarsProvider as CssVarsProvider, experimental_extendTheme as extendTheme } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Analyser from "./Analyser";
import Browser from "./Browser";
import Deforum from "./Deforum";
import FunctionDoc from "./FunctionDoc";
import Labs from "./Labs";
import Raw from "./Raw";
import Header from "./components/Header";
import { themeFactory } from "./theme";
import { HotkeysProvider } from 'react-hotkeys-hook';

const App = () => {

  const theme = extendTheme(themeFactory());

  return <CssVarsProvider theme={theme}>
    <HotkeysProvider initiallyActiveScopes={['main']}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          code: {
            fontFamily: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New',monospace",
            background: theme.vars.palette.codeBackground.main,
            wordWrap: "break-word",
            boxDecorationBreak: "clone",
            padding: ".1rem .1rem .1rem",
            borderRadius: ".2rem"
          }
        }}
      />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Deforum />} />
          <Route path="/deforum" element={<Deforum />} />
          <Route path="/browser" element={<Browser />} />
          <Route path="/analyser" element={<Analyser />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/raw" element={<Raw />} />
          <Route path="/functionDocs" element={<FunctionDoc />} />
        </Routes>
      </BrowserRouter>
    </HotkeysProvider>
  </CssVarsProvider>;
};

export default App;
