import { useState } from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { AddOutlined, EditOutlined, DeleteOutlined, BlockOutlined, CheckCircleOutline } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, format_date, to_date_input, status_variant, unwrap_list, unwrap_pagination } from "../../common/hris";

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

export function SkPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [status, setStatus] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
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

  const open_create = () => {
    setEditing(null);
    setForm({
      nomor_sk: "",
      tanggal_sk: "",
      tanggal_efektif: "",
      tanggal_selesai: "",
      id_pegawai: "",
      id_unit_kerja: "",
      jabatan: "",
      file_sk: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      nomor_sk: row.nomor_sk ?? "",
      tanggal_sk: to_date_input(row.tanggal_sk),
      tanggal_efektif: to_date_input(row.tanggal_efektif),
      tanggal_selesai: to_date_input(row.tanggal_selesai),
      id_pegawai: row.id_pegawai ?? "",
      id_unit_kerja: row.id_unit_kerja ?? "",
      jabatan: row.jabatan ?? "",
      file_sk: row.file_sk ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    if (editing) {
      update_mutation([
        editing.id,
        {
          nomor_sk: form.nomor_sk,
          tanggal_sk: form.tanggal_sk,
          tanggal_efektif: form.tanggal_efektif,
          tanggal_selesai: form.tanggal_selesai || undefined,
          id_unit_kerja: form.id_unit_kerja,
          jabatan: form.jabatan || undefined,
          file_sk: form.file_sk || undefined,
        },
      ]);
    } else {
      create_mutation([
        {
          nomor_sk: form.nomor_sk,
          tanggal_sk: form.tanggal_sk,
          tanggal_efektif: form.tanggal_efektif,
          tanggal_selesai: form.tanggal_selesai || undefined,
          id_pegawai: form.id_pegawai,
          id_unit_kerja: form.id_unit_kerja,
          jabatan: form.jabatan || undefined,
          file_sk: form.file_sk || undefined,
        },
      ]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nomor_sk",
      label: "Nomor SK",
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nomor_sk ?? "-")}</Typography>,
    },
    {
      id: "nama_pegawai",
      label: "Pegawai",
      sortable: true,
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama_pegawai ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{String(row.nip_nik ?? "-")}</Typography>
        </Box>
      ),
    },
    { id: "nama_unit_kerja", label: "Unit Kerja", hideMobile: true, render: (_, row) => String(row.nama_unit_kerja ?? "-") },
    { id: "jabatan", label: "Jabatan", render: (_, row) => String(row.jabatan ?? "-") },
    {
      id: "tanggal_efektif",
      label: "Masa Berlaku",
      hideMobile: true,
      render: (_, row) => `${format_date(row.tanggal_efektif)} s.d. ${format_date(row.tanggal_selesai)}`,
    },
    {
      id: "status_aktif",
      label: "Status",
      render: (_, row) => <StatusChip label={String(row.status_aktif ?? "-")} variant={status_variant(row.status_aktif)} size="small" />,
    },
    ...(can_edit
      ? [
          {
            id: "aksi",
            label: "Aksi",
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
            <Field label="Tanggal SK" value={form.tanggal_sk} onChange={(v: string) => set_field("tanggal_sk", v)} required type="date" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tanggal Efektif" value={form.tanggal_efektif} onChange={(v: string) => set_field("tanggal_efektif", v)} required type="date" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tanggal Selesai" value={form.tanggal_selesai} onChange={(v: string) => set_field("tanggal_selesai", v)} type="date" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Jabatan" value={form.jabatan} onChange={(v: string) => set_field("jabatan", v)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect
              label="Pegawai"
              value={String(form.id_pegawai ?? "")}
              options={pegawai_options}
              onChange={(v) => set_field("id_pegawai", v)}
              loading={pegawai_query.is_loading}
              placeholder="Pilih pegawai..."
              disabled={Boolean(editing)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Unit Kerja" value={String(form.id_unit_kerja ?? "")} options={unit_options} onChange={(v) => set_field("id_unit_kerja", v)} loading={unit_query.is_loading} placeholder="Pilih unit kerja..." required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="File SK (nama/tautan file)" value={form.file_sk} onChange={(v: string) => set_field("file_sk", v)} />
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
