/**
 * Shift utility functions
 */

import { formatDateToISO } from "./calendar";

// Template leftover — HRIS API has no shift DTOs.
type ShiftCalendarDayItemDto = any;

/**
 * Find shift data for a specific date
 * @param schedules - Array of shift schedules
 * @param date - Date to find shift for
 * @returns Shift data or undefined
 */
export const getShiftForDate = (schedules: ShiftCalendarDayItemDto[], date: Date): ShiftCalendarDayItemDto | undefined => {
  const dateStr = formatDateToISO(date);
  return schedules.find((s) => s.tanggal === dateStr);
};

/**
 * Format shift time range
 * @param shift - Shift object with jam_masuk and jam_keluar
 * @returns Formatted time range (e.g., "08:00 - 17:00")
 */
export const formatShiftTime = (shift: any): string => {
  if (!shift) return "";
  const jamMasuk = shift.jam_masuk || "";
  const jamKeluar = shift.jam_keluar || "";
  if (jamMasuk && jamKeluar) {
    return `${jamMasuk} - ${jamKeluar}`;
  }
  return "";
};

/**
 * Get shift label (name or code)
 * @param shift - Shift object
 * @returns Shift label
 */
export const getShiftLabel = (shift: any): string => {
  if (!shift) return "";
  return shift.nama || shift.kode || "";
};

/**
 * Get shift display info
 * @param shift - Shift object
 * @returns Object with label and time
 */
export const getShiftDisplayInfo = (shift: any): { label: string; time: string } => {
  return {
    label: getShiftLabel(shift),
    time: formatShiftTime(shift),
  };
};

/**
 * Calculate schedule summary (excluding Sundays from libur count)
 * @param schedules - Array of shift schedules
 * @returns Summary object with counts
 */
export const calculateScheduleSummary = (
  schedules: ShiftCalendarDayItemDto[],
): {
  totalShift: number;
  totalLibur: number;
  totalOverride: number;
} => {
  // Filter schedules to exclude Sunday (day 0)
  const schedulesExcludingSunday = schedules.filter((s) => {
    const date = new Date(s.tanggal);
    return date.getDay() !== 0; // 0 = Sunday
  });

  const totalShift = schedulesExcludingSunday.filter((s) => !s.is_libur && s.shift).length;
  const totalLibur = schedulesExcludingSunday.filter((s) => s.is_libur).length;
  const totalOverride = schedules.filter((s) => s.is_override).length;

  return { totalShift, totalLibur, totalOverride };
};
