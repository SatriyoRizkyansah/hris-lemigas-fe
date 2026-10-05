import { useColorScheme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

export const useTheme = () => {
  const colorScheme = useColorScheme();

  if (!colorScheme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  const { mode, systemMode, setMode } = colorScheme;
  const resolvedMode = ((mode === "system" ? systemMode : mode) ?? "light") as ThemeMode;

  const toggleColorMode = () => {
    setMode(resolvedMode === "light" ? "dark" : "light");
  };

  return {
    mode: resolvedMode,
    toggleColorMode,
  };
};
