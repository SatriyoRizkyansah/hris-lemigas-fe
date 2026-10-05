/**
 * Data Table Utilities
 * Filtering, sorting, searching logic
 */

type AnyRecord = Record<string, any>;

/**
 * Filter data berdasarkan search query
 */
export const filterDataBySearch = <T extends AnyRecord>(data: T[], query: string, searchableFields?: (keyof T)[]): T[] => {
  if (!query.trim()) return data;

  const lowerQuery = query.toLowerCase();

  return data.filter((item) => {
    // Jika searchableFields defined, cari di fields itu saja
    if (searchableFields) {
      return searchableFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerQuery);
      });
    }

    // Default: cari di semua fields
    return Object.values(item).some((value) => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
};

/**
 * Sort data berdasarkan column
 */
export const sortData = <T extends AnyRecord>(data: T[], orderBy: keyof T, order: "asc" | "desc"): T[] => {
  const sorted = [...data].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === "string") {
      return order === "asc" ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    }

    if (typeof aValue === "number") {
      return order === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    }

    return 0;
  });

  return sorted;
};

/**
 * Paginate data
 */
export const paginateData = <T>(data: T[], page: number, rowsPerPage: number): T[] => {
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  return data.slice(startIndex, endIndex);
};

/**
 * Process data with search, sort, dan pagination
 */
export const processTableData = <T extends AnyRecord>(data: T[], searchQuery: string, sortConfig: { orderBy: keyof T | null; order: "asc" | "desc" }, pagination: { page: number; rowsPerPage: number }, searchableFields?: (keyof T)[]) => {
  // Step 1: Filter berdasarkan search
  let processed = filterDataBySearch(data, searchQuery, searchableFields);

  // Step 2: Sort
  if (sortConfig.orderBy) {
    processed = sortData(processed, sortConfig.orderBy, sortConfig.order);
  }

  // Step 3: Get total untuk pagination
  const total = processed.length;

  // Step 4: Paginate
  processed = paginateData(processed, pagination.page, pagination.rowsPerPage);

  return { data: processed, total };
};
