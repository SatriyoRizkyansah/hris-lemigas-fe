import { extendTheme } from "@mui/material/styles";

const paletteTokens = {
  light: {
    primary: {
      main: "#ef4444",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#f4f4f5",
      contrastText: "#18181b",
    },
    success: {
      main: "#16a34a",
      contrastText: "#ffffff",
    },
    error: {
      main: "#dc2626",
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#09090b",
      secondary: "#71717a",
    },
    divider: "#e4e4e7",
  },
  dark: {
    primary: {
      main: "#f87171",
      contrastText: "#18181b",
    },
    secondary: {
      main: "#27272a",
      contrastText: "#fafafa",
    },
    success: {
      main: "#4ade80",
      contrastText: "#052e16",
    },
    error: {
      main: "#f87171",
      contrastText: "#18181b",
    },
    background: {
      default: "#09090b",
      paper: "#09090b",
    },
    text: {
      primary: "#fafafa",
      secondary: "#a1a1aa",
    },
    divider: "#27272a",
  },
} as const;

const buildPalette = (scheme: keyof typeof paletteTokens) => paletteTokens[scheme];

export const appTheme = extendTheme({
  cssVarPrefix: "mui",
  colorSchemes: {
    light: {
      palette: buildPalette("light"),
    },
    dark: {
      palette: buildPalette("dark"),
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-sans)",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        },
      },
    },
  },
});

export default appTheme;
