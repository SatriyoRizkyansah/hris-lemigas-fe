// ─── Auth Role Enum ───────────────────────────────────────────────────────────
// Sesuaikan nilai-nilai ini dengan role yang ada di sistem auth aplikasi kamu.
// EJenisActor digunakan oleh auth-init-signal.ts dan sidebar navigation.
export enum EJenisActor {
  SUPERADMIN = "Superadmin",
  KOORDINATOR = "Koordinator",
  KARYAWAN = "Karyawan",
  PEGAWAI = "Pegawai",
  ADMIN = "Admin",
}

// ─── Tambahkan enum lainnya di bawah ini ─────────────────────────────────────
// Contoh:
// export enum EStatus {
//   AKTIF = "AKTIF",
//   NONAKTIF = "NONAKTIF",
// }
