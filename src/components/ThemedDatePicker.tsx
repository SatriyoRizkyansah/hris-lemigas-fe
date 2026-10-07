import { TextField, InputAdornment, IconButton, Box, Paper, Typography } from "@mui/material";
import { CalendarTodayOutlined as CalendarIcon, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";

interface ThemedDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  size?: "small" | "medium";
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ThemedDatePickerComponent({ label, value, onChange, size = "small", fullWidth = true, required = false, disabled = false }: ThemedDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ?? new Date());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0 });

  // Keep a ref to the latest onChange to avoid stale closures
  const onChangeRef = useRef<typeof onChange>(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Calculate position of the dropdown based on anchor element
  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  // Sync viewDate when value changes externally — adjust state during render (React recommended pattern)
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) setViewDate(new Date(value.getFullYear(), value.getMonth(), 1));
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedAnchor = anchorRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);
      if (!clickedAnchor && !clickedPopover) {
        setOpen(false);
        setMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recalculate position on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // ── Stable callbacks ──
  const toggleOpen = useCallback(() => {
    if (disabled) return;
    updatePosition();
    setOpen((o) => !o);
  }, [disabled, updatePosition]);

  const handleCalendarIconClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      updatePosition();
      setOpen((o) => !o);
    },
    [disabled, updatePosition],
  );

  const handlePrevMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const handleMonthSelect = useCallback(
    (i: number) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(viewDate.getFullYear(), i, 1));
      setMonthPickerOpen(false);
    },
    [viewDate],
  );

  const handlePrevYear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((d) => new Date(d.getFullYear() - 1, d.getMonth(), 1));
  }, []);

  const handleNextYear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((d) => new Date(d.getFullYear() + 1, d.getMonth(), 1));
  }, []);

  const handleMonthPickerToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMonthPickerOpen((o) => !o);
  }, []);

  const handleClear = useCallback(() => {
    onChangeRef.current(null);
    setOpen(false);
  }, []);

  // ── Memoized display value ──
  const displayValue = useMemo(() => {
    if (!value) return "";
    const d = String(value.getDate()).padStart(2, "0");
    const m = String(value.getMonth() + 1).padStart(2, "0");
    return `${d}/${m}/${value.getFullYear()}`;
  }, [value]);

  // ── Memoized calendar data ──
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarData = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInPrev = new Date(y, m, 0).getDate();

    const cellsArr: { day: number; type: "prev" | "current" | "next" }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) cellsArr.push({ day: daysInPrev - i, type: "prev" });
    for (let d = 1; d <= daysInMonth; d++) cellsArr.push({ day: d, type: "current" });
    const remaining = 42 - cellsArr.length;
    for (let d = 1; d <= remaining; d++) cellsArr.push({ day: d, type: "next" });

    return cellsArr;
  }, [viewDate]);

  const handleDaySelect = useCallback(
    (day: number) => {
      const selected = new Date(year, month, day);
      onChangeRef.current(selected);
      setOpen(false);
      setMonthPickerOpen(false);
    },
    [year, month],
  );

  const isTodayRef = useCallback(
    (day: number) => {
      const now = new Date();
      return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    },
    [year, month],
  );

  const isSelectedRef = useCallback(
    (day: number) => {
      return value !== null && day === value.getDate() && month === value.getMonth() && year === value.getFullYear();
    },
    [value, year, month],
  );

  const labelEl = useMemo(
    () =>
      required ? (
        <>
          {label}
          <Box component="span" sx={{ color: "var(--danger, #dc2626)", ml: 0.5, fontWeight: 700 }}>
            *
          </Box>
        </>
      ) : (
        label
      ),
    [label, required],
  );

  return (
    <Box ref={anchorRef} sx={{ position: "relative", display: fullWidth ? "block" : "inline-block" }}>
      {/* Display TextField */}
      <TextField
        label={labelEl}
        value={displayValue}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        onClick={toggleOpen}
        placeholder="DD/MM/YYYY"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleCalendarIconClick}
                edge="end"
                size="small"
                sx={{ color: open ? "var(--primary)" : "var(--muted-foreground)", "&:hover": { color: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" } }}
              >
                <CalendarIcon sx={{ fontSize: size === "small" ? 18 : 20 }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          cursor: "pointer",
          "& .MuiOutlinedInput-root": {
            color: "var(--foreground)",
            backgroundColor: "var(--background)",
            borderRadius: "10px",
            cursor: "pointer",
            "& fieldset": {
              borderColor: open ? "var(--primary)" : "var(--border)",
              borderWidth: open ? "2px" : "1px",
            },
            "&:hover": {
              backgroundColor: "var(--muted)",
              "& fieldset": { borderColor: "var(--primary)" },
            },
            "&.Mui-focused fieldset": {
              borderColor: "var(--primary)",
              borderWidth: "2px",
            },
          },
          "& .MuiInputLabel-root": {
            color: "var(--muted-foreground)",
            fontWeight: 500,
            fontSize: size === "small" ? "0.875rem" : "1rem",
            "&.Mui-focused": { color: "var(--primary)", fontWeight: 600 },
          },
          "& .MuiInputBase-input": {
            color: "var(--foreground)",
            fontWeight: 500,
            fontSize: size === "small" ? "0.875rem" : "1rem",
            cursor: "pointer",
            "&::placeholder": {
              color: "var(--muted-foreground)",
              opacity: 0.5,
            },
          },
        }}
      />

      {/* Custom Calendar Dropdown — only rendered in DOM when open */}
      {open &&
        createPortal(
          <Paper
            ref={popoverRef}
            elevation={8}
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              top: popoverPos.top,
              left: popoverPos.left,
              zIndex: 1500,
              width: 280,
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              boxShadow: "0 8px 32px color-mix(in srgb, var(--foreground) 12%, transparent)",
            }}
          >
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1.25, borderBottom: "1px solid var(--border)", backgroundColor: "var(--muted)" }}>
              <IconButton size="small" onClick={handlePrevMonth} sx={{ color: "var(--muted-foreground)", "&:hover": { color: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" } }}>
                <ChevronLeft fontSize="small" />
              </IconButton>

              <Box
                onClick={handleMonthPickerToggle}
                sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", px: 1, py: 0.5, borderRadius: "var(--radius-sm)", "&:hover": { backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" } }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)", userSelect: "none" }}>
                  {MONTHS[month]} {year}
                </Typography>
              </Box>

              <IconButton size="small" onClick={handleNextMonth} sx={{ color: "var(--muted-foreground)", "&:hover": { color: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" } }}>
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>

            {/* Month/Year Picker Overlay */}
            {monthPickerOpen && (
              <Box sx={{ position: "absolute", top: 52, left: 0, right: 0, bottom: 0, backgroundColor: "var(--card)", zIndex: 10, p: 1.5, overflowY: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <IconButton size="small" onClick={handlePrevYear} sx={{ color: "var(--muted-foreground)", "&:hover": { color: "var(--primary)" } }}>
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{year}</Typography>
                  <IconButton size="small" onClick={handleNextYear} sx={{ color: "var(--muted-foreground)", "&:hover": { color: "var(--primary)" } }}>
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
                  {MONTHS.map((m, i) => (
                    <Box
                      key={m}
                      onClick={handleMonthSelect(i)}
                      sx={{
                        py: 1,
                        borderRadius: "var(--radius-sm)",
                        textAlign: "center",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: i === month ? 700 : 500,
                        color: i === month ? "var(--primary-foreground)" : "var(--foreground)",
                        backgroundColor: i === month ? "var(--primary)" : "transparent",
                        "&:hover": {
                          backgroundColor: i === month ? "var(--primary)" : "color-mix(in srgb, var(--primary) 12%, transparent)",
                          color: i === month ? "var(--primary-foreground)" : "var(--primary)",
                        },
                      }}
                    >
                      {m.slice(0, 3)}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Day headers */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", px: 1.5, pt: 1.25, pb: 0.5 }}>
              {DAYS.map((d) => (
                <Typography key={d} sx={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "var(--muted-foreground)", py: 0.25, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {d}
                </Typography>
              ))}
            </Box>

            {/* Calendar grid */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", px: 1.5, pb: 1, gap: "2px" }}>
              {calendarData.map((cell, idx) => {
                const isCurrent = cell.type === "current";
                const selected = isCurrent && isSelectedRef(cell.day);
                const todayCell = isCurrent && isTodayRef(cell.day);

                return (
                  <Box
                    key={idx}
                    onClick={() => isCurrent && handleDaySelect(cell.day)}
                    sx={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--radius-sm)",
                      cursor: isCurrent ? "pointer" : "default",
                      fontSize: "0.8125rem",
                      fontWeight: selected ? 700 : todayCell ? 600 : 400,
                      color: selected ? "var(--primary-foreground)" : todayCell ? "var(--primary)" : isCurrent ? "var(--foreground)" : "var(--muted-foreground)",
                      backgroundColor: selected ? "var(--primary)" : "transparent",
                      border: todayCell && !selected ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                      opacity: isCurrent ? 1 : 0.35,
                      userSelect: "none",
                      "&:hover": isCurrent && !selected ? { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" } : {},
                    }}
                  >
                    {cell.day}
                  </Box>
                );
              })}
            </Box>

            {/* Footer */}
            <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1, borderTop: "1px solid var(--border)", backgroundColor: "var(--muted)" }}>
              <Typography onClick={handleClear} sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", cursor: "pointer", fontWeight: 600, "&:hover": { color: "var(--destructive)" } }}>
                Hapus
              </Typography>
              <Typography onClick={() => setOpen(false)} sx={{ fontSize: "0.75rem", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}>
                Tutup
              </Typography>
            </Box>
          </Paper>,
          document.body,
        )}
    </Box>
  );
}

export const ThemedDatePicker = memo(ThemedDatePickerComponent);
