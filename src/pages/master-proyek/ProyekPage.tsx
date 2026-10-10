import { useState, useEffect } from "react";
import { Box, Grid, TextField, Typography, Divider, Chip, Alert, IconButton } from "@mui/material";
import { AddOutlined, EditOutlined, VisibilityOutlined, DeleteOutline, SettingsOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, ServerDataTable, SoftButton, SearchableSelect } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { RupiahField } from "../../components/common/RupiahField";
import { resolve_current_role, current_year, format_rupiah, unwrap_list, unwrap_pagination, kategori_kamar_label } from "../../common/hris";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";

function Field({ label, value, onChange, required, disabled, type, placeholder }: any) {
  return <TextField label={label} size="small" fullWidth required={required} disabled={disabled} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}
const TAHUN_OPTIONS = [0, 1, 2, 3].map((i) => {
  const y = current_year() - i;
  return { label: String(y), value: String(y) };
});

type RoRow = { key: string; nama_ro: string; kode_ro: string; id_unit_koordinator: string; plafon: string };

export function ProyekPage() {
  const navigate = useNavigate();
  const can_edit = resolve_current_role() === "superadmin";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [tahun, setTahun] = useState("");
  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [ro_rows, setRoRows] = useState<RoRow[]>([]);
  const [confirm_target, setConfirmTarget] = useState<any>(null);
  const [detail_id, setDetailId] = useState<string | null>(null);
  const [detail_open, setDetailOpen] = useState(false);
  const [distribusi, setDistribusi] = useState<any[]>([]);
  const [distLoading, setDistLoading] = useState(false);
  const [detail_ro_list, setDetailRoList] = useState<any[]>([]);
  const [pengaturan, setPengaturan] = useState<any[]>([]);
  const token = auth_signal.value.selectedToken || "";

  const list_query = use_query({
    api_tag: "masterProyek",
    api_method: "proyekControllerGetData",
    api_query: [{ query: search || undefined, page: page + 1, limit: rows_per_page, tahun_fiscal: tahun ? Number(tahun) : undefined } as any],
  });
  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);
  const set_field = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const unit_query = use_query({ api_tag: "masterUnitKerja", api_method: "unitKerjaGetControllerGetData", api_query: [{ tipe_unit: "KOORDINATOR", limit: 200 } as any] } as any);
  const unit_options = (() => {
    try {
      const raw: any = unit_query.response;
      const list = raw?.data?.data ?? raw?.data ?? raw ?? [];
      const arr = Array.isArray(list) ? list : (list?.data ?? []);
      return (Array.isArray(arr) ? arr : []).map((u: any) => ({ value: String(u.id), label: `${u.kode_unit} — ${u.nama_unit}` }));
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    if (!modal_open) return;
    const fetchPengaturan = async () => {
      try {
        const res = await fetch("/api/pengaturan-margin", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) {
          const j = await res.json();
          const list = j?.data?.list ?? j?.data ?? j?.list ?? [];
          setPengaturan(Array.isArray(list) ? list : []);
        }
      } catch {
        /* ignore */
      }
    };
    fetchPengaturan();
  }, [modal_open, token]);

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
    setRoRows([{ key: String(Date.now()), nama_ro: "", kode_ro: "", id_unit_koordinator: "", plafon: "" }]);
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
    setRoRows([]);
    set_modal_open(true);
  };
  const open_detail = async (row: any) => {
    setDetailId(String(row.id));
    setDetailOpen(true);
    setDistLoading(true);
    setDetailRoList([]);
    try {
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [distRes, roRes] = await Promise.all([fetch(`/api/proyek/${row.id}/distribusi`, { headers }), fetch(`/api/ro?id_proyek=${row.id}&limit=100`, { headers })]);
      if (distRes.ok) {
        const j = await distRes.json();
        const list = j?.data ?? j;
        setDistribusi(Array.isArray(list) ? list : (list?.list ?? []));
      } else setDistribusi([]);
      if (roRes.ok) {
        const j = await roRes.json();
        const list = j?.data?.data ?? j?.data ?? j?.list ?? [];
        const arr = Array.isArray(list) ? list : [];
        setDetailRoList(arr);
      }
    } catch {
      setDistribusi([]);
    } finally {
      setDistLoading(false);
    }
  };

  const nilaiKontrakNum = Number(form.nilai_kontrak) || 0;
  const directNum = Number(form.total_direct_cost) || 0;
  const marginNum = Number(form.total_margin) || 0;
  const kontrakValid = nilaiKontrakNum === directNum + marginNum;
  const kontrakMismatch = form.nilai_kontrak !== "" && form.total_direct_cost !== "" && form.total_margin !== "" && !kontrakValid;
  const roSum = ro_rows.reduce((s, r) => s + (Number(r.plafon) || 0), 0);
  const roValid = ro_rows.length === 0 || ro_rows.every((r) => !r.nama_ro && !r.plafon && !r.id_unit_koordinator) || roSum === directNum;
  const roHasAny = ro_rows.some((r) => r.nama_ro || r.plafon || r.id_unit_koordinator);
  const roMismatch = roHasAny && roSum !== directNum;

  const marginPreview = pengaturan.map((p: any) => ({
    ...p,
    amount: Math.round((Number(p.persentase) / 100) * marginNum),
  }));

  const canSubmit = (() => {
    if (!form.kode_proyek || !form.nama_proyek || !form.tahun_fiscal) return false;
    if (form.nilai_kontrak === "" || form.total_direct_cost === "" || form.total_margin === "") return false;
    if (!kontrakValid) return false;
    if (roHasAny) {
      if (roSum !== directNum) return false;
      for (const r of ro_rows) {
        if (r.nama_ro || r.plafon || r.id_unit_koordinator) {
          if (!r.nama_ro || !r.id_unit_koordinator || !r.plafon || Number(r.plafon) <= 0) return false;
        }
      }
    }
    return true;
  })();

  const submit = () => {
    const payload: any = {
      nama_proyek: form.nama_proyek,
      tahun_fiscal: Number(form.tahun_fiscal),
      sumber_pendanaan: form.sumber_pendanaan || undefined,
      nilai_kontrak: form.nilai_kontrak ? Number(form.nilai_kontrak) : 0,
      total_direct_cost: form.total_direct_cost ? Number(form.total_direct_cost) : 0,
      total_margin: form.total_margin ? Number(form.total_margin) : 0,
    };
    if (editing) {
      update_mutation([editing.id, payload]);
    } else {
      payload.kode_proyek = form.kode_proyek;
      const filtered = ro_rows.filter((r) => r.nama_ro && r.id_unit_koordinator && r.plafon);
      if (filtered.length > 0) {
        payload.ro_list = filtered.map((r) => ({
          nama_ro: r.nama_ro,
          kode_ro: r.kode_ro || undefined,
          id_unit_koordinator: r.id_unit_koordinator,
          plafon: Number(r.plafon),
        }));
      }
      create_mutation([payload]);
    }
  };

  const addRoRow = () => setRoRows((prev) => [...prev, { key: String(Date.now() + Math.random()), nama_ro: "", kode_ro: "", id_unit_koordinator: "", plafon: "" }]);
  const removeRoRow = (key: string) => setRoRows((prev) => prev.filter((r) => r.key !== key));
  const updateRoRow = (key: string, field: keyof RoRow, val: string) => setRoRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: val } : r)));

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
        description={editing ? "Adendum: ubah Nilai Kontrak / Direct Cost / Margin. Delta margin otomatis terdistribusi ke 5 kamar." : "Lengkapi header proyek + bagi Direct Cost ke RO. Margin otomatis terbagi ke 5 kamar."}
        maxWidth={900}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit, disabled: !canSubmit },
        ]}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          {/* Header Proyek */}
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 1 }}>Header Proyek</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field label="Kode Proyek" value={form.kode_proyek} onChange={(v: string) => set_field("kode_proyek", v)} required disabled={Boolean(editing)} placeholder="PRJ-2026-001" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field label="Tahun Fiscal" value={form.tahun_fiscal} onChange={(v: string) => set_field("tahun_fiscal", v)} required type="number" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Field label="Nama Proyek" value={form.nama_proyek} onChange={(v: string) => set_field("nama_proyek", v)} required placeholder="Pengembangan Infrastruktur Migas" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Field label="Sumber Pendanaan" value={form.sumber_pendanaan} onChange={(v: string) => set_field("sumber_pendanaan", v)} placeholder="APBN 2026" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <RupiahField label="Nilai Kontrak" value={form.nilai_kontrak} onChange={(n) => set_field("nilai_kontrak", n)} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <RupiahField label="Total Direct Cost" value={form.total_direct_cost} onChange={(n) => set_field("total_direct_cost", n)} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <RupiahField label="Total Margin" value={form.total_margin} onChange={(n) => set_field("total_margin", n)} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                {kontrakMismatch ? (
                  <Alert severity="error" sx={{ fontSize: "0.8rem" }}>
                    Nilai Kontrak ({format_rupiah(nilaiKontrakNum)}) harus = Direct Cost ({format_rupiah(directNum)}) + Margin ({format_rupiah(marginNum)}) = {format_rupiah(directNum + marginNum)}
                  </Alert>
                ) : form.nilai_kontrak && form.total_direct_cost && form.total_margin ? (
                  <Alert severity="success" sx={{ fontSize: "0.8rem" }}>
                    ✓ Nilai Kontrak valid: {format_rupiah(nilaiKontrakNum)} = {format_rupiah(directNum)} + {format_rupiah(marginNum)}
                  </Alert>
                ) : (
                  <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>Isi ketiga nilai — sistem validasi Nilai Kontrak = Direct Cost + Margin.</Typography>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Section Dynamic RO — only for create */}
          {!editing && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Alokasi Direct Cost ke RO</Typography>
                <SoftButton size="small" startIcon={<AddOutlined />} onClick={addRoRow}>
                  Tambah RO
                </SoftButton>
              </Box>
              <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mb: 1.5 }}>Bagi Total Direct Cost ({format_rupiah(directNum)}) ke satu atau beberapa RO. Total plafon RO harus sama dengan Direct Cost.</Typography>
              {ro_rows.map((row, idx) => (
                <Box key={row.key} sx={{ p: 1.5, border: "1px solid var(--border)", borderRadius: 2, mb: 1.5, bgcolor: "var(--card)" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.8rem" }}>RO #{idx + 1}</Typography>
                    <IconButton size="small" onClick={() => removeRoRow(row.key)} disabled={ro_rows.length <= 1}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Nama RO" size="small" fullWidth value={row.nama_ro} onChange={(e) => updateRoRow(row.key, "nama_ro", e.target.value)} placeholder="Operasional Pengeboran" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Kode RO (opsional)" size="small" fullWidth value={row.kode_ro} onChange={(e) => updateRoRow(row.key, "kode_ro", e.target.value)} placeholder="Auto: PRJ-RO-01" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <SearchableSelect label="Unit Koordinator" value={row.id_unit_koordinator} options={unit_options} onChange={(v) => updateRoRow(row.key, "id_unit_koordinator", String(v))} placeholder="Pilih unit..." />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <RupiahField label="Plafon" value={row.plafon} onChange={(n) => updateRoRow(row.key, "plafon", String(n))} />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Box sx={{ mt: 1 }}>
                {roHasAny && roMismatch ? (
                  <Alert severity="error" sx={{ fontSize: "0.8rem" }}>
                    Total plafon RO {format_rupiah(roSum)} ≠ Direct Cost {format_rupiah(directNum)} — sesuaikan plafon atau Direct Cost.
                  </Alert>
                ) : roHasAny && roValid ? (
                  <Alert severity="success" sx={{ fontSize: "0.8rem" }}>
                    ✓ Total plafon RO {format_rupiah(roSum)} = Direct Cost {format_rupiah(directNum)}
                  </Alert>
                ) : (
                  <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>Kosongkan jika RO akan dibuat nanti via Master RO. Jika diisi, total plafon harus = Direct Cost.</Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Margin Preview */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Preview Distribusi Margin ke 5 Kamar</Typography>
              <SoftButton
                size="small"
                variant="outlined"
                startIcon={<SettingsOutlined />}
                onClick={() => {
                  set_modal_open(false);
                  navigate("/pengaturan-margin");
                }}
              >
                Atur Kamar
              </SoftButton>
            </Box>
            {marginNum <= 0 ? (
              <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Isi Total Margin untuk melihat preview pembagian ke 5 kamar.</Typography>
            ) : pengaturan.length === 0 ? (
              <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Memuat pengaturan kamar...</Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                {marginPreview.map((p: any) => (
                  <Box key={p.id} sx={{ p: 1.2, border: "1px solid var(--border)", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {kategori_kamar_label(p.kategori_kamar)} <Chip label={`${p.persentase}%`} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.65rem" }} />
                      </Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{p.unit_kerja?.nama_unit ?? p.unit_kerja_id ?? "-"}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#16a34a" }}>{format_rupiah(p.amount)}</Typography>
                  </Box>
                ))}
                <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", pt: 1, borderTop: "1px dashed var(--border)" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>Total Margin</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{format_rupiah(marginNum)}</Typography>
                </Box>
              </Box>
            )}
          </Box>

          {(create_mutation as any).error && <Alert severity="error">{String((create_mutation as any).error?.message ?? "Gagal menyimpan")}</Alert>}
          {(update_mutation as any).error && <Alert severity="error">{String((update_mutation as any).error?.message ?? "Gagal menyimpan")}</Alert>}
        </Box>
      </Modal>
      <Modal
        open={detail_open}
        onClose={() => {
          setDetailOpen(false);
          setDetailId(null);
        }}
        title={detail_id ? `Detail Proyek — Tracking` : "Detail Proyek"}
        description="Top-Down: RO & distribusi margin. Bottom-Up: ledger dana operasional."
        maxWidth={900}
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
          <InfoCard message="Memuat..." variant="info" />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {detail_ro_list.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>RO Proyek ({detail_ro_list.length})</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {detail_ro_list.map((r: any) => (
                    <Box key={r.id} sx={{ p: 1.2, border: "1px solid var(--border)", borderRadius: 2, display: "flex", justifyContent: "space-between" }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {r.kode_ro} — {r.nama_ro}
                        </Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                          {r.unit_koordinator?.nama_unit ?? r.id_unit_koordinator} · {format_rupiah(r.total_plafon)}
                        </Typography>
                      </Box>
                      <Chip label={r.status_ro ?? "AKTIF"} size="small" />
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ mt: 2 }} />
              </Box>
            )}
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>Distribusi Margin ke 5 Kamar</Typography>
              {distribusi.length === 0 ? (
                <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Belum ada distribusi margin untuk proyek ini.</Typography>
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
