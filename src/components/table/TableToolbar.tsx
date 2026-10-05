import { Box, TextField, InputAdornment, Button, Chip } from "@mui/material";
import { memo, useCallback, useMemo, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { Search as SearchIcon, RestartAlt as RestartAltIcon } from "@mui/icons-material";
import type { TableToolbarProps } from "./types";
import FilterSelect from "./FilterSelect";
import { StatusFilterButton } from "./StatusFilterButton";

const TableToolbarComponent = ({ searchValue, onSearchChange, onSearchSubmit, searchPlaceholder = "Search...", title, filters = [], statusFilter, toolbarSlot }: TableToolbarProps) => {
  const hasFilters = filters && filters.length > 0;
  const hasActiveFilters = useMemo(() => filters?.some((filter) => filter.value !== "__all"), [filters]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external searchValue to input element
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== searchValue) {
      inputRef.current.value = searchValue;
    }
  }, [searchValue]);

  const handleResetFilters = useCallback(() => {
    filters?.forEach((filter) => {
      filter.onChange("__all");
    });
  }, [filters]);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange],
  );

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && onSearchSubmit) {
        event.preventDefault();
        onSearchSubmit();
      }
    },
    [onSearchSubmit],
  );

  return (
    <Box sx={{ mb: 2.5 }}>
      {/* Search Bar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: hasFilters ? 2 : 0,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {title && (
            <Box component="h2" sx={{ m: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)" }}>
              {title}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1.5, ml: "auto", width: { xs: "100%", sm: "auto" } }}>
          {statusFilter && <StatusFilterButton value={statusFilter.value} onChange={statusFilter.onChange} options={statusFilter.options} />}

          {toolbarSlot}

          <TextField
            inputRef={inputRef}
            placeholder={searchPlaceholder}
            defaultValue={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            size="small"
            sx={{
              minWidth: { xs: 1, sm: 320 },
              flex: { xs: 1, sm: "none" },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
                borderRadius: "8px",
                fontSize: "0.875rem",
                transition: "all 0.2s ease",
                "& fieldset": {
                  borderColor: "var(--border)",
                },
                "&:hover fieldset": {
                  borderColor: "var(--muted-foreground)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--primary)",
                  borderWidth: "1.5px",
                },
              },
              "& .MuiOutlinedInput-input": {
                py: 1,
                color: "var(--foreground)",
                caretColor: "var(--foreground)",
              },
              "& .MuiOutlinedInput-input::placeholder": {
                color: "var(--muted-foreground)",
                opacity: 0.6,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "var(--muted-foreground)", fontSize: "1.125rem" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Filters - Wrapped in Box */}
      {hasFilters && (
        <Box
          sx={{
            backgroundColor: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component="span"
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Filters
              </Box>
              {hasActiveFilters && (
                <Chip
                  label={filters.filter((f) => f.value !== "__all").length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    backgroundColor: "var(--primary)",
                    color: "white",
                  }}
                />
              )}
            </Box>
            {hasActiveFilters && (
              <Button
                size="small"
                startIcon={<RestartAltIcon sx={{ fontSize: "1rem" }} />}
                onClick={handleResetFilters}
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "none",
                  color: "var(--muted-foreground)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "var(--accent)",
                    color: "var(--foreground)",
                  },
                }}
              >
                Reset Filters
              </Button>
            )}
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: `repeat(${Math.min(filters.length, 4)}, 1fr)`,
              },
              gap: 2,
            }}
          >
            {filters.map((filter) => (
              <FilterSelect key={filter.id} id={filter.id} label={filter.label} value={filter.value} options={filter.options} onChange={filter.onChange} disabled={filter.disabled} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export const TableToolbar = memo(TableToolbarComponent);
