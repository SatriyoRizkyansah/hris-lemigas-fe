import { Box, Typography, IconButton, Button } from "@mui/material";
import { ChevronLeftRounded, ChevronRightRounded, TodayRounded } from "@mui/icons-material";
import { getWeekNumber } from "src/utils";

interface WeekNavigationProps {
  weekDates: Date[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekNavigation({ weekDates, onPrevWeek, onNextWeek, onToday }: WeekNavigationProps) {
  const weekNumber = getWeekNumber(weekDates[0]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--muted)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton
          onClick={onPrevWeek}
          size="small"
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)",
            "&:hover": { backgroundColor: "var(--accent)" },
          }}
        >
          <ChevronLeftRounded fontSize="small" />
        </IconButton>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--foreground)" }}>
            {weekDates[0].toLocaleDateString("id-ID", { day: "numeric", month: "short" })} -{" "}
            {weekDates[6].toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--muted-foreground)" }}>
            Week {weekNumber}
          </Typography>
        </Box>

        <IconButton
          onClick={onNextWeek}
          size="small"
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)",
            "&:hover": { backgroundColor: "var(--accent)" },
          }}
        >
          <ChevronRightRounded fontSize="small" />
        </IconButton>
      </Box>

      <Button
        onClick={onToday}
        startIcon={<TodayRounded />}
        size="small"
        sx={{
          border: "1px solid var(--border)",
          borderRadius: "8px",
          px: 2,
          textTransform: "none",
          fontWeight: 600,
          color: "var(--foreground)",
          "&:hover": { backgroundColor: "var(--accent)" },
        }}
      >
        Hari Ini
      </Button>
    </Box>
  );
}
