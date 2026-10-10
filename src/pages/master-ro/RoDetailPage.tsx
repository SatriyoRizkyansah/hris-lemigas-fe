import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Grid, TextField, Typography, Stack, LinearProgress, Alert, Tabs, Tab, Chip } from "@mui/material";
import { ArrowBackOutlined, AddOutlined, EditOutlined, DeleteOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, DataTable, FileUploadInput, InfoCard, Modal, SearchableSelect, SoftButton, StatusChip, ThemedDatePicker } from "../../components";
import { RupiahField } from "../../components/common/RupiahField";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { format_rupiah, format_date, status_variant, STATUS_RO_OPTIONS } from "../../common/hris";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { resolve_current_role } from "../../common/hris";

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

export function RoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = resolve_current_role();
  const can_manage_ledger = role === "superadmin" || role === "koordinator";
  const can_edit_ro = role === "superadmin" || role === "koordinator";

  const [rab_file, setRabFile] = useState<File | null>(null);
  const [rab_uploading, setRabUploading] = useState(false);
  const [sk_file, setSkFile] = useState<File | null>(null);
  const [sk_uploading, setSkUploading] = useState(false);
  const toDate = (v: string): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  const fromDate = (d: Date | null): string => {
    if (!d) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const [trx_modal_open, setTrxModalOpen] = useState(false);
  const [trx_form, setTrxForm] = useState<any>({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
  const [trx_editing, setTrxEditing] = useState<any>(null);
  const [active_tab, setActiveTab] = useState<"ledger" | "alokasi">("ledger");
  const [ledger_filter, setLedgerFilter] = useState("all");
  const [alokasi_filter, setAlokasiFilter] = useState("all");
  const [edit_open, setEditOpen] = useState(false);
  const [edit_form, setEditForm] = useState<any>({});

  const detail_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetDetail",
    api_query: [id as any] as any,
    should_running_if: Boolean(id),
  } as any);

  // Ledger dari endpoint khusus — saldo_berjalan dari backend
  const ledger_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetLedger",
    api_query: [id as string],
    should_running_if: Boolean(id),
  } as any);

  const detail: any = (detail_query.response as any)?.data ?? (detail_query.response as any) ?? null;
  const d = detail?.data ?? detail;

  // Ledger dari endpoint /ledger — running balance dari backend
  const ledger_resp: any = (ledger_query.response as any)?.data ?? (ledger_query.response as any) ?? null;
  const ledger: any[] = ledger_resp?.list ?? ledger_resp ?? [];
  const total_debit = ledger_resp?.total_debit ?? 0;
  const total_kredit = ledger_resp?.total_kredit ?? 0;
  const saldo_ledger = ledger_resp?.saldo_ledger ?? 0;
  const alokasi_list: any[] = d?.alokasi_list ?? [];
  const filtered_ledger = ledger.filter((row) => ledger_filter === "all" || (ledger_filter === "debit" ? Number(row.debit) > 0 : Number(row.kredit) > 0));
  const filtered_alokasi = alokasi_list.filter((row) => alokasi_filter === "all" || String(row.status ?? "").toUpperCase() === alokasi_filter);
  const alokasi_status_options = Array.from(new Set(alokasi_list.map((row) => String(row.status ?? "").toUpperCase()).filter(Boolean)));

  // balance breakdown from backend (new fields) fallback to computed
  const total_plafon = Number(d?.total_plafon ?? 0);
  const total_terpakai = Number(d?.total_terpakai ?? 0);
  const sisa_saldo = Number(d?.sisa_saldo ?? total_plafon - total_terpakai);
  const alokasi_terpakai = Number(d?.alokasi_terpakai ?? 0);
  const pct = total_plafon > 0 ? Math.min(100, Math.round((total_terpakai / total_plafon) * 100)) : 0;

  const handle_rab_upload = async () => {
    if (!id || !rab_file) return;
    setRabUploading(true);
    try {
      const token = auth_signal.value.selectedToken || "";
      const fd = new FormData();
      fd.append("file", rab_file);
      const res = await fetch(`/api/ro/${id}/rab`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      if (!res.ok) throw new Error(await res.text());
      setRabFile(null);
      detail_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal upload RAB");
    } finally {
      setRabUploading(false);
    }
  };
  const handle_sk_upload = async () => {
    if (!id || !sk_file) return;
    setSkUploading(true);
    try {
      const token = auth_signal.value.selectedToken || "";
      const fd = new FormData();
      fd.append("file", sk_file);
      const res = await fetch(`/api/ro/${id}/sk`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      if (!res.ok) throw new Error(await res.text());
      setSkFile(null);
      detail_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal upload SK");
    } finally {
      setSkUploading(false);
    }
  };

  const handle_trx_submit = async () => {
    if (!id) return;
    const token = auth_signal.value.selectedToken || "";
    const payload: any = {
      nama_kegiatan: trx_form.nama_kegiatan,
      no_kuitansi: trx_form.no_kuitansi || undefined,
      tanggal: trx_form.tanggal,
      debit: Number(trx_form.debit) || 0,
      kredit: Number(trx_form.kredit) || 0,
      keterangan: trx_form.keterangan || undefined,
    };
    const url = trx_editing ? `/api/ro/${id}/transaksi/${trx_editing.id}` : `/api/ro/${id}/transaksi`;
    const method = trx_editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setTrxModalOpen(false);
      setTrxEditing(null);
      setTrxForm({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
      detail_query.call_back();
      ledger_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal simpan transaksi");
    }
  };

  const handle_trx_delete = async (tid: string) => {
    if (!id || !confirm("Hapus transaksi ini?")) return;
    const token = auth_signal.value.selectedToken || "";
    try {
      const res = await fetch(`/api/ro/${id}/transaksi/${tid}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(await res.text());
      detail_query.call_back();
      ledger_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal hapus transaksi");
    }
  };

  const update_mutation: any = use_mutation({
    api_tag: "masterRo",
    api_method: "roControllerUpdate",
    options: {
      call_back: () => {
        detail_query.call_back();
        ledger_query.call_back();
      },
      will_exec_after_success: () => setEditOpen(false),
    },
  });
  const openEdit = () => {
    if (!d) return;
    setEditForm({
      nama_ro: d.nama_ro ?? "",
      total_plafon: d.total_plafon ?? "",
      no_kontrak: d.no_kontrak ?? "",
      pj: d.pj ?? "",
      no_sk: d.no_sk ?? "",
      mulai_sk: d.mulai_sk ? String(d.mulai_sk).slice(0, 10) : "",
      berakhir_sk: d.berakhir_sk ? String(d.berakhir_sk).slice(0, 10) : "",
      status_ro: d.status_ro ?? "AKTIF",
    });
    setEditOpen(true);
  };
  const submitEdit = () => {
    if (!id) return;
    update_mutation([
      id,
      {
        nama_ro: edit_form.nama_ro || undefined,
        total_plafon: edit_form.total_plafon !== "" ? Number(edit_form.total_plafon) : undefined,
        no_kontrak: edit_form.no_kontrak || undefined,
        pj: edit_form.pj || undefined,
        no_sk: edit_form.no_sk || undefined,
        mulai_sk: edit_form.mulai_sk || undefined,
        berakhir_sk: edit_form.berakhir_sk || undefined,
        status_ro: edit_form.status_ro || undefined,
      },
    ] as any);
  };
  const isIncomplete = !d?.no_kontrak || !d?.pj || !d?.no_sk || !d?.mulai_sk || !d?.berakhir_sk;

  const ledger_columns: Column<any>[] = [
    { id: "no", label: "No", width: 56, render: (_: any, _r: any, idx?: number) => String((idx ?? 0) + 1) },
    { id: "nama_kegiatan", label: "Nama Kegiatan", width: 220, render: (_: any, r: any) => <Box sx={{ fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(r.nama_kegiatan ?? "-")}</Box> },
    { id: "no_kuitansi", label: "No Kuitansi", width: 140, render: (_: any, r: any) => <Box sx={{ fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(r.no_kuitansi ?? "-")}</Box> },
    { id: "tanggal", label: "Tanggal", width: 110, render: (_: any, r: any) => <Box sx={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>{format_date(r.tanggal)}</Box> },
    {
      id: "debit",
      label: "Debit",
      align: "right",
      width: 130,
      render: (_: any, r: any) => <Box sx={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: Number(r.debit) ? "#dc2626" : undefined }}>{Number(r.debit) ? format_rupiah(r.debit) : "-"}</Box>,
    },
    {
      id: "kredit",
      label: "Kredit",
      align: "right",
      width: 130,
      render: (_: any, r: any) => <Box sx={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: Number(r.kredit) ? "#16a34a" : undefined }}>{Number(r.kredit) ? format_rupiah(r.kredit) : "-"}</Box>,
    },
    {
      id: "saldo",
      label: "Saldo Berjalan",
      align: "right",
      width: 130,
      render: (_: any, r: any) => <Box sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.82rem", color: (r.saldo ?? 0) < 0 ? "#dc2626" : "inherit" }}>{format_rupiah(r.saldo ?? 0)}</Box>,
    },
    { id: "keterangan", label: "Keterangan", width: 180, render: (_: any, r: any) => <Box sx={{ fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(r.keterangan ?? "-")}</Box> },
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
                <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => handle_trx_delete(r.id)} />
              </ActionButtonGroup>
            ),
          } as any,
        ]
      : []),
  ];

  if (detail_query.is_loading) {
    return (
      <DashboardLayout sectionTitle="Master Data" title="Detail RO" headerTitle="Detail RO" headerDescription="Memuat data...">
        <Box sx={{ p: 3 }}>
          <InfoCard message="Memuat detail RO..." variant="info" />
        </Box>
      </DashboardLayout>
    );
  }

  if (detail_query.error || !d) {
    return (
      <DashboardLayout sectionTitle="Master Data" title="Detail RO" headerTitle="Detail RO" headerDescription="Gagal memuat">
        <Box sx={{ p: 3 }}>
          <InfoCard message="Gagal memuat detail RO." variant="error" />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title={`RO — ${d.nama_ro ?? "-"}`}
      headerTitle={String(d.nama_ro ?? "Detail RO")}
      headerDescription={`${String(d.kode_ro ?? "-")} · ${String(d.proyek?.nama_proyek ?? d.nama_proyek ?? "-")} · ${String(d.tahun_fiscal ?? "-")}`}
      headerAction={
        <Stack direction="row" spacing={1}>
          {can_edit_ro && (
            <SoftButton startIcon={<EditOutlined />} variant="outlined" onClick={openEdit}>
              {isIncomplete ? "Lengkapi RO" : "Ubah RO"}
            </SoftButton>
          )}
          <SoftButton startIcon={<ArrowBackOutlined />} variant="outlined" onClick={() => navigate("/ro")}>
            Kembali
          </SoftButton>
        </Stack>
      }
    >
      {isIncomplete && can_edit_ro && (
        <Alert severity="warning" sx={{ mx: { xs: 2, sm: 3 }, mt: 2 }}>
          Data RO belum lengkap — lengkapi <b>No Kontrak, PJ, No SK, Periode SK</b> agar RO siap dipakai. Klik <b>Lengkapi RO</b>.
        </Alert>
      )}
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Anggaran summary */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>PLAFON AWAL</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5 }}>{format_rupiah(total_plafon)}</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", mt: 0.5 }}>
              Tahun {String(d.tahun_fiscal ?? "-")} · {String(d.kode_ro ?? "-")}
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>TOTAL PENGELUARAN</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5, color: total_terpakai > 0 ? "#dc2626" : undefined }}>{format_rupiah(total_terpakai)}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>
              Alokasi {format_rupiah(alokasi_terpakai)} · Debit ledger {format_rupiah(total_debit)} · Kredit {format_rupiah(total_kredit)}
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>Pemakaian</Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700 }}>{pct}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 99, bgcolor: "var(--muted)", "& .MuiLinearProgress-bar": { bgcolor: pct >= 90 ? "#dc2626" : pct >= 70 ? "#f59e0b" : "var(--primary)" } }} />
            </Box>
          </Box>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: sisa_saldo < 0 ? "#fef2f2" : "var(--card)", borderColor: sisa_saldo < 0 ? "#fecaca" : "var(--border)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>SISA SALDO AKHIR</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5, color: sisa_saldo < 0 ? "#dc2626" : "#16a34a" }}>{format_rupiah(sisa_saldo)}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>Saldo akhir running balance dari ledger</Typography>
            {sisa_saldo < 0 && <Typography sx={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 600, mt: 0.5 }}>Over budget</Typography>}
          </Box>
        </Box>

        {/* Info grid */}
        <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>KODE RO</Typography>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{String(d.kode_ro ?? "-")}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>NAMA RO</Typography>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{String(d.nama_ro ?? "-")}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>PROYEK</Typography>
            <Typography sx={{ fontSize: "0.85rem" }}>{String(d.proyek?.nama_proyek ?? d.nama_proyek ?? "-")}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>UNIT KOORDINATOR</Typography>
            <Typography sx={{ fontSize: "0.85rem" }}>{String(d.unit_koordinator?.nama_unit ?? d.nama_unit_koordinator ?? "-")}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>NO KONTRAK / PJ</Typography>
            <Typography sx={{ fontSize: "0.85rem" }}>
              {String(d.no_kontrak ?? "-")} · {String(d.pj ?? "-")}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)" }}>STATUS / SK</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <StatusChip label={String(d.status_ro ?? "AKTIF")} variant={status_variant(d.status_ro)} size="small" />
              <Typography sx={{ fontSize: "0.78rem" }}>{String(d.no_sk ?? "-")}</Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
              {format_date(d.mulai_sk)} — {format_date(d.berakhir_sk)}
            </Typography>
          </Box>
        </Box>

        {/* RAB + SK */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <FileUploadInput label="DOKUMEN RAB" value={rab_file} onChange={setRabFile} existingFileUrl={d.file_rab ?? null} accept=".pdf,.xlsx,.xls" disabled={!can_manage_ledger} />
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: "flex-end", alignItems: "center" }}>
              {/* {d.file_rab && <FileViewerButton fileUrl={d.file_rab} />} */}
              {can_manage_ledger && rab_file && (
                <SoftButton size="small" disabled={rab_uploading} onClick={handle_rab_upload}>
                  {rab_uploading ? "Mengunggah..." : "Upload RAB"}
                </SoftButton>
              )}
            </Stack>
          </Box>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <FileUploadInput label="DOKUMEN SK" value={sk_file} onChange={setSkFile} existingFileUrl={d.file_sk ?? null} accept=".pdf" disabled={!can_manage_ledger} />
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: "flex-end", alignItems: "center" }}>
              {/* {d.file_sk && <FileViewerButton fileUrl={d.file_sk} />} */}
              {can_manage_ledger && sk_file && (
                <SoftButton size="small" disabled={sk_uploading} onClick={handle_sk_upload}>
                  {sk_uploading ? "Mengunggah..." : "Upload SK"}
                </SoftButton>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Ledger */}
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
              <DataTable
                compact
                columns={ledger_columns}
                data={filtered_ledger}
                title=""
                searchPlaceholder="Cari transaksi..."
                hidePagination
                emptyState={<Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", py: 2, textAlign: "center", display: "block" }}>Belum ada transaksi ledger.</Typography>}
              />
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
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 600 }}>{String(a.pegawai?.nama ?? a.nama_pegawai ?? a.pegawai_id ?? "-")}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{String(a.pegawai?.nip_nik ?? a.nip_nik ?? "")}</Typography>
                      </Box>
                    ),
                  },
                  { id: "periode", label: "Periode", width: 110, render: (_: any, a: any) => `${String(a.periode_bulan ?? "-")}/${String(a.periode_tahun ?? "-")}` },
                  { id: "status", label: "Status", width: 100, render: (_: any, a: any) => <StatusChip label={String(a.status ?? "-")} variant={status_variant(a.status)} size="small" /> },
                  { id: "jumlah", label: "Jumlah", align: "right", width: 150, render: (_: any, a: any) => <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, whiteSpace: "nowrap" }}>{format_rupiah(a.jumlah)}</Typography> },
                ]}
                data={filtered_alokasi}
                title=""
                searchPlaceholder="Cari pegawai..."
                hidePagination
                emptyState={<Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", py: 2, textAlign: "center", display: "block" }}>Belum ada alokasi gaji TA untuk RO ini.</Typography>}
              />
            </Box>
          )}
        </Box>

        {/* Transaction Modal */}
        <Modal
          open={trx_modal_open}
          onClose={() => setTrxModalOpen(false)}
          title={trx_editing ? "Ubah Transaksi" : "Tambah Transaksi"}
          description="Isi debit untuk pengeluaran, kredit untuk uang masuk."
          maxWidth={600}
          actions={[
            { label: "Batal", variant: "ghost", onClick: () => setTrxModalOpen(false) },
            { label: trx_editing ? "Simpan" : "Tambah", variant: "primary", onClick: handle_trx_submit },
          ]}
        >
          <Grid container spacing={2} sx={{ mt: 0.5, pt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Field label="Nama Kegiatan" value={trx_form.nama_kegiatan} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, nama_kegiatan: v }))} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="No Kuitansi" value={trx_form.no_kuitansi} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, no_kuitansi: v }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ThemedDatePicker label="Tanggal" value={toDate(trx_form.tanggal)} onChange={(d) => setTrxForm((f: any) => ({ ...f, tanggal: fromDate(d) }))} required />
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

        {/* Edit RO Modal */}
        <Modal
          open={edit_open}
          onClose={() => setEditOpen(false)}
          title={isIncomplete ? "Lengkapi RO" : "Ubah RO"}
          description="Lengkapi data RO yang belum lengkap. Field kosong akan diisi."
          maxWidth={700}
          actions={[
            { label: "Batal", variant: "ghost", onClick: () => setEditOpen(false) },
            { label: "Simpan", variant: "primary", onClick: submitEdit },
          ]}
        >
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <Field label="Nama RO" value={edit_form.nama_ro} onChange={(v: string) => setEditForm((f: any) => ({ ...f, nama_ro: v }))} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="No Kontrak" value={edit_form.no_kontrak} onChange={(v: string) => setEditForm((f: any) => ({ ...f, no_kontrak: v }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="PJ" value={edit_form.pj} onChange={(v: string) => setEditForm((f: any) => ({ ...f, pj: v }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="No SK" value={edit_form.no_sk} onChange={(v: string) => setEditForm((f: any) => ({ ...f, no_sk: v }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect label="Status RO" value={String(edit_form.status_ro ?? "AKTIF")} options={STATUS_RO_OPTIONS} onChange={(v: string) => setEditForm((f: any) => ({ ...f, status_ro: v }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ThemedDatePicker label="Mulai SK" value={toDate(edit_form.mulai_sk)} onChange={(d) => setEditForm((f: any) => ({ ...f, mulai_sk: fromDate(d) }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ThemedDatePicker label="Berakhir SK" value={toDate(edit_form.berakhir_sk)} onChange={(d) => setEditForm((f: any) => ({ ...f, berakhir_sk: fromDate(d) }))} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <RupiahField label="Total Plafon" value={edit_form.total_plafon} onChange={(n) => setEditForm((f: any) => ({ ...f, total_plafon: n }))} required />
            </Grid>
          </Grid>
        </Modal>
      </Box>

      <Modal
        open={trx_modal_open}
        onClose={() => setTrxModalOpen(false)}
        title={trx_editing ? "Ubah Transaksi" : "Tambah Transaksi"}
        description="Isi debit untuk pengeluaran, kredit untuk uang masuk."
        maxWidth={600}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => setTrxModalOpen(false) },
          { label: trx_editing ? "Simpan" : "Tambah", variant: "primary", onClick: handle_trx_submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5, pt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama Kegiatan" value={trx_form.nama_kegiatan} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, nama_kegiatan: v }))} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="No Kuitansi" value={trx_form.no_kuitansi} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, no_kuitansi: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Tanggal" value={toDate(trx_form.tanggal)} onChange={(d) => setTrxForm((f: any) => ({ ...f, tanggal: fromDate(d) }))} required />
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

      <Modal
        open={edit_open}
        onClose={() => setEditOpen(false)}
        title={isIncomplete ? "Lengkapi RO" : "Ubah RO"}
        description="Lengkapi data RO yang belum lengkap. Field kosong akan diisi."
        maxWidth={700}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => setEditOpen(false) },
          { label: "Simpan", variant: "primary", onClick: submitEdit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama RO" value={edit_form.nama_ro} onChange={(v: string) => setEditForm((f: any) => ({ ...f, nama_ro: v }))} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="No Kontrak" value={edit_form.no_kontrak} onChange={(v: string) => setEditForm((f: any) => ({ ...f, no_kontrak: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="PJ" value={edit_form.pj} onChange={(v: string) => setEditForm((f: any) => ({ ...f, pj: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="No SK" value={edit_form.no_sk} onChange={(v: string) => setEditForm((f: any) => ({ ...f, no_sk: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Status RO" value={String(edit_form.status_ro ?? "AKTIF")} options={STATUS_RO_OPTIONS} onChange={(v: string) => setEditForm((f: any) => ({ ...f, status_ro: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Mulai SK" value={toDate(edit_form.mulai_sk)} onChange={(d) => setEditForm((f: any) => ({ ...f, mulai_sk: fromDate(d) }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Berakhir SK" value={toDate(edit_form.berakhir_sk)} onChange={(d) => setEditForm((f: any) => ({ ...f, berakhir_sk: fromDate(d) }))} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <RupiahField label="Total Plafon" value={edit_form.total_plafon} onChange={(n) => setEditForm((f: any) => ({ ...f, total_plafon: n }))} required />
          </Grid>
        </Grid>
      </Modal>
    </DashboardLayout>
  );
}
export default RoDetailPage;
