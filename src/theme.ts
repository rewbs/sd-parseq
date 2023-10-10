import { CssVarsThemeOptions, PaletteColor, createTheme } from "@mui/material";

declare module "@mui/material/styles" {
    interface Palette {
        negative: PaletteColor;
        positive: PaletteColor;
        unsavedbg: PaletteColor;
        footerbg: PaletteColor;
        fainthighlight: PaletteColor;
        graphBorder: PaletteColor;
        graphBackground: PaletteColor;
        graphFont: PaletteColor;
        gridInfoField: PaletteColor;
        gridPromptField: PaletteColor;
        gridColSeparatorMajor: PaletteColor;
        gridColSeparatorMinor: PaletteColor;
        codeBackground: PaletteColor;
        waveformStart: PaletteColor;
        waveformEnd: PaletteColor;
        waveformProgressMaskStart: PaletteColor;
        waveformProgressMaskEnd: PaletteColor;
        greyedText: PaletteColor;
    }
    interface PaletteOptions {
        negative: PaletteColor;
        positive: PaletteColor;
        unsavedbg: PaletteColor;
        footerbg: PaletteColor;
        faintHighlight: PaletteColor;
        graphBorder: PaletteColor;
        graphBackground: PaletteColor;
        graphFont: PaletteColor;
        gridInfoField: PaletteColor;
        gridPromptField: PaletteColor;
        gridColSeparatorMajor: PaletteColor;
        gridColSeparatorMinor: PaletteColor;
        codeBackground: PaletteColor;
        waveformStart: PaletteColor;
        waveformEnd: PaletteColor;
        waveformProgressMaskStart: PaletteColor;
        waveformProgressMaskEnd: PaletteColor;
        greyedText: PaletteColor;

    }
}

export const themeFactory = (): CssVarsThemeOptions => {
    const { palette } = createTheme();
    return {
        colorSchemes: {
            light: {
                palette: {
                    background: { default: '#fff', paper: '#eee' },
                    negative: palette.augmentColor({ color: { main: '#b22222' } }),
                    positive: palette.augmentColor({ color: { main: '#006400' } }),
                    unsavedbg: palette.augmentColor({ color: { main: '#FFFFF0' } }),
                    footerbg: palette.augmentColor({ color: { main: 'rgba(200,200,200,0.85)' } }),
                    faintHighlight: palette.augmentColor({ color: { main: 'rgba(225,255,225,0.2)' } }),
                    graphBorder: palette.augmentColor({ color: { main: 'rgba(0, 0, 0, 0.1)' } }),
                    graphBackground: palette.augmentColor({ color: { main: 'rgba(0, 0, 0, 0.1)' } }),
                    graphFont: palette.augmentColor({ color: { main: '#666' } }),
                    gridInfoField: palette.augmentColor({ color: { main: '#e5e5e5' } }),
                    gridPromptField: palette.augmentColor({ color: { main: '#f5f5f5' } }),
                    gridColSeparatorMajor: palette.augmentColor({ color: { main: '#000' } }),
                    gridColSeparatorMinor: palette.augmentColor({ color: { main: '#ccc' } }),
                    codeBackground: palette.augmentColor({ color: { main: '#ccc' } }),
                    waveformStart: palette.augmentColor({ color: { main: '#000' } }),
                    waveformEnd: palette.augmentColor({ color: { main: '#aaa' } }),
                    waveformProgressMaskStart: palette.augmentColor({ color: { main: '#aaa' } }),
                    waveformProgressMaskEnd: palette.augmentColor({ color: { main: '#ccc' } }),
                    greyedText: palette.augmentColor({ color: { main: 'rgba(0, 0, 0, 0.275)' } }),
                    
                }
            },
            dark: {
                palette: {
                    background: { default: '#252525', paper: '#303030' },
                    negative: palette.augmentColor({ color: { main: '#ff8d8d' } }),
                    positive: palette.augmentColor({ color: { main: '#90EE90' } }),
                    unsavedbg: palette.augmentColor({ color: { main: '#303020' } }),
                    footerbg: palette.augmentColor({ color: { main: 'rgba(55,55,55,0.85)' } }),
                    faintHighlight: palette.augmentColor({ color: { main: 'rgba(25,75,25,0.2)' } }),
                    graphBorder: palette.augmentColor({ color: { main: 'rgba(255, 255, 255, 0.2)' } }),
                    graphBackground: palette.augmentColor({ color: { main: 'rgba(255, 255, 255, 0.1)' } }),
                    graphFont: palette.augmentColor({ color: { main: '#ddd' } }),
                    gridInfoField: palette.augmentColor({ color: { main: '#444' } }),
                    gridPromptField: palette.augmentColor({ color: { main: '#222' } }),                    
                    gridColSeparatorMajor: palette.augmentColor({ color: { main: '#fff' } }),
                    gridColSeparatorMinor: palette.augmentColor({ color: { main: '#555' } }),
                    codeBackground: palette.augmentColor({ color: { main: '#666' } }),
                    waveformStart: palette.augmentColor({ color: { main: '#fff' } }),
                    waveformEnd: palette.augmentColor({ color: { main: '#aaa' } }),
                    waveformProgressMaskStart: palette.augmentColor({ color: { main: '#bbb' } }),
                    waveformProgressMaskEnd: palette.augmentColor({ color: { main: '#555' } }),
                    greyedText: palette.augmentColor({ color: { main: 'rgba(255, 255, 255, 0.2)' } }),
                }
            }
        }
    };
}