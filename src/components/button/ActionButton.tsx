import { IconButton, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";

type ActionButtonVariant = "edit" | "delete" | "approve" | "reject" | "deactivate" | "view" | "default";

interface ActionButtonProps {
  variant?: ActionButtonVariant;
  title: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  sx?: SxProps<Theme>;
}

const VARIANT_STYLES: Record<ActionButtonVariant, { color: string; hoverBg: string }> = {
  edit: {
    color: "var(--foreground)",
    hoverBg: "var(--accent)",
  },
  delete: {
    color: "var(--destructive)",
    hoverBg: "color-mix(in srgb, var(--destructive) 10%, transparent)",
  },
  approve: {
    color: "#15803d",
    hoverBg: "color-mix(in srgb, #22c55e 10%, transparent)",
  },
  reject: {
    color: "var(--destructive)",
    hoverBg: "color-mix(in srgb, var(--destructive) 10%, transparent)",
  },
  deactivate: {
    color: "var(--destructive)",
    hoverBg: "color-mix(in srgb, var(--destructive) 10%, transparent)",
  },
  view: {
    color: "var(--foreground)",
    hoverBg: "var(--accent)",
  },
  default: {
    color: "var(--foreground)",
    hoverBg: "var(--accent)",
  },
};

export function ActionButton({ variant = "default", title, icon, onClick, disabled = false, size = "small", sx }: ActionButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Tooltip title={title}>
      <IconButton
        size={size}
        onClick={onClick}
        disabled={disabled}
        sx={{
          border: "1px solid var(--border)",
          borderRadius: "8px",
          color: variantStyle.color,
          backgroundColor: "var(--card)",
          "&:hover": {
            backgroundColor: variantStyle.hoverBg,
          },
          "&:disabled": {
            opacity: 0.5,
            cursor: "not-allowed",
          },
          ...sx,
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}

export default ActionButton;
