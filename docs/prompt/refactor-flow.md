Please help me execute the Frontend (React) implementation for the newly refactored BLU Financial Workflow. The NestJS backend has already been updated to handle dynamic margin configuration, automatic fund distribution upon project creation, and exact ledger tracking (linking `DanaTransaksi` back to `proyek_id`).

We need to reflect these architectural changes in the UI by implementing "Top-Down" and "Bottom-Up" tracking, and cleaning up the Dana Operasional pages. Please execute the following 4 sections:

### 1. Update Master Proyek UI (Trigger & Top-Down Tracking)

- **Create Project Form:** Update the modal/form in `ProyekPage.tsx` to include three new required numeric fields: `Nilai Kontrak` (nilai_kontrak), `Total Direct Cost` (total_direct_cost), and `Total Margin` (total_margin).
- **Detail Proyek View:** Create a new detail page or expand the existing row view for Projects. Add a "Distribusi Margin" section/tab.
  - This section should fetch and display how this project's `total_margin` was distributed (fetching the `DanaTransaksi` records where `proyek_id` matches this project).
  - Show a list or cards indicating: "Injected to [Kategori Kamar/Unit Name]: Rp X" so the Super Admin can track exactly where the margin went.

### 2. Create Dynamic Configuration UI (`PengaturanMarginPage.tsx`)

- Create a new page dedicated to managing the dynamic margin buckets, accessible only by `SUPERADMIN` (add it to routing and `sidebarItems.tsx` under the System/Master Data menu).
- Fetch and display the list from the `PengaturanMargin` backend endpoint.
- Display a table or grid of cards showing the 5 default buckets (e.g., P1 PNS & Non PNS, P2 KP3).
- For each bucket, show its `persentase` and provide a `SearchableSelect` dropdown of `UnitKerja` (filtered by KOORDINATOR) to dynamically assign who holds this wallet. Include a "Simpan" button to update the configuration.

### 3. Refactor Dana Operasional Main Page (Level 1)

- **Remove Manual Creation:** Completely REMOVE or hide the "Tambah Dana Operasional" button and modal from `DanaOperasionalPage.tsx`. Users must no longer be able to manually create wallets or input manual plafons.
- **Top Summary Cards:** Add 5 summary cards at the top of the page representing the 5 margin buckets (P1, P2, Ops Kantor, Ops KP3, MULOS/SPI). Each card should display the aggregated `Total Plafon` (Incoming), `Terpakai` (Outgoing/Kredit), and `Sisa Saldo` for that bucket in the selected Fiscal Year.
- **Data Table:** Ensure the table strictly lists the wallets owned by the logged-in user (or all if Super Admin), filtered by `Tahun Fiscal`.

### 4. Refactor Dana Operasional Detail / Ledger (Level 2 - Bottom-Up Tracking)

- Update the Ledger/Mutasi table inside the Dana Operasional Detail view.
- **Add Tracking Column:** Add a new column named "Referensi Proyek" (or Asal Proyek).
- **Populate Tracking Data:** When rendering the ledger rows (from `DanaTransaksi`), if the row is a DEBIT (margin injection) and contains a `proyek_id`, display the Project's Code/Name in this column. If it's a KREDIT (salary payment), display a dash ("-").
- Ensure the table columns read clearly: `No`, `Tanggal`, `Uraian Transaksi`, `Referensi Proyek`, `Debit (Masuk)`, `Kredit (Keluar)`, and `Saldo Berjalan`.

Please provide the updated React code for:

1. The updated `ProyekPage.tsx` form.
2. The new `PengaturanMarginPage.tsx`.
3. The refactored `DanaOperasionalPage.tsx` (Level 1 & Level 2 Ledger view).
