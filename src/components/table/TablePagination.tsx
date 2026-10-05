import { Box, IconButton, MenuItem, Select, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight, KeyboardArrowDownRounded } from "@mui/icons-material";
import type { TablePaginationProps } from "./types";

export function TablePagination({ page, rowsPerPage, totalRows, onPageChange, onRowsPerPageChange, rowsPerPageOptions = [5, 10, 25, 50], showTotalCount = true }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;
  const startItem = totalRows === 0 ? 0 : page * rowsPerPage + 1;
  const endItem = Math.min(totalRows, (page + 1) * rowsPerPage);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        justifyContent: "flex-end",
        flexWrap: "wrap",
        px: 2.5,
        py: 1.5,
        backgroundColor: "var(--card)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="body2" sx={{ color: "var(--muted-foreground)", fontSize: "0.8125rem", fontWeight: 500 }}>
          Rows per page:
        </Typography>
        <Select
          size="small"
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          IconComponent={KeyboardArrowDownRounded}
          sx={{
            minWidth: 70,
            backgroundColor: "var(--card)",
            color: "var(--foreground)",
            borderRadius: "6px",
            height: 32,
            fontSize: "0.8125rem",
            fontWeight: 600,
            transition: "all 0.2s ease",
            "& fieldset": {
              borderColor: "var(--border)",
            },
            "&:hover fieldset": {
              borderColor: "var(--muted-foreground)",
            },
            "& svg": {
              color: "var(--muted-foreground)",
            },
            "& .MuiSelect-select": {
              py: 0.5,
            },
          }}
        >
          {rowsPerPageOptions.map((option) => (
            <MenuItem key={option} value={option} sx={{ fontSize: "0.8125rem" }}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Typography variant="body2" sx={{ color: "var(--muted-foreground)", fontSize: "0.8125rem", fontWeight: 500 }}>
        {showTotalCount ? `${startItem}-${endItem} of ${totalRows || 0}` : `${startItem}-${endItem}`}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={isFirstPage}
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--foreground)",
            width: 32,
            height: 32,
            backgroundColor: "var(--card)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "var(--accent)",
              borderColor: "var(--primary)",
            },
            "&:disabled": {
              opacity: 0.3,
              backgroundColor: "var(--card)",
              cursor: "not-allowed",
            },
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={isLastPage}
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--foreground)",
            width: 32,
            height: 32,
            backgroundColor: "var(--card)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "var(--accent)",
              borderColor: "var(--primary)",
            },
            "&:disabled": {
              opacity: 0.3,
              backgroundColor: "var(--card)",
              cursor: "not-allowed",
            },
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
