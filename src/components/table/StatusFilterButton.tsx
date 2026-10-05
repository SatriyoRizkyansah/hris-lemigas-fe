import { useState, useCallback, memo, ReactNode } from "react";
import { Button, Menu, MenuItem, Box } from "@mui/material";
import { FilterList as FilterListIcon, Check as CheckIcon } from "@mui/icons-material";

export interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface StatusFilterButtonProps {
  value: string;
  options: StatusOption[];
  onChange: (value: string) => void;
  label?: string;
  renderButton?: (currentOption: StatusOption | undefined, onClick: (e: React.MouseEvent<HTMLButtonElement>) => void) => ReactNode;
}

function StatusFilterButtonComponent({ value, options, onChange, label = "Status", renderButton }: StatusFilterButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      handleClose();
    },
    [onChange, handleClose],
  );

  const currentOption = options.find((opt) => opt.value === value);

  return (
    <>
      {renderButton ? (
        renderButton(currentOption, handleClick)
      ) : (
        <Button
          variant="outlined"
          startIcon={<FilterListIcon sx={{ fontSize: "1.125rem" }} />}
          onClick={handleClick}
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            borderColor: "var(--border)",
            color: "var(--foreground)",
            backgroundColor: "var(--card)",
            borderRadius: "8px",
            px: 2,
            py: 0.75,
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "flex-start", sm: "center" },
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "var(--muted-foreground)",
              backgroundColor: "var(--accent)",
            },
          }}
        >
          {label}: {currentOption?.label || "Semua"}
        </Button>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: "8px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <MenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              selected={isSelected}
              sx={{
                fontSize: "0.875rem",
                py: 1.25,
                px: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                "&.Mui-selected": {
                  backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
                  },
                },
                "&:hover": {
                  backgroundColor: "var(--accent)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: option.color,
                  }}
                />
                <span>{option.label}</span>
              </Box>
              {isSelected && <CheckIcon sx={{ fontSize: "1rem", color: "var(--primary)" }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

export const StatusFilterButton = memo(StatusFilterButtonComponent);

export default StatusFilterButton;
