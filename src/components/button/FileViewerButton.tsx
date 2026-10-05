import { useState } from "react";
import { IconButton } from "@mui/material";
import { Description as DescriptionIcon } from "@mui/icons-material";
import { Loader } from "../loading/Loader";

interface FileViewerButtonProps {
  fileUrl?: string | null;
  size?: "small" | "medium" | "large";
  iconSize?: string;
  loadingDelay?: number; // in milliseconds
  disabled?: boolean;
  isFullUrl?: boolean; // if true, use fileUrl as-is without prepending domain/api/uploaded
}

export function FileViewerButton({
  fileUrl,
  size = "small",
  iconSize = "1.25rem",
  loadingDelay = 1500, // default 1.5 seconds
  disabled = false,
  isFullUrl = false,
}: FileViewerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Construct full file URL based on isFullUrl flag
  const fullFileUrl = fileUrl ? (isFullUrl ? fileUrl : `${window.location.origin}/api/uploaded/${fileUrl}`) : null;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!fullFileUrl || disabled || isLoading) return;

    setIsLoading(true);

    // Show loader for specified delay
    setTimeout(() => {
      window.open(fullFileUrl, "_blank");
      setIsLoading(false);
    }, loadingDelay);
  };

  // If no file URL, show disabled state
  if (!fileUrl) {
    return <span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>-</span>;
  }

  return (
    <>
      {isLoading && <Loader label="Membuka dokumen..." />}

      <IconButton
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading}
        sx={{
          color: isLoading ? "var(--muted-foreground)" : "var(--primary)",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
            transform: isLoading ? "none" : "scale(1.1)",
          },
          "&:disabled": {
            color: "var(--muted-foreground)",
          },
        }}
      >
        <DescriptionIcon sx={{ fontSize: iconSize }} />
      </IconButton>
    </>
  );
}

export default FileViewerButton;
