import { useState } from "react";
import { Box, Grid, TextField, Typography, Divider } from "@mui/material";
import { AddOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, ServerDataTable, SoftButton } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, current_year, format_rupiah, unwrap_list, unwrap_pagination, kategori_kamar_label } from "../../common/hris";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";

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
  const [detail_id, setDetailId] = useState<string | null>(null);
  const [detail_open, setDetailOpen] = useState(false);
  const [distribusi, setDistribusi] = useState<any[]>([]);
  const [distLoading, setDistLoading] = useState(false);
  const list_query = use_query({
    api_tag: "masterProyek",
    api_method: "proyekControllerGetData",
    api_query: [{ query: search || undefined, page: page + 1, limit: rows_per_page, tahun_fiscal: tahun ? Number(tahun) : undefined } as any],
  });
  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);
  const set_field = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const create_mutation = use_mutation({
    api_tag: "masterProyek",
    api_method: "proyekControllerCreate",
    options: { call_back: () => list_query.call_back(), will_exec_after_success: () => set_modal_open(false) },
  });
  const update_mutation = use_mutation({
    api_tag: "masterProyek",
    api_method: "proyekControllerUpdate",
    options: { call_back: () => list_query.call_back(), will_exec_after_success: () => set_modal_open(false) },
  });
  const delete_mutation = use_mutation({ api_tag: "masterProyek", api_method: "proyekControllerRemove", options: { call_back: () => list_query.call_back() } });
  const open_create = () => {
    setEditing(null);
    setForm({ kode_proyek: "", nama_proyek: "", tahun_fiscal: String(current_year()), sumber_pendanaan: "", nilai_kontrak: "", total_direct_cost: "", total_margin: "" });
    set_modal_open(true);
  };
  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      kode_proyek: row.kode_proyek ?? "",
      nama_proyek: row.nama_proyek ?? "",
      tahun_fiscal: String(row.tahun_fiscal ?? current_year()),
      sumber_pendanaan: row.sumber_pendanaan ?? "",
      nilai_kontrak: String(row.nilai_kontrak ?? ""),
      total_direct_cost: String(row.total_direct_cost ?? ""),
      total_margin: String(row.total_margin ?? ""),
    });
    set_modal_open(true);
  };
  const open_detail = async (row: any) => {
    setDetailId(String(row.id));
    setDetailOpen(true);
    setDistLoading(true);
    try {
      const token = auth_signal.value.selectedToken || "";
      const res = await fetch(`/api/proyek/${row.id}/distribusi`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const j = await res.json();
        const list = j?.data ?? j;
        setDistribusi(Array.isArray(list) ? list : (list?.list ?? []));
      } else setDistribusi([]);
    } catch {
      setDistribusi([]);
    } finally {
      setDistLoading(false);
    }
  };
  const submit = () => {
    const payload: any = {
      nama_proyek: form.nama_proyek,
      tahun_fiscal: Number(form.tahun_fiscal),
      sumber_pendanaan: form.sumber_pendanaan || undefined,
      nilai_kontrak: form.nilai_kontrak ? Number(form.nilai_kontrak) : 0,
      total_direct_cost: form.total_direct_cost ? Number(form.total_direct_cost) : 0,
      total_margin: form.total_margin ? Number(form.total_margin) : 0,
    };
    if (editing) update_mutation([editing.id, payload]);
    else {
      payload.kode_proyek = form.kode_proyek;
      create_mutation([payload]);
    }
  };
  const columns: Column<any>[] = [
    { id: "kode_proyek", label: "Kode Proyek", render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{String(row.kode_proyek ?? "-")}</Typography> },
    { id: "nama_proyek", label: "Nama Proyek", sortable: true, render: (_, row) => <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{String(row.nama_proyek ?? "-")}</Typography> },
    { id: "tahun_fiscal", label: "Tahun Fiscal", align: "center", render: (_, row) => String(row.tahun_fiscal ?? "-") },
    { id: "nilai_kontrak", label: "Nilai Kontrak", align: "right", hideMobile: true, render: (_, row) => format_rupiah(row.nilai_kontrak ?? 0) },
    { id: "total_margin", label: "Total Margin", align: "right", hideMobile: true, render: (_, row) => format_rupiah(row.total_margin ?? 0) },
    { id: "jumlah_ro", label: "Jumlah RO", align: "right", render: (_, row) => String(row.jumlah_ro ?? 0) },
    { id: "total_plafon_ro", label: "Total Plafon RO", align: "right", hideMobile: true, render: (_, row) => format_rupiah(row.total_plafon_ro) },
    {
      id: "aksi",
      label: "Aksi",
      align: "right" as const,
      render: (_: any, row: any) => (
        <ActionButtonGroup>
          <ActionButton variant="edit" title="Detail" icon={<VisibilityOutlined fontSize="small" />} onClick={() => open_detail(row)} />
          {can_edit && <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />}
        </ActionButtonGroup>
      ),
    },
  ];
  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="Proyek"
      headerTitle="Master Proyek"
      headerDescription="Daftar proyek — nilai kontrak, direct cost, margin otomatis terdistribusi ke 5 kamar."
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
            onRowClick={open_detail}
          />
        )}
      </Box>
      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah Proyek: ${editing.nama_proyek}` : "Tambah Proyek"}
        description={editing ? "Perbarui data proyek." : "Lengkapi data proyek baru — margin akan otomatis didistribusikan ke 5 kamar."}
        maxWidth={640}
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
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Nilai Kontrak (Rp)" value={form.nilai_kontrak} onChange={(v: string) => set_field("nilai_kontrak", v)} required type="number" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Total Direct Cost (Rp)" value={form.total_direct_cost} onChange={(v: string) => set_field("total_direct_cost", v)} required type="number" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Total Margin (Rp)" value={form.total_margin} onChange={(v: string) => set_field("total_margin", v)} required type="number" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>Margin akan otomatis didistribusikan ke 5 kamar sesuai Pengaturan Margin (48%/30%/17%/2.5%/2.5%).</Typography>
          </Grid>
        </Grid>
      </Modal>
      <Modal
        open={detail_open}
        onClose={() => {
          setDetailOpen(false);
          setDetailId(null);
        }}
        title={detail_id ? `Detail Proyek — Distribusi Margin` : "Detail Proyek"}
        description="Top-Down tracking: lihat kemana margin proyek didistribusikan."
        maxWidth={800}
        actions={[
          {
            label: "Tutup",
            variant: "ghost",
            onClick: () => {
              setDetailOpen(false);
              setDetailId(null);
            },
          },
        ]}
      >
        {distLoading ? (
          <InfoCard message="Memuat distribusi..." variant="info" />
        ) : distribusi.length === 0 ? (
          <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Belum ada distribusi margin untuk proyek ini (total_margin 0 atau belum terdistribusi).</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {distribusi.map((r: any) => (
              <Box key={r.id} sx={{ p: 1.5, border: "1px solid var(--border)", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    {kategori_kamar_label(r.dana_kategori ?? r.dana?.kategori_kamar)}{" "}
                    <Typography component="span" sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                      ({r.dana_kategori ?? r.dana?.kategori_kamar})
                    </Typography>
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                    Injected to {r.unit?.nama_unit ?? r.dana?.unit_koordinator_id ?? "-"} {r.unit?.kode_unit ? `(${r.unit.kode_unit})` : ""} · {r.nama_kegiatan ?? "-"}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color: "#16a34a" }}>{format_rupiah(r.debit ?? 0)}</Typography>
              </Box>
            ))}
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 700 }}>Total Terdistribusi</Typography>
              <Typography sx={{ fontWeight: 800 }}>{format_rupiah(distribusi.reduce((s, a) => s + Number(a.debit ?? 0), 0))}</Typography>
            </Box>
          </Box>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Hapus Proyek"
        message={`Proyek "${confirm_target?.nama_proyek ?? ""}" akan dihapus.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}
export default ProyekPage;
