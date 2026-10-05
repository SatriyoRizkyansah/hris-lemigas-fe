import { useState } from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { AddOutlined, EditOutlined, DeleteOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, current_year, format_rupiah, unwrap_list, unwrap_pagination } from "../../common/hris";

function Field({ label, value, onChange, required, disabled, type }: any) {
  return <TextField label={label} size="small" fullWidth required={required} disabled={disabled} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

export function RoPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [id_proyek, setIdProyek] = useState("");
  const [id_unit, setIdUnit] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  const list_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        id_proyek: id_proyek || undefined,
        id_unit_koordinator: id_unit || undefined,
      } as any,
    ],
  });

  const proyek_query = use_query({
    api_tag: "masterProyek",
    api_method: "proyekControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ tipe_unit: "KOORDINATOR", limit: 200 } as any],
  });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);

  const proyek_options = unwrap_list(proyek_query.response).map((p: any) => ({
    value: String(p.id),
    label: `${p.kode_proyek} — ${p.nama_proyek}`,
  }));

  const unit_options = unwrap_list(unit_query.response).map((u: any) => ({
    value: String(u.id),
    label: `${u.kode_unit} — ${u.nama_unit}`,
  }));

  const set_field = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const create_mutation = use_mutation({
    api_tag: "masterRo",
    api_method: "roControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "masterRo",
    api_method: "roControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const delete_mutation = use_mutation({
    api_tag: "masterRo",
    api_method: "roControllerRemove",
    options: { call_back: () => list_query.call_back() },
  });

  const open_create = () => {
    setEditing(null);
    setForm({
      kode_ro: "",
      nama_ro: "",
      id_proyek: "",
      id_unit_koordinator: "",
      tahun_fiscal: String(current_year()),
      total_plafon: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      kode_ro: row.kode_ro ?? "",
      nama_ro: row.nama_ro ?? "",
      id_proyek: row.id_proyek ?? "",
      id_unit_koordinator: row.id_unit_koordinator ?? "",
      tahun_fiscal: String(row.tahun_fiscal ?? current_year()),
      total_plafon: row.total_plafon ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    if (editing) {
      update_mutation([editing.id, { nama_ro: form.nama_ro, total_plafon: Number(form.total_plafon) }]);
    } else {
      create_mutation([
        {
          kode_ro: form.kode_ro,
          nama_ro: form.nama_ro,
          id_proyek: form.id_proyek,
          id_unit_koordinator: form.id_unit_koordinator,
          tahun_fiscal: Number(form.tahun_fiscal),
          total_plafon: Number(form.total_plafon),
        },
      ]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "kode_ro",
      label: "Kode RO",
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.kode_ro ?? "-")}</Typography>,
    },
    {
      id: "nama_ro",
      label: "Nama RO",
      sortable: true,
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama_ro ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{String(row.nama_proyek ?? "-")}</Typography>
        </Box>
      ),
    },
    {
      id: "nama_unit_koordinator",
      label: "Unit Koordinator",
      hideMobile: true,
      render: (_, row) => String(row.nama_unit_koordinator ?? "-"),
    },
    { id: "tahun_fiscal", label: "Tahun", align: "center", render: (_, row) => String(row.tahun_fiscal ?? "-") },
    { id: "total_plafon", label: "Plafon", align: "right", render: (_, row) => format_rupiah(row.total_plafon) },
    { id: "total_terpakai", label: "Terpakai", align: "right", hideMobile: true, render: (_, row) => format_rupiah(row.total_terpakai) },
    {
      id: "sisa_saldo",
      label: "Sisa Saldo",
      align: "right",
      render: (_, row) => (
        <Typography
          sx={{
            fontSize: "0.825rem",
            fontWeight: 600,
            color: (row.sisa_saldo ?? 0) >= 0 ? "var(--foreground)" : "#ef4444",
          }}
        >
          {format_rupiah(row.sisa_saldo)}
        </Typography>
      ),
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
                <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => setConfirmTarget(row)} />
              </ActionButtonGroup>
            ),
          },
        ]
      : []),
  ];

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="RO"
      headerTitle="Master Rencana Operasi (RO)"
      headerDescription="Plafon RO per proyek dan unit koordinator beserta pemakaian anggaran."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah RO
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data RO." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar RO"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari kode / nama RO..."
            filters={[
              {
                id: "id_proyek",
                label: "Proyek",
                value: id_proyek,
                options: [{ label: "Semua Proyek", value: "" }, ...proyek_options],
                onChange: (v: string) => {
                  setIdProyek(v);
                  setPage(0);
                },
              },
              {
                id: "id_unit_koordinator",
                label: "Unit Koordinator",
                value: id_unit,
                options: [{ label: "Semua Unit", value: "" }, ...unit_options],
                onChange: (v: string) => {
                  setIdUnit(v);
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
            emptyStateLabel="Belum ada data RO."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah RO: ${editing.nama_ro}` : "Tambah RO"}
        description={editing ? "Nama RO dan total plafon dapat diperbarui." : "Lengkapi data RO baru."}
        maxWidth={600}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kode RO" value={form.kode_ro} onChange={(v: string) => set_field("kode_ro", v)} required disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tahun Fiscal" value={form.tahun_fiscal} onChange={(v: string) => set_field("tahun_fiscal", v)} required type="number" disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama RO" value={form.nama_ro} onChange={(v: string) => set_field("nama_ro", v)} required />
          </Grid>
          {!editing && (
            <>
              <Grid size={{ xs: 12 }}>
                <SearchableSelect label="Proyek" value={String(form.id_proyek ?? "")} options={proyek_options} onChange={(v) => set_field("id_proyek", v)} loading={proyek_query.is_loading} placeholder="Pilih proyek..." required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <SearchableSelect
                  label="Unit Koordinator"
                  value={String(form.id_unit_koordinator ?? "")}
                  options={unit_options}
                  onChange={(v) => set_field("id_unit_koordinator", v)}
                  loading={unit_query.is_loading}
                  placeholder="Pilih unit koordinator..."
                  required
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12 }}>
            <Field label="Total Plafon (Rp)" value={form.total_plafon} onChange={(v: string) => set_field("total_plafon", v)} required type="number" />
          </Grid>
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Hapus RO"
        message={`RO "${confirm_target?.nama_ro ?? ""}" akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default RoPage;
