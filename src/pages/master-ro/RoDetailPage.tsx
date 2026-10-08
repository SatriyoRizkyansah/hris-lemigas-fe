import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Grid, TextField, Typography, Stack, LinearProgress } from "@mui/material";
import { ArrowBackOutlined, AddOutlined, EditOutlined, DeleteOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, DataTable, FileUploadInput, FileViewerButton, InfoCard, Modal, SoftButton, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import { format_rupiah, format_date, status_variant } from "../../common/hris";
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
  const can_manage_ledger = resolve_current_role() === "superadmin" || resolve_current_role() === "koordinator";

  const [rab_file, setRabFile] = useState<File | null>(null);
  const [rab_uploading, setRabUploading] = useState(false);
  const [trx_modal_open, setTrxModalOpen] = useState(false);
  const [trx_form, setTrxForm] = useState<any>({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
  const [trx_editing, setTrxEditing] = useState<any>(null);

  const detail_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetDetail",
    api_query: [id as any] as any,
    should_running_if: Boolean(id),
  } as any);

  const detail: any = (detail_query.response as any)?.data ?? (detail_query.response as any) ?? null;
  const d = detail?.data ?? detail;

  const ledger: any[] = d?.transaksi_list ?? d?.list ?? [];
  const total_debit = d?.total_debit ?? ledger.reduce((s: number, r: any) => s + Number(r.debit ?? 0), 0);
  const total_kredit = d?.total_kredit ?? ledger.reduce((s: number, r: any) => s + Number(r.kredit ?? 0), 0);
  const saldo_ledger = d?.saldo_ledger ?? total_kredit - total_debit;
  const alokasi_list: any[] = d?.alokasi_list ?? [];

  // balance breakdown from backend (new fields) fallback to computed
  const total_plafon = Number(d?.total_plafon ?? 0);
  const total_terpakai = Number(d?.total_terpakai ?? 0);
  const sisa_saldo = Number(d?.sisa_saldo ?? total_plafon - total_terpakai);
  const alokasi_terpakai = Number(d?.alokasi_terpakai ?? 0);
  const trx_debit = Number(d?.trx_debit ?? total_debit);
  const trx_kredit = Number(d?.trx_kredit ?? total_kredit);
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
    } catch (e: any) {
      alert(e?.message ?? "Gagal hapus transaksi");
    }
  };

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
    { id: "saldo", label: "Saldo", align: "right", width: 130, render: (_: any, r: any) => <Box sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.82rem" }}>{format_rupiah(r.saldo ?? 0)}</Box> },
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
        <SoftButton startIcon={<ArrowBackOutlined />} variant="outlined" onClick={() => navigate("/ro")}>
          Kembali
        </SoftButton>
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Anggaran summary */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>ANGGARAN (PLAFON)</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5 }}>{format_rupiah(total_plafon)}</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", mt: 0.5 }}>
              Tahun {String(d.tahun_fiscal ?? "-")} · {String(d.kode_ro ?? "-")}
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>TERPAKAI</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5, color: total_terpakai > 0 ? "#dc2626" : undefined }}>{format_rupiah(total_terpakai)}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>
              Alokasi {format_rupiah(alokasi_terpakai)} · Transaksi net {format_rupiah(trx_debit - trx_kredit)} (D {format_rupiah(trx_debit)} / K {format_rupiah(trx_kredit)})
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
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>SISA SALDO</Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, mt: 0.5, color: sisa_saldo < 0 ? "#dc2626" : "#16a34a" }}>{format_rupiah(sisa_saldo)}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>Plafon − Terpakai (alokasi + transaksi)</Typography>
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

        {/* RAB */}
        <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
          {/* <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 1.5 }}>Dokumen RAB</Typography> */}
          <FileUploadInput label="DOKUMEN RAB" value={rab_file} onChange={setRabFile} existingFileUrl={d.file_rab ?? null} accept=".pdf,.xlsx,.xls" disabled={!can_manage_ledger} />
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: "flex-end", alignItems: "center" }}>
            {d.file_rab && <FileViewerButton fileUrl={d.file_rab} />}
            {can_manage_ledger && rab_file && (
              <SoftButton size="small" disabled={rab_uploading} onClick={handle_rab_upload}>
                {rab_uploading ? "Mengunggah..." : "Upload RAB"}
              </SoftButton>
            )}
          </Stack>
        </Box>

        {/* Ledger */}
        <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Ledger Dana RO</Typography>
            {can_manage_ledger && (
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
          <Box sx={{ border: "1px solid var(--border)", borderRadius: 1.5, overflow: "hidden" }}>
            <DataTable
              columns={ledger_columns}
              data={ledger}
              title=""
              hideSearch
              hidePagination
              emptyState={<Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", py: 2, textAlign: "center", display: "block" }}>Belum ada transaksi ledger.</Typography>}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, mt: 1.5, p: 1.5, border: "1px solid var(--border)", borderRadius: 1, bgcolor: "var(--muted)", flexWrap: "wrap" }}>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>TOTAL DEBIT</Typography>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#dc2626" }}>{format_rupiah(total_debit)}</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>TOTAL KREDIT</Typography>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a" }}>{format_rupiah(total_kredit)}</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>SALDO LEDGER</Typography>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>{format_rupiah(saldo_ledger)}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Alokasi */}
        <Box sx={{ p: 2.5, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1.5 }}>Alokasi Gaji TA (dari RO ini)</Typography>
          <Box sx={{ border: "1px solid var(--border)", borderRadius: 1.5, overflow: "hidden" }}>
            <DataTable
              columns={[
                {
                  id: "no",
                  label: "No",
                  width: 52,
                  render: (_: any, _r: any, idx?: number) => String((idx ?? 0) + 1),
                },
                {
                  id: "nama_pegawai",
                  label: "Pegawai",
                  render: (_: any, a: any) => (
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>
                        {String(a.pegawai?.nama ?? a.nama_pegawai ?? a.pegawai_id ?? "-")}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                        {String(a.pegawai?.nip_nik ?? a.nip_nik ?? "")}
                      </Typography>
                    </Box>
                  ),
                },
                {
                  id: "periode",
                  label: "Periode",
                  width: 110,
                  render: (_: any, a: any) => (
                    <Typography sx={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                      {String(a.periode_bulan ?? "-")}/{String(a.periode_tahun ?? "-")}
                    </Typography>
                  ),
                },
                {
                  id: "status",
                  label: "Status",
                  width: 100,
                  render: (_: any, a: any) => (
                    <StatusChip label={String(a.status ?? "-")} variant={status_variant(a.status)} size="small" />
                  ),
                },
                {
                  id: "jumlah",
                  label: "Jumlah",
                  align: "right" as const,
                  width: 150,
                  render: (_: any, a: any) => (
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {format_rupiah(a.jumlah)}
                    </Typography>
                  ),
                },
              ]}
              data={alokasi_list}
              title=""
              hideSearch
              hidePagination
              emptyState={
                <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", py: 2, textAlign: "center", display: "block" }}>
                  Belum ada alokasi gaji TA untuk RO ini.
                </Typography>
              }
            />
          </Box>
          {alokasi_list.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5, px: 1 }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>TOTAL ALOKASI</Typography>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>
                  {format_rupiah(alokasi_list.reduce((s: number, a: any) => s + Number(a.jumlah ?? 0), 0))}
                </Typography>
              </Box>
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
            <Field label="Tanggal" value={trx_form.tanggal} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, tanggal: v }))} type="date" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Debit (Rp)" value={trx_form.debit} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, debit: v }))} type="number" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kredit (Rp)" value={trx_form.kredit} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, kredit: v }))} type="number" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Keterangan" value={trx_form.keterangan} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, keterangan: v }))} />
          </Grid>
        </Grid>
      </Modal>
    </DashboardLayout>
  );
}
export default RoDetailPage;
