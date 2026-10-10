import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Chip, Divider, Grid, TextField, Typography } from "@mui/material";
import { AddTaskOutlined, CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip, type Column } from "../../components";
import { RupiahField } from "../../components/common/RupiahField";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { current_year, format_date, format_rupiah } from "../../common/hris";

const api = async (path: string, init?: RequestInit) => {
  const token = auth_signal.value.selectedToken || "";
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(", ") : (body?.message ?? "Permintaan gagal"));
  return body?.data ?? body;
};
const today = () => new Date().toISOString().slice(0, 10);

export function RekonsiliasiBankPage() {
  const [rekening, setRekening] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [saldo, setSaldo] = useState<any>({ total_saldo_sistem: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saldoLoading, setSaldoLoading] = useState(false);
  const [tahun, setTahun] = useState(String(current_year()));
  const [filterRekening, setFilterRekening] = useState("");
  const [form, setForm] = useState<any>({ rekening_id: "", tanggal_rekonsiliasi: today(), saldo_bank: "", keterangan: "" });
  const saldoRequestRef = useRef(0);

  const rekeningOptions = useMemo(() => rekening.filter((r) => r.status_aktif === "AKTIF").map((r) => ({ value: r.id, label: `${r.nama_rekening} — ${r.nomor_rekening}` })), [rekening]);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ tahun_fiscal: tahun, ...(filterRekening ? { rekening_id: filterRekening } : {}) });
      const [accounts, records, systemBalance] = await Promise.all([api("/api/master-rekening"), api(`/api/rekonsiliasi?${params}`), api(`/api/rekonsiliasi/saldo-sistem?${params}`)]);
      setRekening(Array.isArray(accounts) ? accounts : []);
      setHistory(Array.isArray(records) ? records : []);
      setSaldo(systemBalance ?? { total_saldo_sistem: 0 });
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat rekonsiliasi");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [tahun, filterRekening]);

  const previewSaldoSistem = async (rekeningId: string) => {
    const requestId = ++saldoRequestRef.current;
    if (!rekeningId) {
      setSaldo({ total_saldo_sistem: 0 });
      setSaldoLoading(false);
      return;
    }
    setSaldoLoading(true);
    setSaldo({ total_saldo_sistem: 0, rekening_id: rekeningId, tahun_fiscal: Number(tahun) });
    try {
      const result = await api(`/api/rekonsiliasi/saldo-sistem?tahun_fiscal=${tahun}&rekening_id=${rekeningId}`);
      if (requestId === saldoRequestRef.current) setSaldo(result ?? { total_saldo_sistem: 0, rekening_id: rekeningId });
    } catch (e: any) {
      setSaldo({ total_saldo_sistem: 0, rekening_id: rekeningId });
      setError(e?.message ?? "Gagal menghitung saldo sistem");
    } finally {
      if (requestId === saldoRequestRef.current) setSaldoLoading(false);
    }
  };
  const openModal = () => {
    const next = { rekening_id: filterRekening, tanggal_rekonsiliasi: today(), saldo_bank: "", keterangan: "" };
    setForm(next);
    setModalOpen(true);
    void previewSaldoSistem(next.rekening_id);
  };
  const bankBalance = Number(form.saldo_bank || 0);
  const systemBalance = Number(saldo.total_saldo_sistem || 0);
  const difference = bankBalance - systemBalance;
  const unmatched = Boolean(form.rekening_id) && !saldoLoading && difference !== 0;
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api("/api/rekonsiliasi", {
        method: "POST",
        body: JSON.stringify({ rekening_id: form.rekening_id, saldo_bank: bankBalance, tanggal_rekonsiliasi: form.tanggal_rekonsiliasi, tahun_fiscal: Number(tahun), keterangan: form.keterangan || undefined }),
      });
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal menyimpan rekonsiliasi");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<any>[] = [
    { id: "tanggal_rekonsiliasi", label: "Tanggal", width: 118, render: (_v, row) => format_date(row.tanggal_rekonsiliasi) },
    {
      id: "rekening",
      label: "Rekening",
      width: 230,
      render: (_v, row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.82rem" }}>{row.rekening?.nama_rekening ?? "-"}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{row.rekening?.nomor_rekening ?? "-"}</Typography>
        </Box>
      ),
    },
    { id: "saldo_sistem", label: "Saldo Sistem", width: 150, align: "right", render: (_v, row) => format_rupiah(row.saldo_sistem) },
    { id: "saldo_bank", label: "Saldo Bank", width: 150, align: "right", render: (_v, row) => format_rupiah(row.saldo_bank) },
    {
      id: "selisih",
      label: "Selisih",
      width: 145,
      align: "right",
      render: (_v, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: Number(row.selisih) === 0 ? "#15803d" : "#dc2626" }}>{format_rupiah(row.selisih)}</Typography>,
    },
    { id: "status", label: "Status", width: 115, render: (_v, row) => <StatusChip label={row.status} variant={row.status === "MATCHED" ? "success" : "danger"} size="small" /> },
    { id: "keterangan", label: "Keterangan", width: 220, hideMobile: true, render: (_v, row) => <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{row.keterangan || "-"}</Typography> },
  ];

  return (
    <DashboardLayout sectionTitle="Keuangan" title="Rekonsiliasi Bank" headerTitle="Rekonsiliasi Rekening Bank & Kas" headerDescription="Bandingkan saldo fisik rekening koran dengan kas virtual per rekening.">
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <InfoCard message={error} variant="error" />}
        <Box
          sx={{
            p: { xs: 1.75, sm: 2.25 },
            border: "1px solid var(--border)",
            borderRadius: 2,
            bgcolor: "var(--card)",
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Kas Virtual Sistem</Typography>
            <Typography sx={{ mt: 0.25, fontSize: { xs: "1.45rem", sm: "1.8rem" }, fontWeight: 800, color: "var(--foreground)" }}>{format_rupiah(saldo.total_saldo_sistem)}</Typography>
            <Typography sx={{ fontSize: "0.76rem", color: "var(--muted-foreground)" }}>{filterRekening ? "Saldo sumber dana pada rekening dipilih" : "Pilih rekening untuk saldo virtual per rekening"}</Typography>
          </Box>
          <SoftButton startIcon={<AddTaskOutlined />} onClick={openModal}>
            Rekonsiliasi Baru
          </SoftButton>
        </Box>
        {(filterRekening || saldo.jumlah_ro || saldo.jumlah_dana_operasional) && (
          <Box sx={{ border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)", overflow: "hidden" }}>
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>Rincian Pembentuk Saldo Kas</Typography>
                <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.76rem" }}>
                  Audit trail saldo rekening {filterRekening ? "terpilih" : "semua rekening"} pada fiscal {tahun}.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.75 }}>
                <Chip size="small" label={`${saldo.jumlah_ro ?? 0} RO`} />
                <Chip size="small" label={`${saldo.jumlah_dana_operasional ?? 0} Dana Operasional`} />
              </Box>
            </Box>
            <Divider />
            <Grid container>
              <Grid size={{ xs: 12, md: 6 }} sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", mb: 1 }}>RO — Saldo Direct Cost</Typography>
                {(saldo.ro_breakdown ?? []).map((item: any) => (
                  <Box key={item.id} sx={{ py: 1, borderBottom: "1px solid var(--border)" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>
                        {item.kode_ro} · {item.nama_ro}
                      </Typography>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 800 }}>{format_rupiah(item.saldo)}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                      {item.proyek?.kode_proyek ?? "-"} · {item.proyek?.nama_proyek ?? "Tanpa proyek"}
                    </Typography>
                  </Box>
                ))}
                {(saldo.ro_breakdown ?? []).length === 0 && <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.78rem" }}>Tidak ada RO terhubung.</Typography>}
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5, fontWeight: 800 }}>
                  <Typography>Total RO</Typography>
                  <Typography>{format_rupiah(saldo.saldo_ro)}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ p: 2, borderLeft: { md: "1px solid var(--border)" } }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", mb: 1 }}>Dana Operasional — Saldo Bersih</Typography>
                {(saldo.dana_breakdown ?? []).map((item: any) => (
                  <Box key={item.id} sx={{ py: 1, borderBottom: "1px solid var(--border)" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{item.nama_unit ?? "Unit tidak tersedia"}</Typography>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 800 }}>{format_rupiah(item.saldo)}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                      Plafon {format_rupiah(item.plafon)} · Mutasi neto {format_rupiah(item.mutasi_neto)}
                    </Typography>
                  </Box>
                ))}
                {(saldo.dana_breakdown ?? []).length === 0 && <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.78rem" }}>Tidak ada Dana Operasional terhubung.</Typography>}
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5, fontWeight: 800 }}>
                  <Typography>Total Dana Operasional</Typography>
                  <Typography>{format_rupiah(saldo.saldo_dana_operasional)}</Typography>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ p: 2, bgcolor: "rgba(15, 23, 42, 0.03)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 800 }}>Total Kas Virtual Sistem</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>{format_rupiah(saldo.total_saldo_sistem)}</Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <TextField label="Tahun Fiscal" size="small" type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} sx={{ width: 130 }} />
          <Box sx={{ width: { xs: "100%", sm: 390 } }}>
            <SearchableSelect label="Filter Rekening" value={filterRekening} options={[{ value: "", label: "Semua rekening" }, ...rekeningOptions]} onChange={setFilterRekening} placeholder="Semua rekening" />
          </Box>
        </Box>
        <ServerDataTable
          columns={columns}
          data={history}
          title="Riwayat Rekonsiliasi"
          searchValue=""
          onSearchChange={() => {}}
          searchPlaceholder=""
          isLoading={loading}
          totalRows={history.length}
          page={0}
          rowsPerPage={50}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
          rowsPerPageOptions={[50]}
          compact
          emptyStateLabel="Belum ada riwayat rekonsiliasi."
        />
      </Box>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Rekonsiliasi Baru"
        description="Saldo sistem dihitung otomatis dari sumber dana yang dipetakan ke rekening."
        maxWidth={620}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => setModalOpen(false) },
          { label: saving ? "Menyimpan..." : "Simpan Rekonsiliasi", variant: "primary", onClick: save, disabled: saving || saldoLoading || !form.rekening_id || (unmatched && !form.keterangan?.trim()) },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect
              label="Rekening Fisik"
              required
              value={form.rekening_id}
              options={rekeningOptions}
              onChange={(value) => {
                setForm((f: any) => ({ ...f, rekening_id: value }));
                void previewSaldoSistem(value);
              }}
              placeholder="Pilih rekening..."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Tanggal Rekonsiliasi"
              size="small"
              type="date"
              fullWidth
              required
              value={form.tanggal_rekonsiliasi}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => setForm((f: any) => ({ ...f, tanggal_rekonsiliasi: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RupiahField label="Saldo Rekening Koran" value={form.saldo_bank} required onChange={(value) => setForm((f: any) => ({ ...f, saldo_bank: value }))} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: unmatched ? "#fef2f2" : "#f0fdf4", border: `1px solid ${unmatched ? "#fecaca" : "#bbf7d0"}` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {saldoLoading ? <CheckCircleOutline sx={{ color: "#64748b" }} /> : unmatched ? <ErrorOutline sx={{ color: "#dc2626" }} /> : <CheckCircleOutline sx={{ color: "#15803d" }} />}
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: saldoLoading ? "#475569" : unmatched ? "#b91c1c" : "#166534" }}>
                  {saldoLoading ? "MENGHITUNG SALDO..." : unmatched ? "UNMATCHED — perlu keterangan" : "MATCHED — saldo seimbang"}
                </Typography>
              </Box>
              <Typography sx={{ mt: 0.6, fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
                Saldo sistem: {format_rupiah(saldo.total_saldo_sistem)} · Selisih: <b>{format_rupiah(difference)}</b>
              </Typography>
            </Box>
          </Grid>
          {unmatched && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="warning" sx={{ mb: 1 }}>
                Isi alasan selisih, misalnya pajak belum disetor, bunga bank, atau kuitansi belum diinput.
              </Alert>
              <TextField label="Keterangan Selisih" size="small" fullWidth required multiline minRows={2} value={form.keterangan} onChange={(e) => setForm((f: any) => ({ ...f, keterangan: e.target.value }))} />
            </Grid>
          )}
        </Grid>
      </Modal>
    </DashboardLayout>
  );
}
export default RekonsiliasiBankPage;
