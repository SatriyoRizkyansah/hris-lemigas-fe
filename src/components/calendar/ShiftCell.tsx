import { Box, Typography, Chip } from "@mui/material";
import { formatShiftTime, getShiftLabel } from "src/utils";

// Template leftover — HRIS API has no shift DTOs.
type ShiftCalendarDayItemDto = any;

interface ShiftCellProps {
  shiftData?: ShiftCalendarDayItemDto;
  isToday?: boolean;
  isSunday?: boolean;
  highlightColor?: string;
}

export function ShiftCell({ shiftData, isToday = false, isSunday = false, highlightColor = "var(--primary)" }: ShiftCellProps) {
  const shift = shiftData?.shift as any;
  const hasShift = shift && !shiftData?.is_libur;
  const isLibur = shiftData?.is_libur;
  const isOverride = shiftData?.is_override;

  return (
    <Box
      sx={{
        p: 1.5,
        minHeight: 80,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        backgroundColor: isToday ? `color-mix(in srgb, ${highlightColor} 10%, transparent)` : "transparent",
        position: "relative",
      }}
    >
      {isToday && (
        <Box
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: highlightColor,
          }}
        />
      )}

      {isSunday ? (
        <Box
          sx={{
            p: 1.5,
            borderRadius: "8px",
            backgroundColor: "color-mix(in srgb, var(--muted-foreground) 8%, transparent)",
            border: "1px dashed var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 60,
          }}
        >
          <Typography variant="caption" sx={{ color: "var(--muted-foreground)", fontSize: "0.7rem", fontWeight: 600 }}>
            Minggu
          </Typography>
        </Box>
      ) : isLibur ? (
        <Chip
          label="Libur"
          size="small"
          sx={{
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.7rem",
            backgroundColor: "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
            color: "var(--muted-foreground)",
          }}
        />
      ) : hasShift ? (
        <>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "10px",
              backgroundColor: `color-mix(in srgb, ${highlightColor} 15%, transparent)`,
              border: `2px solid ${highlightColor}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                color: highlightColor,
                display: "block",
                mb: 0.5,
              }}
            >
              {getShiftLabel(shift)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.7rem",
                color: "var(--foreground)",
                display: "block",
                fontWeight: 600,
              }}
            >
              {formatShiftTime(shift)}
            </Typography>
          </Box>
          {isOverride && (
            <Chip
              label="Override"
              size="small"
              sx={{
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.6rem",
                height: 18,
                backgroundColor: "color-mix(in srgb, #f59e0b 15%, transparent)",
                color: "#f59e0b",
              }}
            />
          )}
        </>
      ) : (
        <Box
          sx={{
            p: 1.5,
            borderRadius: "8px",
            backgroundColor: "color-mix(in srgb, var(--destructive) 8%, transparent)",
            border: "1px dashed var(--destructive)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 60,
          }}
        >
          <Typography variant="caption" sx={{ color: "var(--destructive)", fontSize: "0.7rem", fontWeight: 600 }}>
            Belum Ada
          </Typography>
        </Box>
      )}
    </Box>
  );
}
