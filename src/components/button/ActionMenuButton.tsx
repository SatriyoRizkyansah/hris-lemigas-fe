import { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Tooltip } from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "warning" | "success";
  divider?: boolean; // Add divider after this item
}

interface ActionMenuButtonProps {
  items: ActionMenuItem[];
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  sx?: SxProps<Theme>;
  tooltip?: string;
}

const VARIANT_COLORS = {
  default: "var(--foreground)",
  danger: "var(--destructive)",
  warning: "#b45309",
  success: "#15803d",
};

export function ActionMenuButton({ items, disabled = false, size = "small", sx, tooltip = "Aksi" }: ActionMenuButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    handleClose();
  };

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton
          size={size}
          onClick={handleClick}
          disabled={disabled}
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)",
            backgroundColor: "var(--card)",
            "&:hover": {
              backgroundColor: "var(--accent)",
            },
            "&:disabled": {
              opacity: 0.5,
              cursor: "not-allowed",
            },
            ...sx,
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              minWidth: 180,
              mt: 0.5,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            },
          },
        }}
      >
        {items.map((item, index) => (
          <div key={index}>
            <MenuItem
              onClick={() => handleMenuItemClick(item.onClick)}
              disabled={item.disabled}
              sx={{
                color: VARIANT_COLORS[item.variant || "default"],
                py: 1,
                "&:hover": {
                  backgroundColor: "var(--accent)",
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              {item.icon && <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{item.icon}</ListItemIcon>}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              />
            </MenuItem>
            {item.divider && index < items.length - 1 && <Divider sx={{ borderColor: "var(--border)" }} />}
          </div>
        ))}
      </Menu>
    </>
  );
}

export default ActionMenuButton;
