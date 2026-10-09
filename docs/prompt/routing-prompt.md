Please help me fix and align the Frontend Role-Based Access Control (RBAC) across `App.tsx`, route guards, and sidebar navigation items. Currently, there are routing mismatches where users can see or access pages they shouldn't, and the 'keuangan' (Finance/Juru Bayar) role needs clean, dedicated route protections.

### 1. Update `App.tsx` Role Definitions & Route Guards

Define clear role arrays and enforce them strictly on the React Router routes:

- Define role groups:
  - `SUPERADMIN_ONLY = ["superadmin"]`
  - `SUPERADMIN_KOORDINATOR = ["superadmin", "koordinator"]`
  - `FINANCE_TEAM = ["superadmin", "keuangan"]`
  - `ALL_MANAGEMENT = ["superadmin", "koordinator", "keuangan"]`
  - `EVERYONE = ["superadmin", "koordinator", "keuangan", "karyawan"]`

- **Apply these guards to the routes:**
  - `/pengguna` (Users Page): Protect with `SUPERADMIN_ONLY`.
  - `/pegawai`, `/unit-kerja`, `/proyek`, `/ro`, `/ro/:id`: Protect with `SUPERADMIN_KOORDINATOR`.
  - `/dana-operasional`: Protect with `ALL_MANAGEMENT` (Superadmin can manage all, Koordinator and Finance can view their respective scopes).
  - `/sk`: Protect with `SUPERADMIN_KOORDINATOR`.
  - `/alokasi-gaji`, `/alokasi-gaji/rekap`: Protect with `FINANCE_TEAM` or `ALL_MANAGEMENT` depending on whether they are creating or verifying.
  - `/profil`: Protect with `EVERYONE`.

### 2. Synchronize with `sidebarItems.tsx`

Ensure that the sidebar navigation items dynamically filter out menus that the logged-in user's role does not have permission to access:

- If a user is logged in as `keuangan`, they must _only_ see financial review menus (Dashboard Keuangan, Master Dana Operasional, Alokasi Gaji / Tagihan, Rekapitulasi), and master data menus like Proyek/Unit Kerja should be completely hidden from their sidebar.
- If a user is logged in as `koordinator`, hide global superadmin menus (like User Management).

Please provide:

1. The updated `App.tsx` containing the corrected `RequireRole` guards and route configurations.
2. The corresponding update in `sidebarItems.tsx` to ensure sidebar visibility perfectly matches these route permissions.
