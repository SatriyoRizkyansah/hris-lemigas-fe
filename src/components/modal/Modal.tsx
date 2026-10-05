import React from "react";
import { Dialog, DialogContent, IconButton, Typography, Box, Stack, Button, Divider } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export interface ModalSection {
  title?: string;
  description?: string;
  content?: React.ReactNode;
}

export interface ModalAction {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  sections?: ModalSection[];
  children?: React.ReactNode;
  actions?: ModalAction[];
  maxWidth?: number;
}

const actionVariantStyles: Record<NonNullable<ModalAction["variant"]>, Record<string, string>> = {
  primary: {
    backgroundColor: "var(--foreground)",
    color: "var(--background)",
  },
  secondary: {
    backgroundColor: "var(--muted)",
    color: "var(--foreground)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
};

export function Modal({ open, onClose, title, description, sections, children, actions, maxWidth = 520 }: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: { xs: "var(--radius-lg)", sm: "calc(var(--radius-xl))" },
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          boxShadow: "0 35px 120px rgba(15, 23, 42, 0.22)",
          width: "100%",
          maxWidth: { xs: "calc(100% - 16px)", sm: maxWidth },
          m: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, pb: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--foreground)", mb: 0.5 }}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" sx={{ color: "var(--muted-foreground)" }}>
                {description}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              backgroundColor: "var(--muted)",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
              borderRadius: "var(--radius)",
              "&:hover": {
                backgroundColor: "var(--accent)",
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {(sections?.length || children) && <Divider sx={{ my: 2, borderColor: "var(--border)", flexShrink: 0 }} />}

        <Stack
          spacing={1.5}
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 2,
            flex: 1,
            overflow: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--muted-foreground) transparent",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "var(--muted-foreground)",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "var(--foreground)",
              },
            },
          }}
        >
          {sections?.map((section, index) => (
            <Box
              key={index}
              sx={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                p: 2.25,
                background: "var(--muted)",
              }}
            >
              {(section.title || section.description) && (
                <Box sx={{ mb: section.content ? 1.25 : 0 }}>
                  {section.title && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--foreground)", mb: 0.3 }}>
                      {section.title}
                    </Typography>
                  )}
                  {section.description && (
                    <Typography variant="body2" sx={{ color: "var(--muted-foreground)" }}>
                      {section.description}
                    </Typography>
                  )}
                </Box>
              )}
              {section.content}
            </Box>
          ))}

          {children}
        </Stack>

        {actions && actions.length > 0 && (
          <Box sx={{ display: "flex", gap: 1.5, p: { xs: 2, sm: 3 }, pt: 1.5, flexDirection: { xs: "column", sm: "row" }, justifyContent: "flex-end", flexShrink: 0 }}>
            {actions.map((action, index) => {
              const variant = action.variant ?? "primary";
              return (
                <Button
                  key={`${action.label}-${index}`}
                  type={action.type ?? "button"}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  sx={{
                    px: 2.75,
                    py: 1,
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    textTransform: "none",
                    border: variant === "ghost" ? "1px solid var(--border)" : "none",
                    ...actionVariantStyles[variant],
                    "&.Mui-disabled": {
                      backgroundColor: variant === "ghost" ? "transparent" : "var(--muted)",
                      color: "var(--muted-foreground)",
                      borderColor: variant === "ghost" ? "var(--border)" : "var(--muted)",
                    },
                  }}
                >
                  {action.label}
                </Button>
              );
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
