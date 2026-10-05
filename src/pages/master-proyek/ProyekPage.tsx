import { useState } from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { AddOutlined, EditOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, ServerDataTable, SoftButton } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, current_year, format_rupiah, unwrap_list, unwrap_pagination } from "../../common/hris";

function Field({ label, value, onChange, required, disabled, type }: any) {
  return <TextField label={label} size="small" fullWidth required={required} disabled={disabled} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

const TAHUN_OPTIONS = [0, 1, 2, 3].map((i) => {
  const y = current_year() - i;
  return { label: String(y), value: String(y) };
});

export function ProyekPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [tahun, setTahun] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  const list_query = use_query({
    api_tag: "masterProyek",
    api_method: "proyekControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        tahun_fiscal: tahun ? Number(tahun) : undefined,
      } as any,
    ],
  });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);

  const set_field = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const create_mutation = use_mutation({
    api_tag: "masterProyek",
    api_method: "proyekControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "masterProyek",
    api_method: "proyekControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const delete_mutation = use_mutation({
    api_tag: "masterProyek",
    api_method: "proyekControllerRemove",
    options: { call_back: () => list_query.call_back() },
  });

  const open_create = () => {
    setEditing(null);
    setForm({
      kode_proyek: "",
      nama_proyek: "",
      tahun_fiscal: String(current_year()),
      sumber_pendanaan: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      kode_proyek: row.kode_proyek ?? "",
      nama_proyek: row.nama_proyek ?? "",
      tahun_fiscal: String(row.tahun_fiscal ?? current_year()),
      sumber_pendanaan: row.sumber_pendanaan ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    const payload: any = {
      nama_proyek: form.nama_proyek,
      tahun_fiscal: Number(form.tahun_fiscal),
      sumber_pendanaan: form.sumber_pendanaan || undefined,
    };
    if (editing) {
      update_mutation([editing.id, payload]);
    } else {
      payload.kode_proyek = form.kode_proyek;
      create_mutation([payload]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "kode_proyek",
      label: "Kode Proyek",
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.kode_proyek ?? "-")}</Typography>,
    },
    {
      id: "nama_proyek",
      label: "Nama Proyek",
      sortable: true,
      render: (_, row) => <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama_proyek ?? "-")}</Typography>,
    },
    { id: "tahun_fiscal", label: "Tahun Fiscal", align: "center", render: (_, row) => String(row.tahun_fiscal ?? "-") },
    { id: "sumber_pendanaan", label: "Sumber Pendanaan", hideMobile: true, render: (_, row) => String(row.sumber_pendanaan ?? "-") },
    { id: "jumlah_ro", label: "Jumlah RO", align: "right", render: (_, row) => String(row.jumlah_ro ?? 0) },
    {
      id: "total_plafon_ro",
      label: "Total Plafon RO",
      align: "right",
      hideMobile: true,
      render: (_, row) => format_rupiah(row.total_plafon_ro),
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
              </ActionButtonGroup>
            ),
          },
        ]
      : []),
  ];

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="Proyek"
      headerTitle="Master Proyek"
      headerDescription="Daftar proyek beserta tahun fiscal dan sumber pendanaan."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Proyek
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data proyek." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Proyek"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari kode / nama proyek..."
            filters={[
              {
                id: "tahun_fiscal",
                label: "Tahun Fiscal",
                value: tahun,
                options: [{ label: "Semua Tahun", value: "" }, ...TAHUN_OPTIONS],
                onChange: (v: string) => {
                  setTahun(v);
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
            emptyStateLabel="Belum ada data proyek."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah Proyek: ${editing.nama_proyek}` : "Tambah Proyek"}
        description={editing ? "Perbarui data proyek." : "Lengkapi data proyek baru."}
        maxWidth={560}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kode Proyek" value={form.kode_proyek} onChange={(v: string) => set_field("kode_proyek", v)} required disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tahun Fiscal" value={form.tahun_fiscal} onChange={(v: string) => set_field("tahun_fiscal", v)} required type="number" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama Proyek" value={form.nama_proyek} onChange={(v: string) => set_field("nama_proyek", v)} required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Sumber Pendanaan" value={form.sumber_pendanaan} onChange={(v: string) => set_field("sumber_pendanaan", v)} />
          </Grid>
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Hapus Proyek"
        message={`Proyek "${confirm_target?.nama_proyek ?? ""}" akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default ProyekPage;
