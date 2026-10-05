import { Chip } from "@mui/material";

interface StatusChipProps {
  label: string;
  variant?: "success" | "neutral" | "danger" | "warning" | "info";
  size?: "default" | "small";
}

export function StatusChip({ label, variant = "neutral", size = "default" }: StatusChipProps) {
  const styles = {
    success: {
      backgroundColor: "color-mix(in srgb, #22c55e 18%, transparent)",
      color: "#15803d",
      border: "1px solid color-mix(in srgb, #22c55e 35%, transparent)",
    },
    neutral: {
      backgroundColor: "color-mix(in srgb, #6b7280 14%, transparent)",
      color: "#374151",
      border: "1px solid color-mix(in srgb, #6b7280 30%, transparent)",
    },
    danger: {
      backgroundColor: "color-mix(in srgb, #ef4444 14%, transparent)",
      color: "#b91c1c",
      border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
    },
    warning: {
      backgroundColor: "color-mix(in srgb, #f59e0b 18%, transparent)",
      color: "#b45309",
      border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
    },
    info: {
      backgroundColor: "color-mix(in srgb, #3b82f6 18%, transparent)",
      color: "#1d4ed8",
      border: "1px solid color-mix(in srgb, #3b82f6 35%, transparent)",
    },
  };

  const isSmall = size === "small";

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: isSmall ? "0.65rem" : "0.75rem",
        borderRadius: "6px",
        backdropFilter: "blur(4px)",
        maxWidth: "100%",
        height: "auto",
        "& .MuiChip-label": {
          whiteSpace: "normal",
          wordWrap: "break-word",
          display: "block",
          padding: isSmall ? "2px 6px" : "4px 10px",
        },
        ...styles[variant],
      }}
    />
  );
}
