import { useState } from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { AddOutlined, EditOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, format_rupiah, to_date_input, status_variant, unwrap_list, unwrap_pagination, TIPE_PEGAWAI_OPTIONS, STATUS_AKTIF_OPTIONS } from "../../common/hris";

function Field({ label, value, onChange, required, disabled, type, multiline }: any) {
  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      type={type}
      multiline={multiline}
      rows={multiline ? 3 : undefined}
      value={value ?? ""}
      slotProps={type === "date" ? { inputLabel: { shrink: true } } : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function PegawaiPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [tipe, setTipe] = useState("");
  const [status, setStatus] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  const list_query = use_query({
    api_tag: "masterPegawai",
    api_method: "pegawaiGetControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        tipe_pegawai: tipe || undefined,
        status_aktif: status || undefined,
      } as any,
    ],
  });

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);

  const unit_options = unwrap_list(unit_query.response).map((u: any) => ({
    value: String(u.id),
    label: `${u.kode_unit} — ${u.nama_unit}`,
  }));

  const set_field = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const create_mutation = use_mutation({
    api_tag: "masterPegawai",
    api_method: "pegawaiPostControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "masterPegawai",
    api_method: "pegawaiPutControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const delete_mutation = use_mutation({
    api_tag: "masterPegawai",
    api_method: "pegawaiDeleteControllerRemove",
    options: { call_back: () => list_query.call_back() },
  });

  const open_create = () => {
    setEditing(null);
    setForm({
      nip_nik: "",
      nama: "",
      tipe_pegawai: "TA",
      jabatan: "",
      email: "",
      telepon: "",
      tanggal_mulai: "",
      status_aktif: "AKTIF",
      bidang_keahlian: "",
      kontrak_mulai: "",
      kontrak_selesai: "",
      gaji_bulanan: "",
      id_unit_kerja: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      nip_nik: row.nip_nik ?? "",
      nama: row.nama ?? "",
      tipe_pegawai: row.tipe_pegawai ?? "TA",
      jabatan: row.jabatan ?? "",
      email: row.email ?? "",
      telepon: row.telepon ?? "",
      tanggal_mulai: to_date_input(row.tanggal_mulai),
      status_aktif: row.status_aktif ?? "AKTIF",
      bidang_keahlian: row.bidang_keahlian ?? "",
      kontrak_mulai: to_date_input(row.kontrak_mulai),
      kontrak_selesai: to_date_input(row.kontrak_selesai),
      gaji_bulanan: row.gaji_bulanan ?? "",
      id_unit_kerja: row.id_unit_kerja ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    const payload: any = {
      nama: form.nama,
      tipe_pegawai: form.tipe_pegawai,
      jabatan: form.jabatan || undefined,
      email: form.email || undefined,
      telepon: form.telepon || undefined,
      status_aktif: form.status_aktif || undefined,
      bidang_keahlian: form.bidang_keahlian || undefined,
      kontrak_mulai: form.kontrak_mulai || undefined,
      kontrak_selesai: form.kontrak_selesai || undefined,
      gaji_bulanan: form.gaji_bulanan !== "" && form.gaji_bulanan != null ? Number(form.gaji_bulanan) : undefined,
      id_unit_kerja: form.id_unit_kerja || undefined,
    };
    if (editing) {
      update_mutation([editing.id, payload]);
    } else {
      payload.nip_nik = form.nip_nik;
      payload.tanggal_mulai = form.tanggal_mulai;
      create_mutation([payload]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nip_nik",
      label: "NIP/NIK",
      width: 145,
      sortable: true,
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.nip_nik ?? "-")}</Typography>,
    },
    {
      id: "nama",
      label: "Nama",
      width: 210,
      sortable: true,
      render: (_, row) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.3 }}>{String(row.nama ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.3 }}>{String(row.email ?? "-")}</Typography>
        </Box>
      ),
    },
    {
      id: "tipe_pegawai",
      label: "Tipe",
      width: 85,
      render: (_, row) => <StatusChip label={String(row.tipe_pegawai ?? "-")} variant={row.tipe_pegawai === "TA" ? "info" : "neutral"} size="small" />,
    },
    { id: "jabatan", label: "Jabatan", width: 170, render: (_, row) => <Box sx={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.jabatan ?? "-")}</Box> },
    { id: "nama_unit_kerja", label: "Unit Kerja", width: 170, hideMobile: true, render: (_, row) => <Box sx={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.nama_unit_kerja ?? "-")}</Box> },
    {
      id: "gaji_bulanan",
      label: "Gaji/Bulan",
      width: 135,
      align: "right",
      hideMobile: true,
      render: (_, row) => <Box sx={{ whiteSpace: "nowrap" }}>{format_rupiah(row.gaji_bulanan)}</Box>,
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
            width: 75,
            align: "right" as const,
            render: (_: any, row: any) => (
              <ActionButtonGroup>
                <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />
              </ActionButtonGroup>
            ),
          },
        ]
      : []),
  ];

  const filters = [
    {
      id: "tipe_pegawai",
      label: "Tipe Pegawai",
      value: tipe,
      options: [{ label: "Semua Tipe", value: "" }, ...TIPE_PEGAWAI_OPTIONS],
      onChange: (v: string) => {
        setTipe(v);
        setPage(0);
      },
    },
    {
      id: "status_aktif",
      label: "Status",
      value: status,
      options: [{ label: "Semua Status", value: "" }, ...STATUS_AKTIF_OPTIONS],
      onChange: (v: string) => {
        setStatus(v);
        setPage(0);
      },
    },
  ];

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="Pegawai"
      headerTitle="Master Pegawai"
      headerDescription="Data pegawai LEMIGAS — PNS, ASN, Outsourcing, dan Tenaga Ahli (TA)."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Pegawai
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data pegawai. Coba lagi." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Pegawai"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari nama, NIP/NIK, email..."
            filters={filters}
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
            emptyStateLabel="Belum ada data pegawai."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah Pegawai: ${editing.nama}` : "Tambah Pegawai"}
        description={editing ? "Perbarui data pegawai." : "Lengkapi data pegawai baru."}
        maxWidth={680}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="NIP/NIK" value={form.nip_nik} onChange={(v: string) => set_field("nip_nik", v)} required disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Nama Lengkap" value={form.nama} onChange={(v: string) => set_field("nama", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Tipe Pegawai" value={String(form.tipe_pegawai ?? "")} options={TIPE_PEGAWAI_OPTIONS} onChange={(v) => set_field("tipe_pegawai", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Status" value={String(form.status_aktif ?? "")} options={STATUS_AKTIF_OPTIONS} onChange={(v) => set_field("status_aktif", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Jabatan" value={form.jabatan} onChange={(v: string) => set_field("jabatan", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Email" value={form.email} onChange={(v: string) => set_field("email", v)} type="email" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Telepon" value={form.telepon} onChange={(v: string) => set_field("telepon", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tanggal Mulai" value={form.tanggal_mulai} onChange={(v: string) => set_field("tanggal_mulai", v)} required type="date" disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Bidang Keahlian (TA)" value={form.bidang_keahlian} onChange={(v: string) => set_field("bidang_keahlian", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kontrak Mulai" value={form.kontrak_mulai} onChange={(v: string) => set_field("kontrak_mulai", v)} type="date" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kontrak Selesai" value={form.kontrak_selesai} onChange={(v: string) => set_field("kontrak_selesai", v)} type="date" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Gaji/Honorarium Bulanan (Rp)" value={form.gaji_bulanan} onChange={(v: string) => set_field("gaji_bulanan", v)} type="number" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Unit Kerja" value={String(form.id_unit_kerja ?? "")} options={unit_options} onChange={(v) => set_field("id_unit_kerja", v)} loading={unit_query.is_loading} placeholder="Pilih unit kerja..." />
          </Grid>
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Nonaktifkan Pegawai"
        message={`Pegawai "${confirm_target?.nama ?? ""}" akan dinonaktifkan. Data tetap tersimpan namun tidak lagi dihitung sebagai pegawai aktif.`}
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default PegawaiPage;
