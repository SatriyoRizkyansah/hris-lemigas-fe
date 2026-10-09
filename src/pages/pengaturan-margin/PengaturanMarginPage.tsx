import { useState, useEffect } from "react";
import { Box, Grid, TextField, Typography, Chip, Alert } from "@mui/material";
import { SaveOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { InfoCard, SearchableSelect, SoftButton } from "../../components";
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
        body: JSON.stringify({ persentase: Number(row.persentase), unit_kerja_id: row.unit_kerja_id, nama_kamar: row.nama_kamar }),
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
      <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
        {msg && (
          <Alert severity="success" onClose={() => setMsg("")}>
            {msg}
          </Alert>
        )}
        {error && <InfoCard message={error} variant="error" />}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Chip label={`Total: ${total.toFixed(2)}%`} color={totalOk ? "success" : "error"} size="small" />
          {!totalOk && <Typography sx={{ fontSize: "0.8rem", color: "#dc2626" }}>Total harus 100% — distribusi akan gagal jika tidak 100%</Typography>}
        </Box>
        {loading ? (
          <InfoCard message="Memuat..." variant="info" />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {items.map((row) => (
              <Box key={row.id} sx={{ p: 2, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {kategori_kamar_label(row.kategori_kamar)}{" "}
                    <Typography component="span" sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                      ({row.kategori_kamar})
                    </Typography>
                  </Typography>
                  <Chip label={`${row.persentase}%`} size="small" variant="outlined" />
                </Box>
                <TextField label="Nama Kamar" size="small" fullWidth value={row.nama_kamar ?? ""} onChange={(e) => updateField(row.id, "nama_kamar", e.target.value)} />
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 4 }}>
                    <TextField label="Persentase %" size="small" fullWidth type="number" value={String(row.persentase ?? "")} onChange={(e) => updateField(row.id, "persentase", e.target.value === "" ? "" : Number(e.target.value))} />
                  </Grid>
                  <Grid size={{ xs: 8 }}>
                    <SearchableSelect
                      label="Unit Koordinator"
                      value={String(row.unit_kerja_id ?? "")}
                      options={unit_options}
                      onChange={(v) => updateField(row.id, "unit_kerja_id", v)}
                      loading={(unit_query as any).is_loading}
                      placeholder="Pilih unit..."
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <SoftButton size="small" startIcon={<SaveOutlined />} onClick={() => save(row)} disabled={saving === row.id}>
                    {saving === row.id ? "Menyimpan..." : "Simpan"}
                  </SoftButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
export default PengaturanMarginPage;
