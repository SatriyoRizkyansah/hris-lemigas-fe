export const extractValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    const candidate = record.nama ?? record.text ?? record.value ?? record.label;

    if (candidate !== null && candidate !== undefined && candidate !== "") {
      return String(candidate);
    }

    return "-";
  }

  return String(value);
};
