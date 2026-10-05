import { useState } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { DownloadOutlined, RefreshOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { InfoCard, Modal, SoftButton, TableSkeleton, DataTable } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { show_alert_snackbar } from "@Signal/use-signal/snackbar_signal";
import { resolve_current_role, current_year, current_month, format_rupiah, format_date, BULAN_OPTIONS, unwrap_list } from "../../common/hris";

export function RekapAlokasiPage() {
  const role = resolve_current_role();
  const show_unit_filter = role === "superadmin";

  const [bulan, setBulan] = useState(String(current_month()));
  const [tahun, setTahun] = useState(String(current_year()));
  const [unit, setUnit] = useState("");
  const [exporting, set_exporting] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const rekap_query = use_query({
    api_tag: "alokasiGajiTa",
    api_method: "alokasiRekapControllerGetRekap",
    api_query: [
      {
        periode_bulan: Number(bulan) || undefined,
        periode_tahun: Number(tahun) || undefined,
        id_unit_kerja: unit || undefined,
      } as any,
    ],
  });

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const rows: any[] = unwrap_list(rekap_query.response);

  const export_rekap = async () => {
    const params = new URLSearchParams();
    if (Number(bulan)) params.set("periode_bulan", String(Number(bulan)));
    if (Number(tahun)) params.set("periode_tahun", String(Number(tahun)));
    if (unit) params.set("id_unit_kerja", unit);
    set_exporting(true);
    try {
      const res = await fetch(`/api/alokasi-gaji/rekap/export?${params.toString()}`, {
        headers: {
          authorization: `Bearer ${auth_signal.value.selectedToken || ""}`,
        },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-alokasi-gaji-${bulan || "all"}-${tahun || "all"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      show_alert_snackbar({ message: "Gagal mengekspor rekap alokasi gaji.", severity: "error" });
    } finally {
      set_exporting(false);
    }
  };

  const unit_options = [
    { label: "Semua Unit Kerja", value: "" },
    ...unwrap_list(unit_query.response).map((u: any) => ({
      value: String(u.id),
      label: `${u.kode_unit} — ${u.nama_unit}`,
    })),
  ];

  const columns: Column<any>[] = [
    {
      id: "nama_pegawai",
      label: "Pegawai",
      sortable: true,
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama_pegawai ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{String(row.nip_nik ?? "-")}</Typography>
        </Box>
      ),
    },
    { id: "nama_unit_kerja", label: "Unit Kerja", hideMobile: true, render: (_, row) => String(row.nama_unit_kerja ?? "-") },
    { id: "gaji_bulanan", label: "Gaji", align: "right", render: (_, row) => format_rupiah(row.gaji_bulanan) },
    { id: "alokasi_ro", label: "RO", align: "right", hideMobile: true, render: (_, row) => format_rupiah(row.alokasi_ro) },
    {
      id: "alokasi_operasional",
      label: "Operasional",
      align: "right",
      hideMobile: true,
      render: (_, row) => format_rupiah(row.alokasi_operasional),
    },
    { id: "total_alokasi", label: "Total Alokasi", align: "right", render: (_, row) => format_rupiah(row.total_alokasi) },
    {
      id: "sisa_gaji",
      label: "Sisa",
      align: "right",
      render: (_, row) => (
        <Typography
          sx={{
            fontSize: "0.825rem",
            fontWeight: 600,
            color: (row.sisa_gaji ?? 0) >= 0 ? "var(--foreground)" : "#ef4444",
          }}
        >
          {format_rupiah(row.sisa_gaji)}
        </Typography>
      ),
    },
  ];

  const detail_columns: Column<any>[] = [
    {
      id: "periode",
      label: "Periode",
      render: (_, row) => {
        const label = BULAN_OPTIONS.find((b) => b.value === String(row.periode_bulan))?.label ?? String(row.periode_bulan ?? "-");
        return `${label} ${row.periode_tahun ?? ""}`;
      },
    },
    {
      id: "sumber_dana",
      label: "Sumber",
      render: (_, row) => String(row.sumber_dana ?? "-"),
    },
    {
      id: "nama_ro",
      label: "RO / Operasional",
      render: (_, row) => String(row.nama_ro ?? row.dana_operasional_id ?? "-"),
    },
    { id: "jumlah", label: "Jumlah", align: "right", render: (_, row) => format_rupiah(row.jumlah) },
    { id: "status", label: "Status", render: (_, row) => String(row.status ?? "-") },
  ];

  return (
    <DashboardLayout
      sectionTitle="Transaksi"
      title="Rekap Alokasi Gaji"
      headerTitle="Rekap Alokasi Gaji"
      headerDescription="Rekap alokasi gaji TA per periode beserta sisa gajinya."
      headerAction={
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={{ width: 140 }}>
            <Box
              component="select"
              value={bulan}
              onChange={(e: any) => setBulan(e.target.value)}
              aria-label="Periode bulan"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "0.85rem",
              }}
            >
              <option value="">Semua Bulan</option>
              {BULAN_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Box>
          </Box>
          <Box sx={{ width: 100 }}>
            <Box
              component="select"
              value={tahun}
              onChange={(e: any) => setTahun(e.target.value)}
              aria-label="Periode tahun"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "0.85rem",
              }}
            >
              <option value="">Semua Tahun</option>
              {Array.from({ length: 5 }, (_, i) => {
                const y = String(current_year() - i);
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </Box>
          </Box>
          {show_unit_filter ? (
            <Box sx={{ width: 180 }}>
              <Box
                component="select"
                value={unit}
                onChange={(e: any) => setUnit(e.target.value)}
                aria-label="Unit kerja"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "0.85rem",
                }}
              >
                {unit_options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Box>
            </Box>
          ) : null}
          <SoftButton startIcon={<RefreshOutlined />} onClick={() => rekap_query.call_back()} disabled={rekap_query.is_loading} sx={{ flexShrink: 0 }}>
            Refresh
          </SoftButton>
          <SoftButton startIcon={<DownloadOutlined />} onClick={export_rekap} disabled={exporting || rekap_query.is_loading} sx={{ flexShrink: 0 }}>
            {exporting ? "Mengekspor..." : "Export"}
          </SoftButton>
        </Box>
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {rekap_query.error && !rekap_query.is_loading ? (
          <InfoCard message="Gagal memuat rekap alokasi gaji." variant="error" />
        ) : rekap_query.is_loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <Card sx={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 2 }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <DataTable columns={columns} data={rows} title="Rekap Per Pegawai" onRowClick={setDetail} />
            </CardContent>
          </Card>
        )}
      </Box>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Detail Alokasi — ${detail?.nama_pegawai ?? ""}`}
        description={`Total alokasi: ${format_rupiah(detail?.total_alokasi)} · Sisa gaji: ${format_rupiah(detail?.sisa_gaji)}`}
        maxWidth={720}
        actions={[{ label: "Tutup", variant: "ghost", onClick: () => setDetail(null) }]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <DataTable columns={detail_columns} data={Array.isArray(detail?.detail) ? detail.detail : []} hidePagination title="Daftar Alokasi" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>Dibuat pada {format_date(detail?.created_at)}</Typography>
          </Grid>
        </Grid>
      </Modal>
    </DashboardLayout>
  );
}

export default RekapAlokasiPage;
