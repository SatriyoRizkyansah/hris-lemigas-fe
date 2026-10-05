import { Dialog, DialogContent, Typography, Box, Button, Stack } from "@mui/material";
import { WarningAmberRounded as WarningIcon } from "@mui/icons-material";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Iya", cancelLabel = "Batal", variant = "danger" }: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantColors = {
    danger: "var(--destructive)",
    warning: "#f59e0b",
    info: "var(--primary)",
  };

  const variantBgColors = {
    danger: "color-mix(in srgb, var(--destructive) 10%, transparent)",
    warning: "color-mix(in srgb, #f59e0b 10%, transparent)",
    info: "color-mix(in srgb, var(--primary) 10%, transparent)",
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          {/* Icon */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: variantBgColors[variant],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: variantColors[variant],
            }}
          >
            <WarningIcon sx={{ fontSize: 32 }} />
          </Box>

          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--foreground)" }}>
            {title}
          </Typography>

          {/* Message */}
          <Typography variant="body2" sx={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            {message}
          </Typography>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} sx={{ width: "100%", pt: 1 }}>
            <Button
              fullWidth
              onClick={onClose}
              sx={{
                py: 1,
                borderRadius: "10px",
                fontWeight: 600,
                textTransform: "none",
                border: "1px solid var(--border)",
                backgroundColor: "transparent",
                color: "var(--foreground)",
                "&:hover": {
                  backgroundColor: "var(--accent)",
                },
              }}
            >
              {cancelLabel}
            </Button>
            <Button
              fullWidth
              onClick={handleConfirm}
              sx={{
                py: 1,
                borderRadius: "10px",
                fontWeight: 600,
                textTransform: "none",
                backgroundColor: variantColors[variant],
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: variantColors[variant],
                  opacity: 0.9,
                },
              }}
            >
              {confirmLabel}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
