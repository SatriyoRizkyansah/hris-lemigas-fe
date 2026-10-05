import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography, Fade, useMediaQuery, useTheme } from "@mui/material";
import { TableToolbar } from "./TableToolbar";
import { TablePagination } from "./TablePagination";
import { TableSkeleton } from "./TableSkeleton";
import type { ServerDataTableProps } from "./types";

const DEFAULT_EMPTY_LABEL = "No data available";

export const ServerDataTable = <T extends Record<string, any>>({
  columns,
  data,
  title,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search...",
  filters = [],
  statusFilter,
  isLoading = false,
  totalRows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  onRowClick,
  compact = true,
  emptyState,
  emptyStateLabel = DEFAULT_EMPTY_LABEL,
  showPaginationCount = true,
  highlightDraftStatus = false,
  // maxMobileColumns = 6,
}: ServerDataTableProps<T>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const showInitialLoadingState = isLoading && data.length === 0;
  const showPaginationLoadingState = isLoading && data.length > 0;
  const showEmptyState = !isLoading && data.length === 0;
  const emptyContent = emptyState ?? (
    <Typography variant="body2" sx={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
      {emptyStateLabel}
    </Typography>
  );

  // On desktop: show all columns as normal table
  // On mobile: card layout —
  //   - First column = primary header (top-left)
  //   - Last column that looks like an action = top-right
  //   - Everything else = detail grid below
  //
  // Action column detection: last column whose label is "Aksi" OR "Detail"
  // OR whose align is "center" and is the last column (common pattern)
  const lastCol = columns.length > 1 ? columns[columns.length - 1] : null;
  const ACTION_LABELS = ["aksi", "detail", "action", "actions"];
  const isLastColAction = lastCol
    ? ACTION_LABELS.includes(String(lastCol.label).toLowerCase())
    : false;

  const primaryCol = isMobile ? columns[0] : null;
  const actionCol = isMobile && isLastColAction ? lastCol : null;
  // detail = everything between first and last (if last is action) or first and end
  const detailColumns = isMobile
    ? columns.slice(1, isLastColAction ? columns.length - 1 : columns.length)
    : [];

  return (
    <Box>
      <TableToolbar searchValue={searchValue} onSearchChange={onSearchChange} onSearchSubmit={onSearchSubmit} searchPlaceholder={searchPlaceholder} title={title} filters={filters} statusFilter={statusFilter} />

      <Box
        sx={{
          borderRadius: "8px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          overflow: "hidden",
          transition: "box-shadow 0.3s ease",
          display: "flex",
          flexDirection: "column",
          height: { xs: "auto", sm: "calc(100vh - 280px)" },
          minHeight: { xs: "unset", sm: "500px" },
        }}
      >
        {showInitialLoadingState ? (
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <TableSkeleton rows={rowsPerPage} columns={isMobile ? 3 : columns.length} compact={compact} />
          </Box>
        ) : (
          <>
            {/* Scrollable Container */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                "&::-webkit-scrollbar": { width: "8px", height: "8px" },
                "&::-webkit-scrollbar-track": { backgroundColor: "var(--muted)" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "var(--border)",
                  borderRadius: "4px",
                  "&:hover": { backgroundColor: "var(--muted-foreground)" },
                },
                scrollbarWidth: "thin",
                scrollbarColor: "var(--border) var(--muted)",
              }}
            >
              {showPaginationLoadingState ? (
                <TableSkeleton rows={rowsPerPage} columns={isMobile ? 3 : columns.length} compact={compact} />
              ) : isMobile ? (
                /* ─── MOBILE: card-style rows ─── */
                <Fade in={!isLoading} timeout={300}>
                  <Box>
                    {data.length > 0 ? (
                      data.map((row, rowIndex) => {
                        const isDraft = highlightDraftStatus && row.status_aktif === "DRAFT";
                        const isDiajukan = highlightDraftStatus && row.status_aktif === "DIAJUKAN";
                        const isYellowStatus = isDraft || isDiajukan;

                        return (
                          <Box
                            key={rowIndex}
                            onClick={() => onRowClick?.(row)}
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderBottom: rowIndex < data.length - 1 ? "1px solid var(--border)" : "none",
                              cursor: onRowClick ? "pointer" : "default",
                              backgroundColor: isYellowStatus ? "color-mix(in srgb, #f59e0b 12%, var(--card))" : "var(--card)",
                              transition: "background-color 0.2s ease",
                              "&:active": {
                                backgroundColor: isYellowStatus ? "color-mix(in srgb, #f59e0b 22%, var(--card))" : "var(--accent)",
                              },
                            }}
                          >
                            {/* Header row: first column (left) + action (right) */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: detailColumns.length > 0 ? 1 : 0 }}>
                              {/* Primary column label + value */}
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
                                        ? primaryCol.render(row[primaryCol.id] as any, row)
                                        : String(row[primaryCol.id] ?? "-")}
                                    </Box>
                                  </>
                                )}
                              </Box>

                              {/* Action column always top-right */}
                              {actionCol && (
                                <Box
                                  sx={{ flexShrink: 0, ml: "auto" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {actionCol.render ? actionCol.render(row[actionCol.id] as any, row) : null}
                                </Box>
                              )}
                            </Box>

                            {/* Detail grid: 2 columns */}
                            {detailColumns.length > 0 && (
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "6px 8px",
                                  pl: 0,
                                  pt: 1.25,
                                  mt: 1,
                                  borderTop: "1px solid var(--border)",
                                }}
                              >
                                {detailColumns.map((col) => {
                                  const val = col.render ? col.render(row[col.id] as any, row) : String(row[col.id] ?? "-");
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
                                          // Chip override: paksa ukuran kecil di detail grid
                                          "& .MuiChip-root": {
                                            height: "auto",
                                            fontSize: "0.65rem",
                                            borderRadius: "5px",
                                            "& .MuiChip-label": {
                                              px: "6px",
                                              py: "1px",
                                            },
                                          },
                                          // Flex wrap untuk chips agar tidak overflow
                                          "& > .MuiBox-root": {
                                            flexWrap: "wrap",
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
                      <Box sx={{ py: 8, textAlign: "center" }}>{emptyContent}</Box>
                    )}
                  </Box>
                </Fade>
              ) : (
                /* ─── DESKTOP: normal table ─── */
                <Fade in={!isLoading} timeout={300}>
                  <Table size={compact ? "small" : "medium"} sx={{ minWidth: 700, tableLayout: "fixed" }}>
                    <TableHead sx={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "var(--muted)" }}>
                      <TableRow
                        sx={{
                          "& th": {
                            py: 1,
                            borderBottom: "1px solid var(--border)",
                          },
                        }}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={String(column.id)}
                            align={column.align}
                            sx={{
                              fontWeight: 700,
                              color: "var(--foreground)",
                              fontSize: "0.75rem",
                              width: column.width,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              backgroundColor: "var(--muted)",
                            }}
                          >
                            {column.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {data.length > 0 &&
                        data.map((row, rowIndex) => {
                          const isDraft = highlightDraftStatus && row.status_aktif === "DRAFT";
                          const isDiajukan = highlightDraftStatus && row.status_aktif === "DIAJUKAN";
                          const isYellowStatus = isDraft || isDiajukan;

                          return (
                            <TableRow
                              key={rowIndex}
                              hover={Boolean(onRowClick)}
                              onClick={() => onRowClick?.(row)}
                              sx={{
                                cursor: onRowClick ? "pointer" : "default",
                                backgroundColor: isYellowStatus ? "color-mix(in srgb, #f59e0b 15%, var(--card))" : "var(--card)",
                                transition: "background-color 0.2s ease",
                                "&:hover": {
                                  backgroundColor: isYellowStatus ? "color-mix(in srgb, #f59e0b 25%, var(--card))" : "var(--accent)",
                                },
                                "& td": {
                                  borderBottom: "1px solid var(--border)",
                                  color: "var(--foreground)",
                                  fontSize: "0.875rem",
                                  py: compact ? 1.3 : 2,
                                  fontWeight: 500,
                                },
                                "&:last-of-type td": { borderBottom: 0 },
                              }}
                            >
                              {columns.map((column) => (
                                <TableCell key={String(column.id)} align={column.align} sx={{ width: column.width }}>
                                  {column.render ? column.render(row[column.id] as any, row) : String(row[column.id] ?? "-")}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}

                      {showEmptyState && (
                        <TableRow>
                          <TableCell colSpan={columns.length} align="center" sx={{ py: 8, borderBottom: "none" }}>
                            {emptyContent}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Fade>
              )}
            </Box>

            {/* Sticky Footer */}
            <Box sx={{ flexShrink: 0, borderTop: "1px solid var(--border)" }}>
              <TablePagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} rowsPerPageOptions={rowsPerPageOptions} showTotalCount={showPaginationCount} />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

ServerDataTable.displayName = "ServerDataTable";
