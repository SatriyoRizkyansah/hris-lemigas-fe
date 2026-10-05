import { useState } from "react";
import { Box, Card, Divider, Grid, TextField, Typography } from "@mui/material";
import { AccountTreeOutlined, AddOutlined, EditOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, status_variant, unwrap_list, unwrap_pagination, TIPE_UNIT_OPTIONS } from "../../common/hris";

function Field({ label, value, onChange, required, disabled, multiline }: any) {
  return <TextField label={label} size="small" fullWidth required={required} disabled={disabled} multiline={multiline} rows={multiline ? 3 : undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

function TreeNode({ node, depth }: { node: any; depth: number }) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 0.9,
          pl: depth * 3,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <AccountTreeOutlined sx={{ fontSize: 16, color: "var(--muted-foreground)", flexShrink: 0 }} />
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(node.nama_unit ?? "-")}</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>({String(node.kode_unit ?? "-")})</Typography>
        <StatusChip label={node.tipe_unit === "KOORDINATOR" ? "Koordinator" : "Sub Koordinator"} variant={node.tipe_unit === "KOORDINATOR" ? "info" : "neutral"} size="small" />
        <StatusChip label={String(node.status_aktif ?? "-")} variant={status_variant(node.status_aktif)} size="small" />
        {node.kepala_unit_nama ? <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>Kepala: {String(node.kepala_unit_nama)}</Typography> : null}
      </Box>
      {(node.children ?? []).map((child: any) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </Box>
  );
}

export function UnitKerjaPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [tipe, setTipe] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  const list_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        tipe_unit: tipe || undefined,
      } as any,
    ],
  });

  const tree_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetTree",
    api_query: [],
  });

  const pegawai_query = use_query({
    api_tag: "masterPegawai",
    api_method: "pegawaiGetControllerGetData",
    api_query: [{ status_aktif: "AKTIF", limit: 200 } as any],
  });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);
  const tree: any = (tree_query.response as any)?.data ?? null;

  const all_units: any[] = unwrap_list(list_query.response);
  const parent_options = all_units.filter((u: any) => u.tipe_unit === "KOORDINATOR" && u.id !== editing?.id).map((u: any) => ({ value: String(u.id), label: `${u.kode_unit} — ${u.nama_unit}` }));

  const kepala_options = unwrap_list(pegawai_query.response).map((p: any) => ({
    value: String(p.id),
    label: `${p.nama} — ${p.nip_nik}`,
  }));

  const set_field = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const create_mutation = use_mutation({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaPostControllerCreate",
    options: {
      call_back: () => {
        list_query.call_back();
        tree_query.call_back();
      },
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaPutControllerUpdate",
    options: {
      call_back: () => {
        list_query.call_back();
        tree_query.call_back();
      },
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const delete_mutation = use_mutation({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaDeleteControllerRemove",
    options: {
      call_back: () => {
        list_query.call_back();
        tree_query.call_back();
      },
    },
  });

  const open_create = () => {
    setEditing(null);
    setForm({
      kode_unit: "",
      nama_unit: "",
      tipe_unit: "KOORDINATOR",
      id_parent_unit: "",
      id_kepala_unit: "",
      deskripsi: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      kode_unit: row.kode_unit ?? "",
      nama_unit: row.nama_unit ?? "",
      tipe_unit: row.tipe_unit ?? "KOORDINATOR",
      id_parent_unit: row.parent_unit_id ?? "",
      id_kepala_unit: row.id_kepala_unit ?? "",
      deskripsi: row.deskripsi ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    const payload: any = {
      nama_unit: form.nama_unit,
      tipe_unit: form.tipe_unit,
      id_parent_unit: form.id_parent_unit || undefined,
      id_kepala_unit: form.id_kepala_unit || undefined,
      deskripsi: form.deskripsi || undefined,
      status_aktif: form.status_aktif || undefined,
    };
    if (editing) {
      update_mutation([editing.id, payload]);
    } else {
      payload.kode_unit = form.kode_unit;
      create_mutation([payload]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "kode_unit",
      label: "Kode",
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.kode_unit ?? "-")}</Typography>,
    },
    {
      id: "nama_unit",
      label: "Nama Unit",
      sortable: true,
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama_unit ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{String(row.deskripsi ?? "-")}</Typography>
        </Box>
      ),
    },
    {
      id: "tipe_unit",
      label: "Tipe",
      render: (_, row) => <StatusChip label={row.tipe_unit === "KOORDINATOR" ? "Koordinator" : "Sub Koordinator"} variant={row.tipe_unit === "KOORDINATOR" ? "info" : "neutral"} size="small" />,
    },
    {
      id: "kepala_unit_nama",
      label: "Kepala Unit",
      hideMobile: true,
      render: (_, row) => String(row.kepala_unit_nama ?? "-"),
    },
    {
      id: "jumlah_pegawai_aktif",
      label: "Pegawai Aktif",
      align: "right",
      render: (_, row) => String(row.jumlah_pegawai_aktif ?? 0),
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
              </ActionButtonGroup>
            ),
          },
        ]
      : []),
  ];

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="Unit Kerja"
      headerTitle="Struktur Organisasi"
      headerDescription="Pengelolaan unit kerja dinamis — koordinator dan sub koordinator."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Unit
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        <Card sx={{ p: 2.5, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", mb: 3 }}>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>Struktur Organisasi</Typography>
          <Divider sx={{ borderColor: "var(--border)", mb: 1 }} />
          {tree_query.is_loading && !tree ? <InfoCard message="Memuat struktur organisasi..." variant="loading" /> : tree ? <TreeNode node={tree} depth={0} /> : <InfoCard message="Belum ada data unit kerja." variant="info" />}
        </Card>

        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data unit kerja." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Unit Kerja"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari kode / nama unit..."
            filters={[
              {
                id: "tipe_unit",
                label: "Tipe Unit",
                value: tipe,
                options: [{ label: "Semua Tipe", value: "" }, ...TIPE_UNIT_OPTIONS],
                onChange: (v: string) => {
                  setTipe(v);
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
            emptyStateLabel="Belum ada data unit kerja."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah Unit: ${editing.nama_unit}` : "Tambah Unit Kerja"}
        description={editing ? "Perbarui data unit kerja." : "Lengkapi data unit kerja baru."}
        maxWidth={640}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kode Unit" value={form.kode_unit} onChange={(v: string) => set_field("kode_unit", v)} required disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Nama Unit" value={form.nama_unit} onChange={(v: string) => set_field("nama_unit", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Tipe Unit" value={String(form.tipe_unit ?? "")} options={TIPE_UNIT_OPTIONS} onChange={(v) => set_field("tipe_unit", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect
              label="Unit Induk (untuk Sub Koordinator)"
              value={String(form.id_parent_unit ?? "")}
              options={parent_options}
              onChange={(v) => set_field("id_parent_unit", v)}
              loading={list_query.is_loading}
              placeholder="Pilih unit induk..."
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Kepala Unit" value={String(form.id_kepala_unit ?? "")} options={kepala_options} onChange={(v) => set_field("id_kepala_unit", v)} loading={pegawai_query.is_loading} placeholder="Pilih pegawai..." />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Deskripsi" value={form.deskripsi} onChange={(v: string) => set_field("deskripsi", v)} multiline />
          </Grid>
          {editing ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect
                label="Status"
                value={String(form.status_aktif ?? "AKTIF")}
                options={[
                  { label: "Aktif", value: "AKTIF" },
                  { label: "Nonaktif", value: "NONAKTIF" },
                ]}
                onChange={(v) => set_field("status_aktif", v)}
              />
            </Grid>
          ) : null}
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Nonaktifkan Unit Kerja"
        message={`Unit "${confirm_target?.nama_unit ?? ""}" akan dinonaktifkan.`}
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default UnitKerjaPage;
