import { useState } from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { DownloadOutlined, RefreshOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { InfoCard, Modal, SoftButton, TableSkeleton, DataTable, SearchableSelect, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { show_alert_snackbar } from "@Signal/use-signal/snackbar_signal";
import { resolve_current_role, current_year, current_month, format_rupiah, format_date, BULAN_OPTIONS, unwrap_list } from "../../common/hris";

const TAHUN_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = String(current_year() - i);
  return { label: y, value: y };
});

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
    should_running_if: show_unit_filter,
  });

  const rows: any[] = unwrap_list(rekap_query.response);

  const unit_options = [
    { label: "Semua Unit Kerja", value: "" },
    ...unwrap_list(unit_query.response).map((u: any) => ({
      value: String(u.id),
      label: `${u.kode_unit} — ${u.nama_unit}`,
    })),
  ];

  const export_rekap = async () => {
    const params = new URLSearchParams();
    if (Number(bulan)) params.set("periode_bulan", String(Number(bulan)));
    if (Number(tahun)) params.set("periode_tahun", String(Number(tahun)));
    if (unit) params.set("id_unit_kerja", unit);
    set_exporting(true);
    try {
      const res = await fetch(`/api/alokasi-gaji/rekap/export?${params.toString()}`, {
        headers: { authorization: `Bearer ${auth_signal.value.selectedToken || ""}` },
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

  // Summary stats dari rows
  const total_gaji = rows.reduce((s, r) => s + (r.gaji_bulanan ?? 0), 0);
  const total_alokasi = rows.reduce((s, r) => s + (r.total_alokasi ?? 0), 0);
  const total_sisa = rows.reduce((s, r) => s + (r.sisa_gaji ?? 0), 0);
  const sudah_dialokasi = rows.filter((r) => (r.total_alokasi ?? 0) > 0).length;

  const columns: Column<any>[] = [
    {
      id: "no",
      label: "No",
      width: 50,
      render: (_: any, _row: any, idx?: number) => String((idx ?? 0) + 1),
    },
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
    {
      id: "nama_unit_kerja",
      label: "Unit Kerja",
      hideMobile: true,
      render: (_, row) => (
        <Typography sx={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>{String(row.nama_unit_kerja ?? "-")}</Typography>
      ),
    },
    {
      id: "gaji_bulanan",
      label: "Gaji Pokok",
      align: "right",
      render: (_, row) => (
        <Typography sx={{ fontSize: "0.82rem" }}>{format_rupiah(row.gaji_bulanan)}</Typography>
      ),
    },
    {
      id: "total_alokasi",
      label: "Total Alokasi",
      align: "right",
      render: (_, row) => (
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{format_rupiah(row.total_alokasi)}</Typography>
      ),
    },
    {
      id: "sisa_gaji",
      label: "Sisa",
      align: "right",
      render: (_, row) => (
        <Typography
          sx={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: (row.sisa_gaji ?? 0) < 0 ? "#ef4444" : (row.sisa_gaji ?? 0) === 0 ? "#22c55e" : "var(--foreground)",
          }}
        >
          {format_rupiah(row.sisa_gaji)}
        </Typography>
      ),
    },
    {
      id: "status_alokasi",
      label: "Status",
      align: "center",
      render: (_, row) => {
        const pct = row.gaji_bulanan > 0 ? ((row.total_alokasi ?? 0) / row.gaji_bulanan) * 100 : 0;
        const label = pct >= 100 ? "Penuh" : pct > 0 ? "Sebagian" : "Belum";
        const variant: "success" | "warning" | "danger" = pct >= 100 ? "success" : pct > 0 ? "warning" : "danger";
        return <StatusChip label={label} variant={variant} size="small" />;
      },
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
      render: (_, row) => <StatusChip label={String(row.sumber_dana ?? "-")} variant={row.sumber_dana === "RO" ? "info" : "warning"} size="small" />,
    },
    {
      id: "nama_ro",
      label: "RO / Operasional",
      render: (_, row) => (
        <Typography sx={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>{String(row.nama_ro ?? "-")}</Typography>
      ),
    },
    {
      id: "jumlah",
      label: "Jumlah",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{format_rupiah(row.jumlah)}</Typography>,
    },
    {
      id: "status",
      label: "Status",
      render: (_, row) => <StatusChip label={String(row.status ?? "-")} variant={row.status === "AKTIF" ? "success" : "danger"} size="small" />,
    },
  ];

  return (
    <DashboardLayout
      sectionTitle="Transaksi"
      title="Rekap Alokasi Gaji"
      headerTitle="Rekap Alokasi Gaji"
      headerDescription="Rekap alokasi gaji TA per periode beserta sisa gajinya."
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {/* Filter bar */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "flex-end",
            mb: 2.5,
            pb: 2.5,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Box sx={{ width: 160 }}>
            <SearchableSelect
              label="Bulan"
              value={bulan}
              options={[{ label: "Semua Bulan", value: "" }, ...BULAN_OPTIONS]}
              onChange={(v) => setBulan(v)}
            />
          </Box>
          <Box sx={{ width: 120 }}>
            <SearchableSelect
              label="Tahun"
              value={tahun}
              options={[{ label: "Semua Tahun", value: "" }, ...TAHUN_OPTIONS]}
              onChange={(v) => setTahun(v)}
            />
          </Box>
          {show_unit_filter && (
            <Box sx={{ width: 240 }}>
              <SearchableSelect
                label="Unit Kerja"
                value={unit}
                options={unit_options}
                onChange={(v) => setUnit(v)}
                loading={unit_query.is_loading}
              />
            </Box>
          )}
          <SoftButton startIcon={<RefreshOutlined />} onClick={() => rekap_query.call_back()} disabled={rekap_query.is_loading}>
            Refresh
          </SoftButton>
          <SoftButton startIcon={<DownloadOutlined />} onClick={export_rekap} disabled={exporting || rekap_query.is_loading}>
            {exporting ? "Mengekspor..." : "Export Excel"}
          </SoftButton>
        </Box>

        {/* Summary cards */}
        {!rekap_query.is_loading && rows.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {[
              { label: "Total Pegawai TA", value: String(rows.length), sub: `${sudah_dialokasi} sudah dialokasi` },
              { label: "Total Gaji Pokok", value: format_rupiah(total_gaji), sub: "seluruh TA aktif" },
              { label: "Total Dialokasi", value: format_rupiah(total_alokasi), sub: "periode ini" },
              { label: "Total Sisa", value: format_rupiah(total_sisa), sub: "belum teralokasi", highlight: total_sisa < 0 },
            ].map((s) => (
              <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
                <Box
                  sx={{
                    border: "1px solid var(--border)",
                    borderRadius: 2,
                    p: 2,
                    background: "var(--card)",
                  }}
                >
                  <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mb: 0.5 }}>{s.label}</Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: s.highlight ? "#ef4444" : "var(--foreground)" }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)", mt: 0.25 }}>{s.sub}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Main table */}
        {rekap_query.error && !rekap_query.is_loading ? (
          <InfoCard message="Gagal memuat rekap alokasi gaji." variant="error" />
        ) : rekap_query.is_loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : rows.length === 0 ? (
          <InfoCard message="Belum ada data TA aktif untuk periode ini." variant="info" />
        ) : (
          <Box sx={{ border: "1px solid var(--border)", borderRadius: 2, background: "var(--card)", overflow: "hidden" }}>
            <DataTable
              columns={columns}
              data={rows}
              title={`Rekap Per Pegawai${bulan && tahun ? ` — ${BULAN_OPTIONS.find((b) => b.value === bulan)?.label ?? bulan} ${tahun}` : ""}`}
              onRowClick={setDetail}
            />
          </Box>
        )}
      </Box>

      {/* Detail modal */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.nama_pegawai ?? "Detail Alokasi"}
        description={detail?.nama_unit_kerja ?? ""}
        maxWidth={680}
        actions={[{ label: "Tutup", variant: "ghost", onClick: () => setDetail(null) }]}
      >
        {detail && (
          <Box>
            {/* Summary row */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {[
                { label: "Gaji Pokok", value: format_rupiah(detail.gaji_bulanan) },
                { label: "Total Alokasi", value: format_rupiah(detail.total_alokasi) },
                { label: "Sisa Gaji", value: format_rupiah(detail.sisa_gaji), red: (detail.sisa_gaji ?? 0) < 0 },
              ].map((s) => (
                <Grid key={s.label} size={{ xs: 4 }}>
                  <Box sx={{ border: "1px solid var(--border)", borderRadius: 1.5, p: 1.5, background: "var(--background)" }}>
                    <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: s.red ? "#ef4444" : "var(--foreground)" }}>{s.value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {/* Detail alokasi table */}
            {Array.isArray(detail.detail) && detail.detail.length > 0 ? (
              <DataTable columns={detail_columns} data={detail.detail} hidePagination title="Daftar Alokasi" />
            ) : (
              <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", py: 2, textAlign: "center" }}>
                Belum ada alokasi untuk periode ini.
              </Typography>
            )}

            {detail.created_at && (
              <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)", mt: 1.5 }}>
                Data terakhir diperbarui: {format_date(detail.updated_at ?? detail.created_at)}
              </Typography>
            )}
          </Box>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default RekapAlokasiPage;
