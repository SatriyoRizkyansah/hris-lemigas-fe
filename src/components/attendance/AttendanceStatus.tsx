import { Box, Tooltip } from "@mui/material";
import type { ComponentType } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TimerOffOutlinedIcon from "@mui/icons-material/TimerOffOutlined";
import SickOutlinedIcon from "@mui/icons-material/SickOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import WorkOffOutlinedIcon from "@mui/icons-material/WorkOffOutlined";

/**
 * SINGLE SOURCE OF TRUTH untuk representasi status kehadiran.
 * Semua table, tab, calendar, summary, dan legend harus memakai config & icon
 * dari sini agar konsisten. Jika ada perubahan icon/warna, cukup edit di sini.
 */

export type AttendanceStatusCode = "H" | "T" | "S" | "I" | "A" | "L";

export interface AttendanceStatusMeta {
  kode: AttendanceStatusCode;
  label: string;
  color: string;
  bg: string;
  Icon: ComponentType<{ sx?: object }>;
}

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatusCode, AttendanceStatusMeta> = {
  H: {
    kode: "H",
    label: "Hadir",
    color: "#10b981",
    bg: "color-mix(in srgb, #10b981 15%, transparent)",
    Icon: CheckCircleIcon,
  },
  T: {
    kode: "T",
    label: "Terlambat",
    color: "#f59e0b",
    bg: "color-mix(in srgb, #f59e0b 15%, transparent)",
    Icon: TimerOffOutlinedIcon,
  },
  S: {
    kode: "S",
    label: "Sakit",
    color: "#3b82f6",
    bg: "color-mix(in srgb, #3b82f6 15%, transparent)",
    Icon: SickOutlinedIcon,
  },
  I: {
    kode: "I",
    label: "Izin",
    color: "#8b5cf6",
    bg: "color-mix(in srgb, #8b5cf6 15%, transparent)",
    Icon: HistoryEduOutlinedIcon,
  },
  A: {
    kode: "A",
    label: "Alpha",
    color: "#ef4444",
    bg: "color-mix(in srgb, #ef4444 15%, transparent)",
    Icon: CancelRoundedIcon,
  },
  L: {
    kode: "L",
    label: "Off",
    color: "var(--muted-foreground)",
    bg: "color-mix(in srgb, var(--muted-foreground) 6%, transparent)",
    Icon: WorkOffOutlinedIcon,
  },
};

export const ATTENDANCE_STATUS_ORDER: AttendanceStatusCode[] = ["H", "T", "S", "I", "A", "L"];

export function getAttendanceStatus(kode: string): AttendanceStatusMeta {
  return ATTENDANCE_STATUS_CONFIG[kode as AttendanceStatusCode] ?? ATTENDANCE_STATUS_CONFIG.L;
}

export interface AttendanceStatusCellProps {
  kode: string;
  size?: number;
  height?: number;
  iconSize?: number;
  borderRadius?: number | string;
  isToday?: boolean;
  isSunday?: boolean;
  checkIn?: string | null;
  checkOut?: string | null;
}

export function AttendanceStatusCell({ kode, size = 32, height, iconSize = 16, borderRadius = 8, isToday = false, isSunday = false, checkIn, checkOut }: AttendanceStatusCellProps) {
  const config = getAttendanceStatus(kode);
  const boxHeight = height ?? size;
  const tooltipText = checkIn ? `${config.label} (${checkIn}${checkOut ? ` - ${checkOut}` : ""})` : config.label;

  return (
    <Tooltip
      title={tooltipText}
      arrow
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            fontSize: "0.75rem",
            fontWeight: 500,
            borderRadius: "8px",
            px: 1.5,
            py: 0.75,
          },
        },
        arrow: {
          sx: {
            color: "var(--card)",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: boxHeight,
          borderRadius,
          backgroundColor: isToday ? "color-mix(in srgb, #f97316 10%, transparent)" : config.bg,
          border: isToday ? "2px solid #f97316" : isSunday ? "1px dashed var(--border)" : "1px solid transparent",
          transition: "all 0.15s ease",
          cursor: "default",
          "&:hover": {
            transform: "scale(1.1)",
            boxShadow: `0 2px 8px ${config.color}33`,
          },
        }}
      >
        <Box
          sx={{
            color: config.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <config.Icon sx={{ fontSize: iconSize }} />
        </Box>
      </Box>
    </Tooltip>
  );
}
