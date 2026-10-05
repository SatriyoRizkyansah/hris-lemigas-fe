import { useState } from "react";
import { Avatar, Box, Typography } from "@mui/material";
import userImage from "@/assets/images/user.png";
import { Modal } from "../modal/Modal";

interface UserAvatarProps {
  photoUrl?: string | null;
  name?: string;
  id?: string;
  size?: "small" | "medium" | "large";
  showId?: boolean;
  showName?: boolean;
  enablePreview?: boolean;
}

const sizeMap = {
  small: 32,
  medium: 40,
  large: 48,
};

export function UserAvatar({ photoUrl, name, id, size = "small", showId = true, showName = false, enablePreview = true }: UserAvatarProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const avatarSize = sizeMap[size];

  const imageUrl = !imageError && photoUrl ? `${window.location.origin}/api/uploaded/${photoUrl}` : userImage;

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (enablePreview) {
      setPreviewOpen(true);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar
          src={imageUrl}
          alt={name || id}
          onClick={handleAvatarClick}
          imgProps={{
            onError: () => setImageError(true),
          }}
          sx={{
            width: avatarSize,
            height: avatarSize,
            border: "2px solid var(--border)",
            transition: "all 0.2s ease",
            cursor: enablePreview ? "pointer" : "default",
            "&:hover": {
              transform: enablePreview ? "scale(1.05)" : "none",
              borderColor: enablePreview ? "var(--primary)" : "var(--border)",
            },
          }}
        />

        {(showId || showName) && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
              minWidth: 0,
            }}
          >
            {showId && id && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--foreground)",
                  lineHeight: 1.2,
                }}
              >
                {id}
              </Typography>
            )}

            {showName && name && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground)",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview Profile" description="Informasi singkat pegawai" maxWidth={420}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 2,
          }}
        >
          <Avatar
            src={imageUrl}
            alt={name || id}
            imgProps={{
              onError: () => setImageError(true),
            }}
            sx={{
              width: 160,
              height: 160,
              border: "4px solid var(--border)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            }}
          />

          <Box
            sx={{
              textAlign: "center",
              width: "100%",
            }}
          >
            {name && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "var(--foreground)",
                  mb: 0.5,
                }}
              >
                {name}
              </Typography>
            )}

            {id && (
              <Typography
                variant="body2"
                sx={{
                  color: "var(--muted-foreground)",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              >
                ID: {id}
              </Typography>
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default UserAvatar;
