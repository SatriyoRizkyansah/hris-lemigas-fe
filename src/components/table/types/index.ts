/**
 * Data Table Types & Interfaces
 */

export interface Column<T> {
  id: keyof T | string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string | number | Record<string, string | number>;
  sortable?: boolean;
  filterable?: boolean;
  hideMobile?: boolean; // Hide column on mobile screens (xs breakpoint)
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface TableFilterOption {
  label: string;
  value: string;
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
}

export interface FilterState {
  [key: string]: string | number | boolean | null;
}

export interface SortState {
  orderBy: string | null;
  order: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  searchPlaceholder?: string;
  rowsPerPageOptions?: number[];
  onRowClick?: (row: T) => void;
  compact?: boolean;
  filterField?: keyof T;
  filterOptions?: TableFilterOption[];
  defaultFilterValue?: string;
  filterLabel?: string;
  hideSearch?: boolean;
  hidePagination?: boolean;
  highlightDraftStatus?: boolean; // Enable yellow background for DRAFT/DIAJUKAN status rows
  emptyState?: React.ReactNode; // Custom empty state component
}

export interface ServerTableFilter {
  id: string;
  label: string;
  value: string;
  options: TableFilterOption[];
  onChange: (value: string) => void;
  minWidth?: number;
  disabled?: boolean;
}

export interface StatusOption {
  value: string;
  label: string;
  color: string;
}

export interface StatusFilter {
  value: string;
  options: StatusOption[];
  onChange: (value: string) => void;
  label?: string;
  renderButton?: (currentOption: StatusOption | undefined, onClick: (e: React.MouseEvent<HTMLButtonElement>) => void) => React.ReactNode;
}

export interface ServerDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filters?: ServerTableFilter[];
  statusFilter?: StatusFilter;
  isLoading?: boolean;
  totalRows: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
  onRowClick?: (row: T) => void;
  compact?: boolean;
  emptyState?: React.ReactNode;
  emptyStateLabel?: string;
  loadingStateLabel?: string;
  showPaginationCount?: boolean; // Optional: show/hide "1-10 of 3630" in pagination
  highlightDraftStatus?: boolean; // Optional: enable yellow background for DRAFT/DIAJUKAN status rows
  maxMobileColumns?: number; // Optional: max columns to show on mobile (default 6, keeps first N-1 + last action column)
}

export interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  title?: string;
  filters?: ServerTableFilter[];
  statusFilter?: StatusFilter;
  toolbarSlot?: React.ReactNode;
}

export interface TablePaginationProps {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
  showTotalCount?: boolean; // Optional: show/hide "1-10 of 3630" text
}
