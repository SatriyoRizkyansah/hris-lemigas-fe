import React, { useMemo, useState, useId } from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Box, Typography, FormControl, InputLabel, Select, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { FilterList } from "@mui/icons-material";
import { TableToolbar } from "./TableToolbar";
import { TablePagination } from "./TablePagination";
import { processTableData } from "./utils";
import type { DataTableProps } from "./types";

type AnyData = any;

const ALL_FILTER_VALUE = "__all";
const ACTION_LABELS = ["aksi", "detail", "action", "actions"];

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<AnyData>>(
  (
    {
      columns,
      data,
      title,
      searchPlaceholder = "Search...",
      rowsPerPageOptions = [5, 10, 25],
      onRowClick,
      compact = true,
      filterField,
      filterOptions,
      defaultFilterValue,
      filterLabel,
      hideSearch = false,
      hidePagination = false,
      highlightDraftStatus = false,
      emptyState,
    },
    ref,
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0] || 10);
    const filterDropdownId = useId();

    const showFilter = Boolean(filterField && filterOptions?.length);
    const normalizedFilterOptions = useMemo(() => {
      if (!showFilter || !filterOptions) return [];
      const hasAll = filterOptions.some((option) => option.value === ALL_FILTER_VALUE);
      return hasAll ? filterOptions : [{ label: "All", value: ALL_FILTER_VALUE }, ...filterOptions];
    }, [filterOptions, showFilter]);

    const initialFilterValue = defaultFilterValue ?? normalizedFilterOptions[0]?.value ?? ALL_FILTER_VALUE;
    const [filterValue, setFilterValue] = useState(initialFilterValue);

    const activeFilterValue = useMemo(() => {
      if (!showFilter) return ALL_FILTER_VALUE;
      const values = normalizedFilterOptions.map((option) => option.value);
      if (values.includes(filterValue)) return filterValue;
      return normalizedFilterOptions[0]?.value ?? ALL_FILTER_VALUE;
    }, [filterValue, normalizedFilterOptions, showFilter]);

    const searchableFields = useMemo(() => columns.filter((col) => col.filterable !== false).map((col) => col.id), [columns]);

    const filteredData = useMemo(() => {
      if (!showFilter || !filterField) return data;
      if (activeFilterValue === ALL_FILTER_VALUE) return data;
      return data.filter((row) => String(row[filterField]) === activeFilterValue);
    }, [data, filterField, activeFilterValue, showFilter]);

    const defaultSortConfig = useMemo(() => ({ orderBy: null as keyof AnyData | null, order: "asc" as const }), []);

    const { data: processedData, total } = useMemo(
      () => processTableData(filteredData, searchQuery, defaultSortConfig, { page, rowsPerPage }, searchableFields as unknown as (keyof AnyData)[]),
      [filteredData, searchQuery, defaultSortConfig, page, rowsPerPage, searchableFields],
    );

    const handleFilterSelectChange = (event: SelectChangeEvent<string>) => {
      setFilterValue(event.target.value as string);
      setPage(0);
    };

    // Mobile column split — same logic as ServerDataTable
    const lastCol = columns.length > 1 ? columns[columns.length - 1] : null;
    const isLastColAction = lastCol ? ACTION_LABELS.includes(String(lastCol.label).toLowerCase()) : false;
    const primaryCol = isMobile ? columns[0] : null;
    const actionCol = isMobile && isLastColAction ? lastCol : null;
    const detailColumns = isMobile ? columns.slice(1, isLastColAction ? columns.length - 1 : columns.length) : [];

    return (
      <Box ref={ref}>
        {!hideSearch && <TableToolbar searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder={searchPlaceholder} title={title} />}

        <Box
          sx={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            overflow: "hidden",
          }}
        >
          {showFilter && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                px: 2,
                py: 2,
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterList sx={{ color: "var(--muted-foreground)" }} />
                <Typography variant="body2" sx={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
                  Filter by {filterLabel ?? "status"}
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id={`${filterDropdownId}-label`} sx={{ color: "var(--muted-foreground)", "&.Mui-focused": { color: "var(--foreground)" } }}>
                  {filterLabel ?? "Filter"}
                </InputLabel>
                <Select
                  labelId={`${filterDropdownId}-label`}
                  id={`${filterDropdownId}-select`}
                  value={activeFilterValue}
                  label={filterLabel ?? "Filter"}
                  onChange={handleFilterSelectChange}
                  sx={{
                    borderRadius: 999,
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--muted-foreground)" },
                    "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
                    "& .MuiSelect-icon": { color: "var(--muted-foreground)" },
                  }}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" } } }}
                >
                  {normalizedFilterOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* ─── MOBILE: card layout ─── */}
          {isMobile ? (
            processedData.length > 0 ? (
              processedData.map((row, rowIndex) => {
                const isDraft = highlightDraftStatus && (row.status_aktif === "DRAFT" || row.status_aktif === "DIAJUKAN");
                return (
                  <Box
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: rowIndex < processedData.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: onRowClick ? "pointer" : "default",
                      backgroundColor: isDraft ? "color-mix(in srgb, #f59e0b 12%, var(--card))" : "var(--card)",
                      transition: "background-color 0.2s ease",
                      "&:active": {
                        backgroundColor: isDraft ? "color-mix(in srgb, #f59e0b 22%, var(--card))" : "var(--accent)",
                      },
                    }}
                  >
                    {/* Header: primary col + action */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: detailColumns.length > 0 ? 0 : 0 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {primaryCol && (
                          <>
                            <Typography
                              sx={{
                                fontSize: "0.63rem",
                                fontWeight: 700,
                                color: "var(--muted-foreground)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                lineHeight: 1.2,
                                mb: "3px",
                              }}
                            >
                              {primaryCol.label}
                            </Typography>
                            <Box
                              sx={{
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                color: "var(--foreground)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                lineHeight: 1.4,
                              }}
                            >
                              {primaryCol.render
                                ? primaryCol.render(row[primaryCol.id], row)
                                : String(row[primaryCol.id] ?? "-")}
                            </Box>
                          </>
                        )}
                      </Box>
                      {actionCol && (
                        <Box sx={{ flexShrink: 0, ml: "auto" }} onClick={(e) => e.stopPropagation()}>
                          {actionCol.render ? actionCol.render(row[actionCol.id], row) : null}
                        </Box>
                      )}
                    </Box>

                    {/* Detail grid */}
                    {detailColumns.length > 0 && (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px 8px",
                          mt: 1,
                          pt: 1.25,
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        {detailColumns.map((col) => {
                          const val = col.render ? col.render(row[col.id], row) : String(row[col.id] ?? "-");
                          return (
                            <Box key={String(col.id)} sx={{ minWidth: 0, overflow: "hidden" }}>
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: "0.65rem",
                                  color: "var(--muted-foreground)",
                                  fontWeight: 600,
                                  display: "block",
                                  lineHeight: 1.3,
                                  mb: "3px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                {col.label}
                              </Typography>
                              <Box
                                sx={{
                                  fontSize: "0.73rem",
                                  color: "var(--foreground)",
                                  fontWeight: 500,
                                  lineHeight: 1.4,
                                  overflow: "hidden",
                                  "& .MuiChip-root": {
                                    height: "auto",
                                    fontSize: "0.65rem",
                                    borderRadius: "5px",
                                    "& .MuiChip-label": { px: "6px", py: "1px" },
                                  },
                                }}
                              >
                                {val}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })
            ) : (
              <Box sx={{ py: 4, textAlign: "center" }}>
                {emptyState || <Typography color="var(--muted-foreground)">{searchQuery ? "No results found" : "No data available"}</Typography>}
              </Box>
            )
          ) : (
            /* ─── DESKTOP: normal table ─── */
            <TableContainer>
              <Table size={compact ? "small" : "medium"} sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "color-mix(in srgb, var(--muted) 75%, transparent)", "& th": { borderColor: "var(--border)" } }}>
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.id)}
                        align={column.align}
                        sx={{
                          fontWeight: 600,
                          color: "var(--foreground)",
                          width: column.width,
                          backgroundColor: "var(--muted)",
                          borderColor: "var(--border)",
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedData.length > 0 ? (
                    processedData.map((row, rowIndex) => {
                      const isDraft = highlightDraftStatus && (row.status_aktif === "DRAFT" || row.status_aktif === "DIAJUKAN");
                      return (
                        <TableRow
                          key={rowIndex}
                          hover={Boolean(onRowClick)}
                          onClick={() => onRowClick?.(row)}
                          sx={{
                            cursor: onRowClick ? "pointer" : "default",
                            backgroundColor: isDraft ? "color-mix(in srgb, #f59e0b 15%, var(--card))" : "var(--card)",
                            transition: "background-color 0.2s ease",
                            "&:hover": {
                              backgroundColor: isDraft ? "color-mix(in srgb, #f59e0b 25%, var(--card))" : "var(--accent)",
                            },
                            "& td": {
                              borderBottom: "1px solid var(--border)",
                              color: "var(--foreground)",
                              fontSize: compact ? "0.9rem" : "1rem",
                              py: compact ? 1.75 : 2.25,
                            },
                            "&:last-of-type td": { borderBottom: 0 },
                          }}
                        >
                          {columns.map((column) => (
                            <TableCell key={String(column.id)} align={column.align}>
                              {column.render ? column.render(row[column.id], row) : String(row[column.id])}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center" sx={{ py: 4, borderBottom: "none" }}>
                        {emptyState || <Typography color="var(--muted-foreground)">{searchQuery ? "No results found" : "No data available"}</Typography>}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!hidePagination && (
            <TablePagination
              page={page}
              rowsPerPage={rowsPerPage}
              totalRows={total}
              onPageChange={setPage}
              onRowsPerPageChange={(newRowsPerPage) => {
                setRowsPerPage(newRowsPerPage);
                setPage(0);
              }}
              rowsPerPageOptions={rowsPerPageOptions}
            />
          )}
        </Box>
      </Box>
    );
  },
);

DataTable.displayName = "DataTable";
