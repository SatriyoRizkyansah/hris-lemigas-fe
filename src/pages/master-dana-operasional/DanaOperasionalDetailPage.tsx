import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Chip, Tabs, Tab, LinearProgress } from "@mui/material";
import { ArrowBackOutlined, AddOutlined, EditOutlined, DeleteOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, DataTable, InfoCard, Modal, SoftButton } from "../../components";
import { RupiahField } from "../../components/common/RupiahField";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import { format_rupiah, format_date, kategori_kamar_label, kategori_kamar_percent } from "../../common/hris";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { resolve_current_role } from "../../common/hris";
import { TextField, Grid } from "@mui/material";

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

export function DanaOperasionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = resolve_current_role();
  const can_manage_ledger = role === "superadmin" || role === "koordinator" || role === "keuangan";

  const [trx_modal_open, setTrxModalOpen] = useState(false);
  const [trx_form, setTrxForm] = useState<any>({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
  const [trx_editing, setTrxEditing] = useState<any>(null);
  const [active_tab, setActiveTab] = useState<"ledger" | "alokasi">("ledger");
  const [ledger_filter, setLedgerFilter] = useState("all");
  const [alokasi_filter, setAlokasiFilter] = useState("all");
  const [trx_saving, setTrxSaving] = useState(false);
  const [trx_deleting_id, setTrxDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const detail_query = use_query({ api_tag: "masterDanaOperasional", api_method: "danaOperasionalControllerGetDetail", api_query: [id as any] as any, should_running_if: Boolean(id) } as any);
  const ledger_query = use_query({ api_tag: "masterDanaOperasional", api_method: "danaOperasionalControllerGetLedger", api_query: [id as string], should_running_if: Boolean(id) } as any);

  const refresh_detail = async () => {
    setRefreshing(true);
    detail_query.call_back();
    ledger_query.call_back();
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const detail: any = (detail_query.response as any)?.data ?? (detail_query.response as any) ?? null;
  const d = detail?.data ?? detail;

  const ledger_resp: any = (ledger_query.response as any)?.data ?? (ledger_query.response as any) ?? null;
  const ledger: any[] = ledger_resp?.list ?? ledger_resp ?? [];
  const total_debit = Number(ledger_resp?.total_debit ?? 0);
  const total_kredit = Number(ledger_resp?.total_kredit ?? 0);
  const saldo_ledger = Number(ledger_resp?.saldo_ledger ?? 0);
  const saldo_akhir = Number(d?.sisa_saldo ?? saldo_ledger);
  const total_terpakai = Number(d?.total_terpakai ?? 0);
  const alokasi_list: any[] = d?.alokasi_list ?? [];
  const filtered_ledger = ledger.filter((row) => ledger_filter === "all" || (ledger_filter === "debit" ? Number(row.debit) > 0 : Number(row.kredit) > 0));
  const filtered_alokasi = alokasi_list.filter((row) => alokasi_filter === "all" || String(row.status ?? "").toUpperCase() === alokasi_filter);
  const alokasi_status_options = Array.from(new Set(alokasi_list.map((row) => String(row.status ?? "").toUpperCase()).filter(Boolean)));

  const handle_trx_submit = async () => {
    if (!id || trx_saving) return;
    setTrxSaving(true);
    const token = auth_signal.value.selectedToken || "";
    const payload: any = {
      nama_kegiatan: trx_form.nama_kegiatan,
      no_kuitansi: trx_form.no_kuitansi || undefined,
      tanggal: trx_form.tanggal,
      debit: Number(trx_form.debit) || 0,
      kredit: Number(trx_form.kredit) || 0,
      keterangan: trx_form.keterangan || undefined,
    };
    const url = trx_editing ? `/api/dana-operasional/${id}/transaksi/${trx_editing.id}` : `/api/dana-operasional/${id}/transaksi`;
    const method = trx_editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setTrxModalOpen(false);
      setTrxEditing(null);
      setTrxForm({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
      await refresh_detail();
    } catch (e: any) {
      alert(e?.message ?? "Gagal simpan transaksi");
    } finally {
      setTrxSaving(false);
    }
  };

  const handle_trx_delete = async (tid: string) => {
    if (!id || trx_deleting_id || !confirm("Hapus transaksi ini?")) return;
    setTrxDeletingId(tid);
    const token = auth_signal.value.selectedToken || "";
    try {
      const res = await fetch(`/api/dana-operasional/${id}/transaksi/${tid}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(await res.text());
      await refresh_detail();
    } catch (e: any) {
      alert(e?.message ?? "Gagal hapus transaksi");
    } finally {
      setTrxDeletingId(null);
    }
  };

  const ledger_columns: Column<any>[] = [
    { id: "no", label: "No", width: 50, render: (_: any, _r: any, idx?: number) => String((idx ?? 0) + 1) },
    { id: "tanggal", label: "Tanggal", width: 110, render: (_: any, r: any) => format_date(r.tanggal) },
    { id: "nama_kegiatan", label: "Uraian Transaksi", width: 220, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-word", fontSize: "0.82rem" }}>{String(r.nama_kegiatan ?? "-")}</Box> },
    {
      id: "referensi_proyek",
      label: "Referensi Proyek",
      width: 180,
      render: (_: any, r: any) =>
        r.proyek ? (
          <Box sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
            {String(r.proyek.kode_proyek)} — {String(r.proyek.nama_proyek)}
          </Box>
        ) : (
          <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>-</Typography>
        ),
    },
    { id: "debit", label: "Debit", align: "right", width: 120, render: (_: any, r: any) => (Number(r.debit) ? format_rupiah(r.debit) : "-") },
    { id: "kredit", label: "Kredit", align: "right", width: 120, render: (_: any, r: any) => (Number(r.kredit) ? format_rupiah(r.kredit) : "-") },
    {
      id: "saldo",
      label: "Saldo Berjalan",
      align: "right",
      width: 120,
      render: (_: any, r: any) => <Box sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.82rem", color: (r.saldo ?? 0) < 0 ? "#dc2626" : "inherit" }}>{format_rupiah(r.saldo ?? 0)}</Box>,
    },
    { id: "keterangan", label: "Keterangan", width: 160, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-word", fontSize: "0.8rem" }}>{String(r.keterangan ?? "-")}</Box> },
    ...(can_manage_ledger
      ? [
          {
            id: "aksi_trx",
            label: "Aksi",
            align: "right" as const,
            width: 90,
            render: (_: any, r: any) => (
              <ActionButtonGroup>
                <ActionButton
                  variant="edit"
                  title="Ubah"
                  icon={<EditOutlined fontSize="small" />}
                  onClick={() => {
                    setTrxEditing(r);
                    setTrxForm({
                      nama_kegiatan: r.nama_kegiatan ?? "",
                      no_kuitansi: r.no_kuitansi ?? "",
                      tanggal: String(r.tanggal ?? "").slice(0, 10),
                      debit: String(r.debit ?? ""),
                      kredit: String(r.kredit ?? ""),
                      keterangan: r.keterangan ?? "",
                    });
                    setTrxModalOpen(true);
                  }}
                />
                <ActionButton
                  variant="delete"
                  title={trx_deleting_id === r.id ? "Menghapus..." : "Hapus"}
                  icon={<DeleteOutlined fontSize="small" />}
                  disabled={Boolean(trx_deleting_id) || trx_saving}
                  onClick={() => handle_trx_delete(r.id)}
                />
              </ActionButtonGroup>
            ),
          } as any,
        ]
      : []),
  ];

  if (detail_query.is_loading) {
    return (
      <DashboardLayout sectionTitle="Master Data" title="Detail Dana Operasional" headerTitle="Detail Dana Operasional" headerDescription="Memuat data...">
        <Box sx={{ p: 3 }}>
          <InfoCard message="Memuat detail dana operasional..." variant="info" />
        </Box>
      </DashboardLayout>
    );
  }
  if (detail_query.error || !d) {
    return (
      <DashboardLayout sectionTitle="Master Data" title="Detail Dana Operasional" headerTitle="Detail Dana Operasional" headerDescription="Gagal memuat">
        <Box sx={{ p: 3 }}>
          <InfoCard message="Gagal memuat detail dana operasional." variant="error" />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title={`Dana — ${d.nama_unit_koordinator ?? "-"} · ${d.tahun_fiscal ?? ""}`}
      headerTitle={`${String(d.nama_unit_koordinator ?? "Dana Operasional")} — ${String(d.tahun_fiscal ?? "")}`}
      headerDescription={`${kategori_kamar_label(d.kategori_kamar)} ${kategori_kamar_percent(d.kategori_kamar)} · Plafon ${format_rupiah(d.total_plafon)}`}
      headerAction={
        <SoftButton startIcon={<ArrowBackOutlined />} variant="outlined" onClick={() => navigate("/dana-operasional")}>
          Kembali
        </SoftButton>
      }
    >
      {(refreshing || trx_saving || Boolean(trx_deleting_id)) && <LinearProgress sx={{ position: "sticky", top: 0, zIndex: 5 }} />}
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Summary cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>PLAFON AWAL</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5 }}>{format_rupiah(d.total_plafon)}</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", mt: 0.5 }}>
              {String(d.nama_unit_koordinator ?? "-")} · {String(d.tahun_fiscal ?? "-")} · {kategori_kamar_label(d.kategori_kamar)}
            </Typography>
            <Chip label={kategori_kamar_percent(d.kategori_kamar) || "-"} size="small" sx={{ mt: 1, height: 20, fontSize: "0.7rem" }} />
          </Box>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>TOTAL PENGELUARAN</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5, color: total_kredit > 0 ? "#dc2626" : undefined }}>{format_rupiah(total_kredit)}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>Dana masuk: {format_rupiah(total_debit)}</Typography>
          </Box>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: (d.sisa_saldo ?? 0) < 0 ? "#fef2f2" : "var(--card)", borderColor: (d.sisa_saldo ?? 0) < 0 ? "#fecaca" : "var(--border)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>SISA SALDO AKHIR</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5, color: saldo_akhir < 0 ? "#dc2626" : "#16a34a" }}>{format_rupiah(saldo_akhir)}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>Saldo tersedia setelah transaksi</Typography>
            {saldo_akhir < 0 && <Typography sx={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 600, mt: 0.5 }}>Over budget</Typography>}
          </Box>
        </Box>

        {/* Info grid */}
        <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>UNIT KOORDINATOR</Typography>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{String(d.nama_unit_koordinator ?? d.unit_koordinator?.nama_unit ?? "-")}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>TAHUN FISCAL</Typography>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{String(d.tahun_fiscal ?? "-")}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>KAMAR</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip label={kategori_kamar_label(d.kategori_kamar)} size="small" />
              <Typography sx={{ fontSize: "0.78rem" }}>{kategori_kamar_percent(d.kategori_kamar)}</Typography>
            </Stack>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>TOTAL PLAFON</Typography>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{format_rupiah(d.total_plafon)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>SISA SALDO</Typography>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{format_rupiah(saldo_akhir)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>TOTAL TERPAKAI</Typography>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: total_terpakai > 0 ? "#dc2626" : "#16a34a" }}>{format_rupiah(total_terpakai)}</Typography>
          </Box>
        </Box>

        <Box sx={{ border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)", overflow: "hidden" }}>
          <Box sx={{ px: 2, pt: 1, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Tabs value={active_tab} onChange={(_, value) => setActiveTab(value)} sx={{ minHeight: 42, "& .MuiTab-root": { minHeight: 42, textTransform: "none", fontSize: "0.84rem", fontWeight: 700 } }}>
              <Tab value="ledger" label={`Ledger (${ledger.length})`} />
              <Tab value="alokasi" label={`Alokasi Gaji TA (${alokasi_list.length})`} />
            </Tabs>
            {active_tab === "ledger" && can_manage_ledger && (
              <SoftButton
                size="small"
                startIcon={<AddOutlined />}
                disabled={trx_saving || Boolean(trx_deleting_id)}
                onClick={() => {
                  setTrxEditing(null);
                  setTrxForm({ nama_kegiatan: "", no_kuitansi: "", tanggal: new Date().toISOString().slice(0, 10), debit: "", kredit: "", keterangan: "" });
                  setTrxModalOpen(true);
                }}
              >
                Tambah Transaksi
              </SoftButton>
            )}
          </Box>

          {active_tab === "ledger" ? (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--muted-foreground)" }}>FILTER TRANSAKSI</Typography>
                {[
                  ["all", "Semua"],
                  ["debit", "Debit"],
                  ["kredit", "Kredit"],
                ].map(([value, label]) => (
                  <Chip
                    key={value}
                    label={label}
                    size="small"
                    variant={ledger_filter === value ? "filled" : "outlined"}
                    onClick={() => setLedgerFilter(value)}
                    sx={{
                      height: 28,
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      color: ledger_filter === value ? "#fff" : "var(--foreground)",
                      bgcolor: ledger_filter === value ? "var(--primary)" : "var(--card)",
                      borderColor: ledger_filter === value ? "var(--primary)" : "var(--border)",
                      "&:hover": { bgcolor: ledger_filter === value ? "var(--primary)" : "var(--muted)", borderColor: "var(--primary)" },
                      "& .MuiChip-label": { opacity: 1 },
                    }}
                  />
                ))}
              </Box>
              <Box sx={{ border: "1px solid var(--border)", borderRadius: 1.5, overflow: "hidden" }}>
                <DataTable
                  compact
                  columns={ledger_columns}
                  data={filtered_ledger}
                  title=""
                  searchPlaceholder="Cari transaksi..."
                  hidePagination
                  emptyState={<Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", py: 2, textAlign: "center", display: "block" }}>Belum ada transaksi ledger.</Typography>}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, mt: 1.5, p: 1.25, border: "1px solid var(--border)", borderRadius: 1, bgcolor: "var(--muted)", flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#dc2626" }}>Debit {format_rupiah(total_debit)}</Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#16a34a" }}>Kredit {format_rupiah(total_kredit)}</Typography>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>Saldo {format_rupiah(saldo_ledger)}</Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--muted-foreground)" }}>FILTER STATUS</Typography>
                {["all", ...alokasi_status_options].map((value) => (
                  <Chip
                    key={value}
                    label={value === "all" ? "Semua" : value}
                    size="small"
                    variant={alokasi_filter === value ? "filled" : "outlined"}
                    onClick={() => setAlokasiFilter(value)}
                    sx={{
                      height: 28,
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      color: alokasi_filter === value ? "#fff" : "var(--foreground)",
                      bgcolor: alokasi_filter === value ? "var(--primary)" : "var(--card)",
                      borderColor: alokasi_filter === value ? "var(--primary)" : "var(--border)",
                      "&:hover": { bgcolor: alokasi_filter === value ? "var(--primary)" : "var(--muted)", borderColor: "var(--primary)" },
                      "& .MuiChip-label": { opacity: 1 },
                    }}
                  />
                ))}
              </Box>
              <DataTable
                compact
                columns={[
                  {
                    id: "pegawai",
                    label: "Pegawai",
                    render: (_: any, a: any) => (
                      <Box>
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 600 }}>{String(a.pegawai?.nama ?? a.pegawai_id ?? "-")}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{String(a.pegawai?.nip_nik ?? "")}</Typography>
                      </Box>
                    ),
                  },
                  { id: "periode", label: "Periode", width: 110, render: (_: any, a: any) => `${String(a.periode_bulan ?? "-")}/${String(a.periode_tahun ?? "-")}` },
                  { id: "status", label: "Status", width: 100, render: (_: any, a: any) => <Chip label={String(a.status ?? "-")} size="small" sx={{ height: 22, fontSize: "0.7rem" }} /> },
                  { id: "jumlah", label: "Jumlah", align: "right", width: 150, render: (_: any, a: any) => <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, whiteSpace: "nowrap" }}>{format_rupiah(a.jumlah)}</Typography> },
                ]}
                data={filtered_alokasi}
                title=""
                searchPlaceholder="Cari pegawai..."
                hidePagination
                emptyState={<Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", py: 2, textAlign: "center", display: "block" }}>Belum ada alokasi gaji TA untuk dana ini.</Typography>}
              />
            </Box>
          )}
        </Box>
      </Box>

      <Modal
        open={trx_modal_open}
        onClose={() => setTrxModalOpen(false)}
        title={trx_editing ? "Ubah Transaksi" : "Tambah Transaksi"}
        description="Isi debit untuk pengeluaran, kredit untuk uang masuk."
        maxWidth={600}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => setTrxModalOpen(false), disabled: trx_saving },
          { label: trx_saving ? "Menyimpan..." : trx_editing ? "Simpan" : "Tambah", variant: "primary", onClick: handle_trx_submit, disabled: trx_saving },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama Kegiatan" value={trx_form.nama_kegiatan} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, nama_kegiatan: v }))} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="No Kuitansi" value={trx_form.no_kuitansi} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, no_kuitansi: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tanggal" value={trx_form.tanggal} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, tanggal: v }))} type="date" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RupiahField label="Debit" value={trx_form.debit} onChange={(n) => setTrxForm((f: any) => ({ ...f, debit: n }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RupiahField label="Kredit" value={trx_form.kredit} onChange={(n) => setTrxForm((f: any) => ({ ...f, kredit: n }))} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Keterangan" value={trx_form.keterangan} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, keterangan: v }))} />
          </Grid>
        </Grid>
      </Modal>
    </DashboardLayout>
  );
}
export default DanaOperasionalDetailPage;
