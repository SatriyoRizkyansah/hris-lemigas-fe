import { useMemo, useState, useCallback, type MouseEvent } from "react";
import { Box, Typography, IconButton, Badge, Menu, Divider, CircularProgress, Skeleton, Tooltip } from "@mui/material";
import { NotificationsNone as NotificationsNoneIcon, RefreshRounded as RefreshIcon, NotificationsOffRounded as NotificationsOffIcon, ArrowForwardRounded as ArrowForwardIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { extract_list } from "@Utils/response-utils";
import { useSignalValue } from "@Signal/hooks";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { NOTIFICATION_ACTION_MAP } from "./notificationMapping";

// Template leftover — HRIS API has no notification module.
type NotificationItemDto = any;

type StatusPalette = {
  bg: string;
  fg: string;
  border: string;
};

const getStatusPalette = (status?: string): StatusPalette => {
  const s = (status || "").toLowerCase();
  if (s.includes("success") || s.includes("approved") || s.includes("selesai") || s.includes("aktif")) {
    return { bg: "color-mix(in srgb, #10b981 12%, transparent)", fg: "#059669", border: "color-mix(in srgb, #10b981 28%, transparent)" };
  }
  if (s.includes("error") || s.includes("reject") || s.includes("gagal") || s.includes("nonaktif") || s.includes("ditolak")) {
    return { bg: "color-mix(in srgb, #ef4444 12%, transparent)", fg: "#dc2626", border: "color-mix(in srgb, #ef4444 28%, transparent)" };
  }
  if (s.includes("warning") || s.includes("pending") || s.includes("menunggu") || s.includes("diajukan") || s.includes("draft")) {
    return { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", fg: "#d97706", border: "color-mix(in srgb, #f59e0b 28%, transparent)" };
  }
  if (s.includes("info")) {
    return { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", fg: "#2563eb", border: "color-mix(in srgb, #3b82f6 28%, transparent)" };
  }
  return { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", fg: "var(--primary)", border: "color-mix(in srgb, var(--primary) 28%, transparent)" };
};

export function NotificationMenu() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const authState = useSignalValue(auth_signal);
  const isReadyToFetch = Boolean(authState?.selectedToken);

  // Template leftover — HRIS API has no notification module; menu renders empty.
  const notificationQuery = {
    is_loading: false,
    response: [] as NotificationItemDto[],
    call_back: () => {},
  };

  const notifications = useMemo<NotificationItemDto[]>(() => extract_list<NotificationItemDto>(notificationQuery.response), [notificationQuery.response]);

  const totalUnread = useMemo(() => notifications.reduce((sum, n) => sum + (Number(n?.total) || 0), 0), [notifications]);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (isReadyToFetch) {
      notificationQuery.call_back();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    if (isReadyToFetch) {
      notificationQuery.call_back();
    }
  };

  const handleNotificationClick = useCallback(
    (action: string | undefined) => {
      if (action && NOTIFICATION_ACTION_MAP[action]) {
        navigate(NOTIFICATION_ACTION_MAP[action].route);
      }
      setAnchorEl(null);
    },
    [navigate],
  );

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: "var(--foreground)",
          backgroundColor: "var(--muted)",
          border: "1px solid var(--border)",
          width: 32,
          height: 32,
          borderRadius: "var(--radius)",
          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: "var(--accent)",
            borderColor: "var(--primary)",
          },
        }}
      >
        <Badge color="error" variant="dot" overlap="circular" invisible={notifications.length === 0}>
          <NotificationsNoneIcon fontSize="small" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 360,
              maxWidth: 400,
              borderRadius: "12px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
              }}
            >
              <NotificationsNoneIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography variant="body2" fontWeight={700} sx={{ color: "var(--foreground)" }}>
              Notifikasi
            </Typography>
            {totalUnread > 0 && (
              <Box
                sx={{
                  px: 0.85,
                  py: 0.1,
                  borderRadius: "999px",
                  backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
                  color: "var(--primary)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </Box>
            )}
          </Box>
          <Tooltip title="Muat ulang" arrow>
            <span>
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={notificationQuery.is_loading}
                sx={{
                  color: "var(--muted-foreground)",
                  "&:hover": { color: "var(--primary)", backgroundColor: "var(--accent)" },
                }}
              >
                {notificationQuery.is_loading ? <CircularProgress size={14} thickness={5} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Body */}
        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {notificationQuery.is_loading && notifications.length === 0 ? (
            <Box sx={{ px: 2, py: 1.5 }}>
              {[0, 1, 2].map((i) => (
                <Box key={i} sx={{ display: "flex", gap: 1.5, py: 1.25 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={14} />
                    <Skeleton variant="text" width="90%" height={12} sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 5, px: 2, color: "var(--muted-foreground)" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--muted)",
                  color: "var(--muted-foreground)",
                }}
              >
                <NotificationsOffIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: "var(--foreground)" }}>
                Tidak ada notifikasi
              </Typography>
              <Typography variant="caption" sx={{ textAlign: "center", maxWidth: 240 }}>
                Semua notifikasi Anda akan muncul di sini.
              </Typography>
            </Box>
          ) : (
            <Box>
              {notifications.map((n, idx) => {
                const palette = getStatusPalette(n.status);
                const modulLabel = n.modul || "Notifikasi";
                const messageText = n.message || "";
                const count = Number(n.total) || 0;
                const actionConfig = n.action ? NOTIFICATION_ACTION_MAP[n.action] : undefined;
                return (
                  <Box key={`${modulLabel}-${idx}`}>
                    <Box
                      onClick={() => handleNotificationClick(n.action)}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        cursor: "pointer",
                        transition: "background-color 150ms ease",
                        "&:hover": { backgroundColor: "var(--muted)" },
                        "&:active": { backgroundColor: "var(--accent)" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: palette.bg,
                          color: palette.fg,
                          border: `1px solid ${palette.border}`,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {actionConfig ? actionConfig.icon : modulLabel.charAt(0).toUpperCase()}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              color: "var(--foreground)",
                              textTransform: "capitalize",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {modulLabel}
                          </Typography>
                          {count > 0 && (
                            <Box
                              sx={{
                                flexShrink: 0,
                                minWidth: 22,
                                height: 18,
                                px: 0.75,
                                borderRadius: "999px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: palette.bg,
                                color: palette.fg,
                                border: `1px solid ${palette.border}`,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                lineHeight: 1,
                              }}
                            >
                              {count > 99 ? "99+" : count}
                            </Box>
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            color: "var(--muted-foreground)",
                            lineHeight: 1.45,
                            mt: 0.25,
                          }}
                        >
                          {messageText}
                        </Typography>
                      </Box>
                    </Box>
                    {idx < notifications.length - 1 && <Divider sx={{ borderColor: "var(--border)", mx: 2 }} />}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--muted)",
          }}
        >
          <Typography variant="caption" sx={{ color: "var(--muted-foreground)" }}>
            {notifications.length > 0 ? `${notifications.length} notifikasi` : "Semua sudah dibaca"}
          </Typography>
          <Box
            onClick={handleClose}
            sx={{
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: "var(--primary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Tutup
            <ArrowForwardIcon sx={{ fontSize: 12 }} />
          </Box>
        </Box>
      </Menu>
    </>
  );
}

export default NotificationMenu;
