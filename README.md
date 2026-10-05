# React Template

Starter template React + TypeScript dengan komponen UI reusable, sistem auth berbasis signal, layout dashboard siap pakai, dan dark mode bawaan. Dirancang untuk jadi fondasi project frontend baru tanpa perlu mulai dari nol.

## Tech Stack

| Kategori | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| UI Components | Material UI (MUI) v7 |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| State Management | Signal (custom, Preact-inspired) |
| Charts | Recharts |
| Date Picker | MUI X Date Pickers + date-fns |
| Auth | JWT Decode + js-cookie |

## Fitur Bawaan

- **Auth flow** — login page dengan animated loading steps, dummy auth untuk development, guard route (protected & guest-only)
- **Dashboard layout** — sidebar collapsible, navbar, dark/light mode toggle
- **Komponen reusable** — table (client & server-side), modal, confirm dialog, searchable select, status chip, action buttons, info card, dan lainnya
- **Signal state** — reactive state management ringan tanpa Redux/Zustand
- **Theme system** — CSS variables + MUI theme, support light/dark mode
- **Path alias** — `@/*`, `@Signal/*`, `@Hooks/*`, `@Utils/*`, `@Pages/*`

## Struktur Folder

```
src/
├── assets/          # Gambar, font, file statis
├── common/          # Enum, error handler, response utils
├── components/      # Komponen UI reusable
│   ├── button/      # ActionButton, ActionMenuButton, ActionButtonGroup
│   ├── calendar/    # ShiftCell, WeekNavigation
│   ├── chip/        # StatusChip, HomebaseBadge
│   ├── loading/     # Loader, DataEmpty, ComingSoon
│   ├── modal/       # Modal, ConfirmDialog, SearchableSelect
│   └── table/       # DataTable, ServerDataTable, TableToolbar, TablePagination
├── hook/            # API hooks (use_query, use_mutation), api-generated types
├── layouts/         # DashboardLayout, Navbar, Sidebar
├── library/
│   └── @signal-private/   # Core signal, auth signal, loading/dialog/snackbar signals
├── pages/           # Halaman aplikasi (auth, dashboard, 404, dsb.)
├── routes/          # Route definitions + route guards
├── theme/           # MUI theme config + CSS variables (colors, radius, shadow)
├── types/           # Global TypeScript types
└── utils/           # Helper: date, calendar, extract-value, dsb.
```

## Cara Pakai

### 1. Install dependencies

```bash
npm install
```

### 2. Jalankan dev server

```bash
npm run dev
```

### 3. Build production

```bash
npm run build
```

### 4. Preview build

```bash
npm run preview
```

## Mulai Project Baru dari Template Ini

### Ganti nama & konfigurasi

1. Update `"name"` di `package.json`
2. Ganti judul di `index.html`
3. Sesuaikan warna primary di `src/theme/colors/index.css` (default: `#f28541`)

### Tambah halaman baru

Buat file di `src/pages/nama-module/NamaPage.tsx`, lalu daftarkan di `src/routes/index.tsx`:

```tsx
const NamaPage = lazy(() => import("../pages/nama-module/NamaPage"));

// di dalam <Routes>:
<Route path="/nama-module" element={<NamaPage />} />
```

### Tambah menu sidebar

Edit `src/layouts/components/sidebarItems.tsx`, tambahkan item ke array yang sesuai:

```tsx
{ title: "Nama Menu", icon: <SomeIcon fontSize="small" />, path: "/nama-module" },
```

### Hubungkan ke API nyata

1. Ganti dummy auth di `LoginPage` dengan call API yang sesungguhnya via `onSubmit` prop
2. Hapus / ganti `set_mock_auth` dengan `set_login_response` dari `auth-init-signal`
3. Generate ulang tipe API dengan:

```bash
npm run codeGen
```

## Path Alias

| Alias | Resolves ke |
|---|---|
| `@/*` | `src/*` |
| `@Signal/*` | `src/library/@signal-private/*` |
| `@Hooks/*` | `src/hook/*` |
| `@Utils/*` | `src/common/*` |
| `@Pages/*` | `src/pages/*` |

## Auth System

Auth state dikelola oleh `auth_signal` di `src/library/@signal-private/use-signal/auth-init-signal.ts`.

```ts
import { auth_signal, is_authenticated, set_mock_auth, clear_auth } from "@Signal/use-signal/auth-init-signal";

// Cek status login
is_authenticated(); // boolean

// Login dummy (untuk development/template)
set_mock_auth("Nama User", "Admin");

// Logout
clear_auth();
```

## Komponen Utama

### ServerDataTable

Tabel dengan search, multi-filter, dan server-side pagination:

```tsx
<ServerDataTable
  columns={columns}
  data={data}
  searchValue={search}
  onSearchChange={setSearch}
  filters={[{ id: "status", label: "Status", value: filter, options: opts, onChange: setFilter }]}
  totalRows={total}
  page={page}
  rowsPerPage={10}
  onPageChange={setPage}
  onRowsPerPageChange={setRowsPerPage}
/>
```

### Modal

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Judul Modal"
  sections={[{ title: "Section", content: <div>...</div> }]}
  actions={[
    { label: "Batal", onClick: () => setOpen(false), variant: "ghost" },
    { label: "Simpan", onClick: handleSave, variant: "primary" },
  ]}
/>
```

### ConfirmDialog

```tsx
<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="Hapus Data"
  message="Yakin ingin menghapus data ini?"
  variant="danger"
/>
```

## Linting

```bash
npm run lint
```
# fe-template
# pm-frontend
# pm-frontend
# hris-lemigas-fe
