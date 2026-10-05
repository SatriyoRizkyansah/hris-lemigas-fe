import React from "react";
import { NotificationsOutlined as NotificationsIcon } from "@mui/icons-material";

export interface NotificationActionConfig {
  icon: React.ReactNode;
  route: string;
  label: string;
}

// ─── Notification Action Map ──────────────────────────────────────────────────
// Mapping tipe notifikasi ke icon, route, dan label yang sesuai.
// Tambahkan entry baru sesuai kebutuhan aplikasi kamu.
//
// Contoh:
// "profile": {
//   icon: <PersonOutlineIcon fontSize="small" />,
//   route: "/profile",
//   label: "Profile",
// },

export const NOTIFICATION_ACTION_MAP: Record<string, NotificationActionConfig> = {
  default: {
    icon: <NotificationsIcon fontSize="small" />,
    route: "/",
    label: "Notifikasi",
  },
  // TODO: Tambahkan mapping notifikasi sesuai kebutuhan
};
