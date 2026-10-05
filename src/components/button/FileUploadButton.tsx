import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { memo, useCallback, useRef } from "react";

interface FileUploadInputProps {
  /** File baru yang dipilih user */
  value: File | null;
  onChange: (file: File | null) => void;
  /** URL / nama file yang sudah ada dari server (edit mode) */
  existingFileUrl?: string | null;
  accept?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

function getFilenameFromUrl(url: string) {
  const parts = url.split("/");
  return parts[parts.length - 1] ?? url;
}

function FileUploadInputComponent({ value, onChange, existingFileUrl, accept = ".pdf,.jpg,.jpeg,.png", disabled = false, label = "Dokumen", required = false }: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const hasNewFile = Boolean(value);
  const hasExistingFile = Boolean(existingFileUrl) && existingFileUrl !== "-";

  const chipLabel = value?.name ?? (hasExistingFile ? getFilenameFromUrl(existingFileUrl!) : null);
  const isReplacing = hasNewFile && hasExistingFile;

  const handleClick = useCallback(() => inputRef.current?.click(), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.files?.[0] ?? null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onChange],
  );

  const handleRemove = useCallback(() => {
    if (hasNewFile) {
      onChange(null);
    } else if (hasExistingFile) {
      inputRef.current?.click();
    }
  }, [hasNewFile, hasExistingFile, onChange]);

  const handlePreview = useCallback(() => {
    if (existingFileUrl) window.open(`api/uploaded/${existingFileUrl}`, "_blank");
  }, [existingFileUrl]);

  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--foreground)", mb: 0.75 }}>
          {label}
          {required && (
            <Box component="span" sx={{ color: "var(--danger, #d32f2f)", ml: 0.3 }}>
              *
            </Box>
          )}
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1.5,
          py: 1,
          border: "1px solid var(--border)",
          borderRadius: "10px",
          bgcolor: "var(--card)",
          flexWrap: "wrap",
          minHeight: 48,
        }}
      >
        <input ref={inputRef} type="file" hidden accept={accept} onChange={handleChange} />

        <Button
          variant="outlined"
          size="small"
          disabled={disabled}
          startIcon={<CloudUploadOutlinedIcon />}
          onClick={handleClick}
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            borderColor: "var(--border)",
            color: "var(--foreground)",
            fontWeight: 500,
            flexShrink: 0,
            "&:hover": { borderColor: "currentColor", bgcolor: "var(--accent)" },
            "&.Mui-disabled": {
              opacity: 0.6,
              color: "var(--muted-foreground)",
              borderColor: "var(--border)",
              cursor: "not-allowed",
              pointerEvents: "auto",
            },
          }}
        >
          {hasExistingFile ? "Ganti File" : "Pilih File"}
        </Button>

        {chipLabel ? (
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Chip
              size="small"
              icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 16 }} />}
              label={chipLabel}
              sx={{
                maxWidth: "100%",
                justifyContent: "flex-start",
                bgcolor: isReplacing ? "rgba(22, 163, 74, 0.08)" : "var(--muted)",
                color: isReplacing ? "var(--success)" : "var(--foreground)",
                border: "1px solid",
                borderColor: isReplacing ? "rgba(22, 163, 74, 0.2)" : "var(--border)",
                borderRadius: "8px",
                height: 32,
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                },
                "& .MuiChip-icon": {
                  color: isReplacing ? "var(--success)" : "var(--muted-foreground)",
                },
              }}
              onDelete={!disabled ? handleRemove : undefined}
              deleteIcon={
                <Tooltip title="Hapus">
                  <CloseIcon sx={{ fontSize: "16px" }} />
                </Tooltip>
              }
            />
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
            Belum ada file dipilih
          </Typography>
        )}

        {hasExistingFile && !hasNewFile && (
          <Tooltip title="Lihat file">
            <IconButton
              size="small"
              onClick={handlePreview}
              sx={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                "&:hover": { bgcolor: "var(--accent)" },
              }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* <Typography variant="caption" sx={{ color: "var(--muted-foreground)", mt: 0.5, display: "block", pl: 0.25 }}>
        PDF, JPG, atau PNG
      </Typography> */}
    </Box>
  );
}

export const FileUploadInput = memo(FileUploadInputComponent);
