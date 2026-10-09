import { auth_signal } from "@Signal/use-signal/auth-init-signal";

// ─── Role HRIS ────────────────────────────────────────────────────────────────

export type HrisRole = "superadmin" | "koordinator" | "keuangan" | "karyawan";

export const resolve_current_role = (): HrisRole => {
  const akses = (auth_signal.value.selectedAuthorization?.akses ?? (auth_signal.value.data?.akses as string | undefined) ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

  if (akses.includes("superadmin") || akses.includes("admin")) return "superadmin";
  if (akses.includes("koordinator")) return "koordinator";
  if (akses.includes("keuangan")) return "keuangan";
  return "karyawan";
};

export const current_user_name = (): string => {
  return auth_signal.value.loginResponse?.nama || auth_signal.value.data?.nama || "Pengguna";
};

// ─── Format helpers ───────────────────────────────────────────────────────────

export const format_rupiah = (value?: number | null): string => {
  if (value === undefined || value === null) return "-";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
};

export const format_date = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

export const to_date_input = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const current_year = (): number => new Date().getFullYear();

export const current_month = (): number => new Date().getMonth() + 1;

// ─── Options ──────────────────────────────────────────────────────────────────

export const BULAN_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(2000, i, 1).toLocaleDateString("id-ID", { month: "long" }),
  value: String(i + 1),
}));

export const TIPE_PEGAWAI_OPTIONS = [
  { label: "PNS", value: "PNS" },
  { label: "ASN", value: "ASN" },
  { label: "Outsourcing", value: "OUTSOURCING" },
  { label: "TA", value: "TA" },
];

export const TA_KATEGORI_OPTIONS = [
  { label: "TA Biasa", value: "BIASA" },
  { label: "TA RO", value: "RO" },
];

export const STATUS_RO_OPTIONS = [
  { label: "Aktif", value: "AKTIF" },
  { label: "Nonaktif", value: "NONAKTIF" },
  { label: "Selesai", value: "SELESAI" },
];

export const TIPE_UNIT_OPTIONS = [
  { label: "Koordinator", value: "KOORDINATOR" },
  { label: "Sub Koordinator", value: "SUB_KOORDINATOR" },
];

export const ROLE_OPTIONS = [
  { label: "Superadmin", value: "SUPERADMIN" },
  { label: "Koordinator", value: "KOORDINATOR" },
  { label: "Karyawan", value: "KARYAWAN" },
  { label: "Keuangan", value: "KEUANGAN" },
];

export const STATUS_AKTIF_OPTIONS = [
  { label: "Aktif", value: "AKTIF" },
  { label: "Nonaktif", value: "NONAKTIF" },
];

export const SUMBER_DANA_OPTIONS = [
  { label: "RO", value: "RO" },
  { label: "Operasional", value: "OPERASIONAL" },
];

// ─── Status chip variant mapping ──────────────────────────────────────────────

export const status_variant = (status?: string | null): "success" | "neutral" | "danger" | "warning" | "info" => {
  const value = (status ?? "").toUpperCase();
  if (["AKTIF", "AKTIF".toString()].includes(value)) return "success";
  if (["NONAKTIF", "DIBATALKAN", "BATAL"].includes(value)) return "danger";
  if (["PENDING", "DRAFT", "MENUNGGU"].includes(value)) return "warning";
  return "neutral";
};

// ─── List helpers ─────────────────────────────────────────────────────────────

export const unwrap_list = (body: any): any[] => {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  return [];
};

export const unwrap_pagination = (body: any): { total_datas: number; total_pages: number; page: number; limit: number } => {
  const pagination = body?.pagination ?? body?.data?.pagination ?? {};
  return {
    total_datas: pagination.total_datas ?? (Array.isArray(body?.data) ? body.data.length : 0),
    total_pages: pagination.total_pages ?? 1,
    page: pagination.page ?? 1,
    limit: pagination.limit ?? 10,
  };
};
