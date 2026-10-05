import { Box, Typography } from "@mui/material";
import { memo } from "react";

interface CommandPaletteTriggerProps {
  onClick: () => void;
}

function CommandPaletteTriggerComponent({ onClick }: CommandPaletteTriggerProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        px: 1.75,
        py: 1,
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          backgroundColor: "var(--accent)",
          borderColor: "var(--muted-foreground)",
        },
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--muted-foreground)",
          fontFamily: "monospace",
          lineHeight: 1,
        }}
      >
        ⌘
      </Typography>
      <Typography
        component="span"
        sx={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--muted-foreground)",
          fontFamily: "monospace",
          lineHeight: 1,
        }}
      >
        K
      </Typography>
    </Box>
  );
}

export const CommandPaletteTrigger = memo(CommandPaletteTriggerComponent);

export default CommandPaletteTrigger;
