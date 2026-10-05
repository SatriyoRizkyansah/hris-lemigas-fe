import React from "react";
import { CssBaseline } from "@mui/material";
import { CssVarsProvider, useColorScheme } from "@mui/material/styles";
import { appTheme } from "./theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const HtmlClassSync = () => {
  const { mode, systemMode } = useColorScheme();

  React.useLayoutEffect(() => {
    const resolvedMode = mode === "system" ? systemMode : mode;

    if (!resolvedMode || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", resolvedMode === "dark");
  }, [mode, systemMode]);

  return null;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <CssVarsProvider theme={appTheme} defaultMode="system" modeStorageKey="theme-mode" disableTransitionOnChange>
      <CssBaseline />
      <HtmlClassSync />
      {children}
    </CssVarsProvider>
  );
}
