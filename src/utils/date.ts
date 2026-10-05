const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const format_date = (value?: unknown) => {
  if (typeof value !== "string") return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return DATE_FORMATTER.format(date);
};
