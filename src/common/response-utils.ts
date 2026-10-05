type PaginationLike = object;

type UnknownRecord = Record<string, unknown>;

const is_record = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

export const extract_list = <T>(response: unknown): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (!is_record(response)) {
    return [];
  }

  const level1 = response as UnknownRecord;
  const level2 = is_record(level1.data) ? (level1.data as UnknownRecord) : undefined;
  const level3 = level2 && is_record(level2.data) ? (level2.data as UnknownRecord) : undefined;

  const candidates: unknown[] = [level1.data, level2?.data, level3?.data];
  const list = candidates.find((candidate) => Array.isArray(candidate)) as T[] | undefined;

  return list ?? [];
};

export const extract_payload_with_pagination = <T, P extends PaginationLike = Record<string, unknown>>(response: unknown): { items: T[]; pagination?: P } => {
  if (Array.isArray(response)) {
    return { items: response as T[] };
  }

  if (!is_record(response)) {
    return { items: [] };
  }

  const level1 = response as UnknownRecord;
  const level2 = is_record(level1.data) ? (level1.data as UnknownRecord) : undefined;
  const level3 = level2 && is_record(level2.data) ? (level2.data as UnknownRecord) : undefined;

  const candidates: unknown[] = [level1.data, level2?.data, level3?.data];
  const items = candidates.find((candidate) => Array.isArray(candidate)) as T[] | undefined;

  const paginationCandidates = [level1.pagination, level2?.pagination, level3?.pagination];
  const pagination = paginationCandidates.find((candidate) => is_record(candidate)) as P | undefined;

  return { items: items ?? [], pagination };
};
