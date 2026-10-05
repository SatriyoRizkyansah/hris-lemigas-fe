import React from "react";
import { Chip, ChipProps, Tooltip } from "@mui/material";

export interface HomebaseData {
  nama_lembaga?: string;
  kd_lembaga?: string;
  nama_sub_lembaga?: string;
  [key: string]: any;
}

interface HomebaseBadgeProps extends Omit<ChipProps, "label"> {
  homebase?: HomebaseData | null;
  /** Fallback jika ingin langsung passing string label */
  fallbackLabel?: string;
}

export const HomebaseBadge: React.FC<HomebaseBadgeProps> = ({ homebase, fallbackLabel, sx, ...chipProps }) => {
  // Extract label dari struktur homebase
  const getLabel = (): string => {
    if (fallbackLabel) return fallbackLabel;
    if (!homebase) return "-";

    const lembaga = homebase.nama_lembaga || homebase.kd_lembaga || "";
    const sub = homebase.nama_sub_lembaga || "";

    if (lembaga && sub) return `${lembaga} - ${sub}`;
    return lembaga || sub || "-";
  };

  const label = getLabel();

  if (label === "-") {
    return <span style={{ color: "var(--muted-foreground, #888)", fontSize: "0.85rem" }}>-</span>;
  }

  return (
    <Tooltip title={label} arrow placement="top">
      <Chip
        label={label}
        size="small"
        {...chipProps}
        sx={{
          height: 26,
          fontSize: "0.725rem",
          fontWeight: 600,
          letterSpacing: "0.01em",
          // Muted styling: background soft, text kontras sedang
          bgcolor: "color-mix(in srgb, var(--primary, #1976d2) 12%, transparent)",
          color: "var(--primary, #1976d2)",
          border: "1px solid color-mix(in srgb, var(--primary, #1976d2) 20%, transparent)",
          borderRadius: "5px",
          maxWidth: "100%",
          "& .MuiChip-label": {
            px: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          ...sx,
        }}
      />
    </Tooltip>
  );
};

export default HomebaseBadge;
