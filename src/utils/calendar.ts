/**
 * Calendar utility functions for shift management
 */

/**
 * Get all dates for a week starting from Monday
 * @param date - Any date within the week
 * @returns Array of 7 dates (Monday to Sunday)
 */
export const getWeekDates = (date: Date): Date[] => {
  const curr = new Date(date);
  const dayOfWeek = curr.getDay(); // 0 = Sunday, 1 = Monday, ...
  // Calculate days to go back to Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // Get Monday of the current week
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMonday);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(day);
  }

  return dates;
};

/**
 * Format date to YYYY-MM-DD format
 * @param date - Date object to format
 * @returns Formatted date string
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format date to full ISO 8601 with timezone offset (e.g. 2026-08-13T08:00:00+07:00)
 * @param date - Date object to format
 * @returns Formatted ISO 8601 datetime string
 */
export const formatDateTimeToISO = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // Timezone offset in ±HH:MM
  const tzOffset = -date.getTimezoneOffset();
  const tzSign = tzOffset >= 0 ? "+" : "-";
  const tzHours = pad(Math.abs(tzOffset) / 60);
  const tzMinutes = pad(Math.abs(tzOffset) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMinutes}`;
};

/**
 * Get short day name in Indonesian
 * @param dayNumber - Day number (0 = Sunday, 1 = Monday, etc.)
 * @returns Short day name
 */
export const getDayName = (dayNumber: number): string => {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[dayNumber] || "";
};

/**
 * Get full day name in Indonesian
 * @param dayNumber - Day number (0 = Sunday, 1 = Monday, etc.)
 * @returns Full day name
 */
export const getFullDayName = (dayNumber: number): string => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[dayNumber] || "";
};

/**
 * Get week number of the year
 * @param date - Date to get week number for
 * @returns Week number (1-53)
 */
export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is Sunday
 * @param date - Date to check
 * @returns True if date is Sunday
 */
export const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};

/**
 * Add days to a date
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add weeks to a date
 * @param date - Starting date
 * @param weeks - Number of weeks to add (can be negative)
 * @returns New date
 */
export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};
