import { Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  compact?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 9, compact = true }: TableSkeletonProps) {
  return (
    <TableContainer>
      <Table size={compact ? "small" : "medium"} sx={{ minWidth: 920 }}>
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: "var(--muted)",
              "& th": {
                borderBottom: "1px solid var(--border)",
                py: 1.5,
              },
            }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton
                  variant="text"
                  // eslint-disable-next-line react-hooks/purity
                  width={`${60 + Math.random() * 40}%`}
                  height={20}
                  sx={{
                    backgroundColor: "var(--accent)",
                  }}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                backgroundColor: "var(--card)",
                "& td": {
                  borderBottom: "1px solid var(--border)",
                  py: compact ? 1.5 : 2,
                },
                "&:last-of-type td": {
                  borderBottom: 0,
                },
              }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    variant="text"
                    width={`${50 + Math.random() * 50}%`}
                    height={16}
                    sx={{
                      backgroundColor: "var(--accent)",
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TableSkeleton;
