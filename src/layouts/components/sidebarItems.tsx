import React from "react";
import {
  DashboardOutlined as DashboardIcon,
  PeopleOutlined as PeopleIcon,
  AccountTreeOutlined as UnitIcon,
  WorkOutline as ProyekIcon,
  AccountBalanceWalletOutlined as RoIcon,
  PaymentsOutlined as DanaIcon,
  DescriptionOutlined as SkIcon,
  AccountBalanceOutlined as AlokasiIcon,
  SummarizeOutlined as RekapIcon,
  AdminPanelSettingsOutlined as UsersIcon,
  AccountBoxOutlined as AccountBoxIcon,
  ReceiptLongOutlined as TagihanIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";

export interface NavItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  badge?: number | string;
  href?: () => string | Promise<string>;
}

export type MenuRole = "admin" | "user" | "default" | string;

export interface SidebarSection {
  key: string;
  title: string;
  abbreviation: string;
  items: NavItem[];
}

// ─── Resolve role dari akses JWT ──────────────────────────────────────────────
export const resolve_menu_role_from_akses = (aksesLabel?: string): MenuRole => {
  const label = (aksesLabel ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (label.includes("superadmin") || label.includes("admin")) return "superadmin";
  if (label.includes("koordinator")) return "koordinator";
  if (label.includes("keuangan")) return "keuangan";
  return "karyawan";
};

// ─── Home path per role ───────────────────────────────────────────────────────
export const get_role_home_path = (role: MenuRole): string => {
  if (role === "karyawan") return "/profil";
  if (role === "keuangan") return "/alokasi-gaji/rekap";
  return "/";
};

// ─── Nav Items ────────────────────────────────────────────────────────────────

const overviewItems: NavItem[] = [{ title: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/" }];

const masterItems: NavItem[] = [
  { title: "Pegawai", icon: <PeopleIcon fontSize="small" />, path: "/pegawai" },
  { title: "Unit Kerja", icon: <UnitIcon fontSize="small" />, path: "/unit-kerja" },
  { title: "Proyek", icon: <ProyekIcon fontSize="small" />, path: "/proyek" },
  { title: "RO", icon: <RoIcon fontSize="small" />, path: "/ro" },
  { title: "Dana Operasional", icon: <DanaIcon fontSize="small" />, path: "/dana-operasional" },
];

const transaksiItems: NavItem[] = [
  { title: "SK", icon: <SkIcon fontSize="small" />, path: "/sk" },
  { title: "Alokasi Gaji", icon: <AlokasiIcon fontSize="small" />, path: "/alokasi-gaji" },
  { title: "Rekap Alokasi", icon: <RekapIcon fontSize="small" />, path: "/alokasi-gaji/rekap" },
];

// Menu khusus Keuangan (Juru Bayar)
const keuanganTransaksiItems: NavItem[] = [
  { title: "Tagihan Alokasi", icon: <TagihanIcon fontSize="small" />, path: "/alokasi-gaji" },
  { title: "Rekap BLU", icon: <RekapIcon fontSize="small" />, path: "/alokasi-gaji/rekap" },
];

const keuanganMasterItems: NavItem[] = [
  { title: "Proyek", icon: <ProyekIcon fontSize="small" />, path: "/proyek" },
  { title: "RO", icon: <RoIcon fontSize="small" />, path: "/ro" },
  { title: "Dana Operasional", icon: <DanaIcon fontSize="small" />, path: "/dana-operasional" },
];

const sistemItems: NavItem[] = [
  { title: "Pengguna", icon: <UsersIcon fontSize="small" />, path: "/pengguna" },
  { title: "Pengaturan Margin", icon: <SettingsIcon fontSize="small" />, path: "/pengaturan-margin" },
  { title: "Profil Saya", icon: <AccountBoxIcon fontSize="small" />, path: "/profil" },
];

// ─── Section konfigurasi per role ─────────────────────────────────────────────

const superadminSections: SidebarSection[] = [
  { key: "overview", title: "Overview", abbreviation: "OV", items: overviewItems },
  { key: "master", title: "Master Data", abbreviation: "MD", items: masterItems },
  { key: "transaksi", title: "Transaksi", abbreviation: "TR", items: transaksiItems },
  { key: "sistem", title: "Sistem", abbreviation: "SY", items: sistemItems },
];

const koordinatorSections: SidebarSection[] = [
  { key: "overview", title: "Overview", abbreviation: "OV", items: overviewItems },
  { key: "master", title: "Master Data", abbreviation: "MD", items: masterItems },
  { key: "transaksi", title: "Transaksi", abbreviation: "TR", items: transaksiItems },
  { key: "sistem", title: "Akun", abbreviation: "AK", items: [sistemItems[1]] },
];

const keuanganSections: SidebarSection[] = [
  { key: "overview", title: "Overview", abbreviation: "OV", items: overviewItems },
  { key: "master", title: "Master Data", abbreviation: "MD", items: keuanganMasterItems },
  { key: "transaksi", title: "Keuangan", abbreviation: "KU", items: keuanganTransaksiItems },
  { key: "sistem", title: "Akun", abbreviation: "AK", items: [sistemItems[1]] },
];

const karyawanSections: SidebarSection[] = [{ key: "sistem", title: "Akun", abbreviation: "AK", items: [sistemItems[1]] }];

// ─── Exported helpers ─────────────────────────────────────────────────────────

export const get_sidebar_sections = (role: MenuRole): SidebarSection[] => {
  if (role === "superadmin") return superadminSections;
  if (role === "koordinator") return koordinatorSections;
  if (role === "keuangan") return keuanganSections;
  return karyawanSections;
};

export const get_available_paths_for_role = (role: MenuRole): string[] => {
  const paths: string[] = [];
  get_sidebar_sections(role).forEach((s) => s.items.forEach((i) => paths.push(i.path)));
  return paths;
};

export const is_path_available_for_role = (path: string, role: MenuRole): boolean => {
  return get_available_paths_for_role(role).includes(path);
};
