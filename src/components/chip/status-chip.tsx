import { Chip } from "@mui/material";

interface StatusChipProps {
  label: string;
  variant?: "success" | "neutral" | "danger" | "warning" | "info";
  size?: "default" | "small";
}

export function StatusChip({ label, variant = "neutral", size = "default" }: StatusChipProps) {
  const styles = {
    success: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    },
    neutral: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
    },
    danger: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fca5a5",
    },
    warning: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    },
    info: {
      backgroundColor: "#dbeafe",
      color: "#1e40af",
      border: "1px solid #93c5fd",
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
