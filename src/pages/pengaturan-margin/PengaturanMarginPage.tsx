import { useState, useEffect } from "react";
import { Box, TextField, Typography, Alert } from "@mui/material";
import { SaveOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { InfoCard, SearchableSelect, SoftButton, StatusChip } from "../../components";
import use_query from "@Hooks/api-use-query";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { kategori_kamar_label } from "../../common/hris";

export function PengaturanMarginPage() {
  const token = auth_signal.value.selectedToken || "";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [rekeningOptions, setRekeningOptions] = useState<{ value: string; label: string }[]>([]);

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ tipe_unit: "KOORDINATOR", limit: 200 } as any],
  } as any);
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

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pengaturan-margin", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const list = j?.data?.list ?? j?.data ?? j?.list ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchList();
    const fetchRekening = async () => {
      try {
        const res = await fetch("/api/master-rekening", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const raw = json?.data?.data ?? json?.data ?? json;
        const rows = Array.isArray(raw) ? raw : (raw?.list ?? []);
        setRekeningOptions(rows.filter((r: any) => r.status_aktif === "AKTIF").map((r: any) => ({ value: String(r.id), label: `${r.nama_bank} — ${r.nama_rekening} (${r.nomor_rekening})` })));
      } catch (e: any) {
        setError(e?.message ?? "Gagal memuat Master Rekening");
      }
    };
    void fetchRekening();
  }, []);

  const total = items.reduce((s, x) => s + Number(x.persentase ?? 0), 0);
  const totalOk = Math.abs(total - 100) < 0.01;

  const save = async (row: any) => {
    setSaving(row.id);
    setMsg("");
    try {
      const res = await fetch(`/api/pengaturan-margin/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ persentase: Number(row.persentase), unit_kerja_id: row.unit_kerja_id, nama_kamar: row.nama_kamar, rekening_id: row.rekening_id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Berhasil disimpan");
      fetchList();
    } catch (e: any) {
      setError(e?.message ?? "Gagal simpan");
    } finally {
      setSaving(null);
    }
  };

  const updateField = (id: string, key: string, val: any) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  };

  return (
    <DashboardLayout sectionTitle="Sistem" title="Pengaturan Margin" headerTitle="Pengaturan Margin (5 Kamar)" headerDescription="Atur persentase dan unit koordinator pemilik wallet untuk distribusi margin otomatis. Total harus 100%.">
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {msg && (
          <Alert severity="success" onClose={() => setMsg("")} sx={{ py: 0.5, fontSize: "0.85rem" }}>
            {msg}
          </Alert>
        )}
        {error && <InfoCard message={error} variant="error" />}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <StatusChip label={`Total: ${total.toFixed(2)}%`} variant={totalOk ? "success" : "danger"} size="small" />
          {!totalOk && <Typography sx={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 600 }}>Total harus 100% — distribusi akan gagal jika tidak 100%</Typography>}
          {totalOk && <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Siap didistribusikan</Typography>}
        </Box>
        {loading ? (
          <InfoCard message="Memuat..." variant="info" />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.25 }}>
            {items.map((row) => (
              <Box
                key={row.id}
                sx={{
                  p: 1.5,
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  bgcolor: "var(--card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  transition: "border-color 0.15s",
                  "&:hover": { borderColor: "var(--primary)" },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{kategori_kamar_label(row.kategori_kamar)}</Typography>
                  <StatusChip label={`${row.persentase}%`} variant={Number(row.persentase) > 0 ? "info" : "neutral"} size="small" />
                </Box>
                <TextField label="Nama Kamar" size="small" fullWidth value={row.nama_kamar ?? ""} onChange={(e) => updateField(row.id, "nama_kamar", e.target.value)} sx={{ "& .MuiInputBase-input": { fontSize: "0.85rem", py: 0.75 } }} />
                <Box sx={{ display: "flex", gap: 1, minWidth: 0 }}>
                  <TextField
                    label="Persentase %"
                    size="small"
                    type="number"
                    value={String(row.persentase ?? "")}
                    onChange={(e) => updateField(row.id, "persentase", e.target.value === "" ? "" : Number(e.target.value))}
                    sx={{ flex: "0 0 92px", "& .MuiInputBase-input": { fontSize: "0.85rem" } }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <SearchableSelect
                      label="Unit Koordinator"
                      value={String(row.unit_kerja_id ?? "")}
                      options={unit_options}
                      onChange={(v) => updateField(row.id, "unit_kerja_id", v)}
                      loading={(unit_query as any).is_loading}
                      placeholder="Pilih unit..."
                    />
                  </Box>
                </Box>
                <SearchableSelect label="Master Rekening Tujuan" value={String(row.rekening_id ?? "")} options={rekeningOptions} onChange={(v) => updateField(row.id, "rekening_id", v)} placeholder="Pilih rekening tujuan..." />
                {!row.rekening_id && <Typography sx={{ fontSize: "0.72rem", color: "#b45309" }}>Rekening wajib dipilih sebelum distribusi margin.</Typography>}
                <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 0.25 }}>
                  <SoftButton size="small" startIcon={<SaveOutlined sx={{ fontSize: 16 }} />} onClick={() => save(row)} disabled={saving === row.id} sx={{ height: 28, fontSize: "0.75rem" }}>
                    {saving === row.id ? "Menyimpan..." : "Simpan"}
                  </SoftButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </div>
    </DashboardLayout>
  );
}
export default PengaturanMarginPage;
