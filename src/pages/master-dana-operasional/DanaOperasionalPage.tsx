import { useState } from "react";
import { Grid, TextField, Typography } from "@mui/material";
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

export function DanaOperasionalPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [id_unit, setIdUnit] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  const list_query = use_query({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        id_unit_koordinator: id_unit || undefined,
      } as any,
    ],
  });

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ tipe_unit: "KOORDINATOR", limit: 200 } as any],
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
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const delete_mutation = use_mutation({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerRemove",
    options: { call_back: () => list_query.call_back() },
  });

  const open_create = () => {
    setEditing(null);
    setForm({
      id_unit_koordinator: "",
      tahun_fiscal: String(current_year()),
      total_plafon: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      id_unit_koordinator: row.id_unit_koordinator ?? "",
      tahun_fiscal: String(row.tahun_fiscal ?? current_year()),
      total_plafon: row.total_plafon ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    if (editing) {
      update_mutation([editing.id, { total_plafon: Number(form.total_plafon) }]);
    } else {
      create_mutation([
        {
          id_unit_koordinator: form.id_unit_koordinator,
          tahun_fiscal: Number(form.tahun_fiscal),
          total_plafon: Number(form.total_plafon),
        },
      ]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nama_unit_koordinator",
      label: "Unit Koordinator",
      sortable: true,
      render: (_, row) => <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama_unit_koordinator ?? "-")}</Typography>,
    },
    { id: "tahun_fiscal", label: "Tahun Fiscal", align: "center", render: (_, row) => String(row.tahun_fiscal ?? "-") },
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
      title="Dana Operasional"
      headerTitle="Master Dana Operasional"
      headerDescription="Plafon dana operasional per unit koordinator dan tahun fiscal."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Dana Operasional
          </SoftButton>
        ) : undefined
      }
    >
      <div style={{ padding: "20px 24px" }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data dana operasional." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Dana Operasional"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari unit koordinator..."
            filters={[
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
            emptyStateLabel="Belum ada data dana operasional."
          />
        )}
      </div>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? "Ubah Dana Operasional" : "Tambah Dana Operasional"}
        description={editing ? "Perbarui total plafon." : "Lengkapi data dana operasional baru."}
        maxWidth={560}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect
              label="Unit Koordinator"
              value={String(form.id_unit_koordinator ?? "")}
              options={unit_options}
              onChange={(v) => set_field("id_unit_koordinator", v)}
              loading={unit_query.is_loading}
              placeholder="Pilih unit koordinator..."
              disabled={Boolean(editing)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tahun Fiscal" value={form.tahun_fiscal} onChange={(v: string) => set_field("tahun_fiscal", v)} required type="number" disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
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
        title="Hapus Dana Operasional"
        message={`Dana operasional ${confirm_target?.tahun_fiscal ?? ""} untuk "${confirm_target?.nama_unit_koordinator ?? ""}" akan dihapus.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default DanaOperasionalPage;
