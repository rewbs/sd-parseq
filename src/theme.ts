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
        gridColSeparatorMajor: PaletteColor;
        gridColSeparatorMinor: PaletteColor;
        codeBackground: PaletteColor;
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
        gridColSeparatorMajor: PaletteColor;
        gridColSeparatorMinor: PaletteColor;
        codeBackground: PaletteColor;
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
                    gridColSeparatorMajor: palette.augmentColor({ color: { main: '#000' } }),
                    gridColSeparatorMinor: palette.augmentColor({ color: { main: '#ccc' } }),
                    codeBackground: palette.augmentColor({ color: { main: '#ccc' } }),
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
                    gridColSeparatorMajor: palette.augmentColor({ color: { main: '#fff' } }),
                    gridColSeparatorMinor: palette.augmentColor({ color: { main: '#555' } }),
                    codeBackground: palette.augmentColor({ color: { main: '#666' } }),
                }
            }
        }
    };
}