import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme } from "../theme";

export function ThemeToggle() {
  const { mode, toggleColorMode } = useTheme();

  return (
    <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
      <IconButton onClick={toggleColorMode} color="inherit">
        {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
}
