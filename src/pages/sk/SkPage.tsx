import { useState } from "react";
import { Box, Checkbox, FormControlLabel, Grid, TextField, Typography } from "@mui/material";
import { AddOutlined, EditOutlined, DeleteOutlined, BlockOutlined, CheckCircleOutline } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip, ThemedDatePicker, FileUploadInput } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, format_date, format_rupiah, to_date_input, status_variant, unwrap_list, unwrap_pagination } from "../../common/hris";

function Field({ label, value, onChange, required, disabled, type }: any) {
  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      type={type}
      value={value ?? ""}
      slotProps={type === "date" ? { inputLabel: { shrink: true } } : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

const toDate = (v: string): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fromDate = (d: Date | null): string => {
  if (!d) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export function SkPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [status, setStatus] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [sk_file, set_sk_file] = useState<File | null>(null);
  const [custom_effective_date, setCustomEffectiveDate] = useState(false);
  const [confirm_target, setConfirmTarget] = useState<any>(null);
  const [toggle_target, setToggleTarget] = useState<any>(null);

  const list_query = use_query({
    api_tag: "sk",
    api_method: "skGetControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        status_aktif: status || undefined,
      } as any,
    ],
  });

  const pegawai_query = use_query({
    api_tag: "masterPegawai",
    api_method: "pegawaiGetControllerGetData",
    api_query: [{ status_aktif: "AKTIF", limit: 200 } as any],
  });

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const ro_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const dana_query = use_query({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);

  const pegawai_options = unwrap_list(pegawai_query.response).map((p: any) => ({
    value: String(p.id),
    label: `${p.nama} — ${p.nip_nik}`,
  }));

  const unit_options = unwrap_list(unit_query.response).map((u: any) => ({
    value: String(u.id),
    label: `${u.kode_unit} — ${u.nama_unit}`,
  }));

  const set_field = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const create_mutation = use_mutation({
    api_tag: "sk",
    api_method: "skPostControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "sk",
    api_method: "skPutControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const delete_mutation = use_mutation({
    api_tag: "sk",
    api_method: "skDeleteControllerRemove",
    options: { call_back: () => list_query.call_back() },
  });

  const activate_mutation = use_mutation({
    api_tag: "sk",
    api_method: "skPutControllerActivate",
    options: { call_back: () => list_query.call_back() },
  });

  const ro_options = unwrap_list(ro_query.response).map((r: any) => ({
    value: String(r.id),
    label: `${r.kode_ro} — ${r.nama_ro}`,
  }));
  const dana_options = unwrap_list(dana_query.response).map((d: any) => ({
    value: String(d.id),
    label: `${d.nama_unit_koordinator ?? d.id_unit_koordinator ?? "-"} — ${d.tahun_fiscal} (${format_rupiah(d.total_plafon)})`,
  }));

  const open_create = () => {
    setEditing(null);
    setCustomEffectiveDate(false);
    set_sk_file(null);
    setForm({
      nomor_sk: "",
      tanggal_sk: "",
      tanggal_efektif: "",
      tanggal_selesai: "",
      id_pegawai: "",
      id_unit_kerja: "",
      jabatan: "",
      gaji_bulanan: "",
      sumber_dana_default: "OPERASIONAL",
      ro_id_default: "",
      dana_operasional_id_default: "",
      is_tugas_tambahan: false,
      keterangan: "",
      file_sk: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setCustomEffectiveDate(to_date_input(row.tanggal_efektif) !== to_date_input(row.tanggal_sk));
    set_sk_file(null);
    setForm({
      nomor_sk: row.nomor_sk ?? "",
      tanggal_sk: to_date_input(row.tanggal_sk),
      tanggal_efektif: to_date_input(row.tanggal_efektif),
      tanggal_selesai: to_date_input(row.tanggal_selesai),
      id_pegawai: row.id_pegawai ?? "",
      id_unit_kerja: row.id_unit_kerja ?? "",
      jabatan: row.jabatan ?? "",
      gaji_bulanan: row.gaji_bulanan != null ? String(row.gaji_bulanan) : "",
      sumber_dana_default: row.sumber_dana_default ?? "OPERASIONAL",
      ro_id_default: row.ro_id_default ?? "",
      dana_operasional_id_default: row.dana_operasional_id_default ?? "",
      is_tugas_tambahan: false,
      keterangan: row.keterangan ?? "",
      file_sk: row.file_sk ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    const tanggal_efektif = custom_effective_date ? form.tanggal_efektif : form.tanggal_sk;
    if (!form.tanggal_sk || !tanggal_efektif) return;
    const base: any = {
      nomor_sk: form.nomor_sk,
      tanggal_sk: form.tanggal_sk,
      tanggal_efektif,
    };
    if (form.tanggal_selesai) base.tanggal_selesai = form.tanggal_selesai;
    if (form.jabatan) base.jabatan = form.jabatan;
    if (form.gaji_bulanan !== "" && form.gaji_bulanan != null) base.gaji_bulanan = Number(form.gaji_bulanan);
    if (form.sumber_dana_default) base.sumber_dana_default = form.sumber_dana_default;
    if (form.sumber_dana_default === "RO" && form.ro_id_default) base.ro_id_default = form.ro_id_default;
    if (form.sumber_dana_default === "OPERASIONAL" && form.dana_operasional_id_default) base.dana_operasional_id_default = form.dana_operasional_id_default;
    if (form.is_tugas_tambahan) base.is_tugas_tambahan = true;
    if (form.keterangan) base.keterangan = form.keterangan;
    if (sk_file) base.file = sk_file;
    else if (form.file_sk) base.file_sk = form.file_sk;
    if (editing) {
      update_mutation([editing.id, { ...base, id_unit_kerja: form.id_unit_kerja }]);
    } else {
      create_mutation([{ ...base, id_pegawai: form.id_pegawai, id_unit_kerja: form.id_unit_kerja }]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nomor_sk",
      label: "Nomor SK",
      width: 165,
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.nomor_sk ?? "-")}</Typography>,
    },
    {
      id: "nama_pegawai",
      label: "Pegawai",
      width: 210,
      sortable: true,
      render: (_, row) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.3 }}>{String(row.nama_pegawai ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.3 }}>{String(row.nip_nik ?? "-")}</Typography>
        </Box>
      ),
    },
    { id: "nama_unit_kerja", label: "Unit Kerja", width: 170, hideMobile: true, render: (_, row) => <Box sx={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.nama_unit_kerja ?? "-")}</Box> },
    { id: "jabatan", label: "Jabatan", width: 170, render: (_, row) => <Box sx={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.jabatan ?? "-")}</Box> },
    {
      id: "tanggal_efektif",
      label: "Masa Berlaku",
      width: 175,
      hideMobile: true,
      render: (_, row) => <Box sx={{ whiteSpace: "normal", wordBreak: "break-word", fontSize: "0.8rem", lineHeight: 1.4 }}>{`${format_date(row.tanggal_efektif)} s.d. ${format_date(row.tanggal_selesai)}`}</Box>,
    },
    {
      id: "status_aktif",
      label: "Status",
      width: 95,
      render: (_, row) => <StatusChip label={String(row.status_aktif ?? "-")} variant={status_variant(row.status_aktif)} size="small" />,
    },
    ...(can_edit
      ? [
          {
            id: "aksi",
            label: "Aksi",
            width: 115,
            align: "right" as const,
            render: (_: any, row: any) => (
              <ActionButtonGroup>
                <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />
                <ActionButton
                  variant={row.status_aktif === "AKTIF" ? "deactivate" : "approve"}
                  title={row.status_aktif === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
                  icon={row.status_aktif === "AKTIF" ? <BlockOutlined fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
                  onClick={() => setToggleTarget(row)}
                />
                <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => setConfirmTarget(row)} />
              </ActionButtonGroup>
            ),
          },
        ]
      : []),
  ];

  const toggle_is_deactivate = toggle_target?.status_aktif === "AKTIF";

  return (
    <DashboardLayout
      sectionTitle="Transaksi"
      title="SK"
      headerTitle="Surat Keputusan (SK)"
      headerDescription="Pengelolaan SK pegawai — penugasan, pengangkatan, dan masa berlaku."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah SK
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data SK." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar SK"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari nomor SK / nama pegawai..."
            filters={[
              {
                id: "status_aktif",
                label: "Status",
                value: status,
                options: [
                  { label: "Semua Status", value: "" },
                  { label: "Aktif", value: "AKTIF" },
                  { label: "Nonaktif", value: "NONAKTIF" },
                ],
                onChange: (v: string) => {
                  setStatus(v);
                  setPage(0);
                },
              },
            ]}
            isLoading={list_query.is_loading}
            totalRows={pagination.total_datas}
            page={page}
            rowsPerPage={rows_per_page}
            onPageChange={setPage}
            onRowsPerPageChange={(rpp) => {
              set_rows_per_page(rpp);
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            emptyStateLabel="Belum ada data SK."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah SK: ${editing.nomor_sk}` : "Tambah SK"}
        description={editing ? "Perbarui data SK." : "Lengkapi data SK baru."}
        maxWidth={680}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <Field label="Nomor SK" value={form.nomor_sk} onChange={(v: string) => set_field("nomor_sk", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Tanggal SK" value={toDate(form.tanggal_sk)} onChange={(d) => set_field("tanggal_sk", fromDate(d))} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Tanggal Selesai (opsional)" value={toDate(form.tanggal_selesai)} onChange={(d) => set_field("tanggal_selesai", fromDate(d))} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={custom_effective_date}
                  onChange={(event) => {
                    setCustomEffectiveDate(event.target.checked);
                    if (!event.target.checked) set_field("tanggal_efektif", form.tanggal_sk);
                  }}
                />
              }
              label="Berlaku mulai tanggal berbeda dari tanggal SK"
            />
            <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Tanggal berlaku SK menentukan awal penugasan, bukan awal masa kerja pegawai.</Typography>
          </Grid>
          {custom_effective_date && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <ThemedDatePicker label="Tanggal Mulai Berlaku" value={toDate(form.tanggal_efektif)} onChange={(d) => set_field("tanggal_efektif", fromDate(d))} required />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Jabatan" value={form.jabatan} onChange={(v: string) => set_field("jabatan", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Gaji Bulanan (Rp)" value={form.gaji_bulanan} onChange={(v: string) => set_field("gaji_bulanan", v)} type="number" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect
              label="Sumber Dana Default"
              value={String(form.sumber_dana_default ?? "OPERASIONAL")}
              options={[
                { value: "OPERASIONAL", label: "Operasional" },
                { value: "RO", label: "RO" },
              ]}
              onChange={(v) => set_field("sumber_dana_default", v)}
            />
          </Grid>
          {form.sumber_dana_default === "RO" ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect label="RO Default" value={String(form.ro_id_default ?? "")} options={ro_options} onChange={(v) => set_field("ro_id_default", v)} loading={ro_query.is_loading} />
            </Grid>
          ) : (
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect label="Dana Operasional Default" value={String(form.dana_operasional_id_default ?? "")} options={dana_options} onChange={(v) => set_field("dana_operasional_id_default", v)} loading={dana_query.is_loading} />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Pegawai" value={String(form.id_pegawai ?? "")} options={pegawai_options} onChange={(v) => set_field("id_pegawai", v)} loading={pegawai_query.is_loading} disabled={Boolean(editing)} required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Unit Kerja" value={String(form.id_unit_kerja ?? "")} options={unit_options} onChange={(v) => set_field("id_unit_kerja", v)} loading={unit_query.is_loading} required />
          </Grid>
          {!editing && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1.25, bgcolor: form.is_tugas_tambahan ? "#fef3c7" : "var(--muted)", border: "1px solid var(--border)" }}>
                <input type="checkbox" checked={Boolean(form.is_tugas_tambahan)} onChange={(e) => set_field("is_tugas_tambahan", e.target.checked)} style={{ width: 16, height: 16 }} />
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Tugas tambahan (rangkap, tidak menonaktifkan SK homebase aktif)</Typography>
              </Box>
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <Field label="Keterangan" value={form.keterangan} onChange={(v: string) => set_field("keterangan", v)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FileUploadInput value={sk_file} onChange={set_sk_file} existingFileUrl={form.file_sk} accept=".pdf" label="File SK (PDF)" />
          </Grid>
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggle_target)}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => {
          if (toggle_target) activate_mutation([toggle_target.id, { status: !toggle_is_deactivate }]);
        }}
        title={toggle_is_deactivate ? "Nonaktifkan SK" : "Aktifkan SK"}
        message={toggle_is_deactivate ? `SK "${toggle_target?.nomor_sk ?? ""}" akan dinonaktifkan.` : `SK "${toggle_target?.nomor_sk ?? ""}" akan diaktifkan kembali.`}
        confirmLabel={toggle_is_deactivate ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        cancelLabel="Batal"
        variant={toggle_is_deactivate ? "danger" : "warning"}
      />

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Hapus SK"
        message={`SK "${confirm_target?.nomor_sk ?? ""}" akan dihapus permanen.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default SkPage;
