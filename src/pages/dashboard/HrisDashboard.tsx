import { useMemo } from "react";
import { Box, Typography, Grid, Card, Divider } from "@mui/material";
import { PeopleOutline, AccountTreeOutlined, WorkOutline, AccountBalanceWalletOutlined, BadgeOutlined, AccountBalanceOutlined } from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts";
import { DataTable, StatusChip, InfoCard } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import { resolve_current_role, current_year, current_month, format_rupiah, BULAN_OPTIONS } from "../../common/hris";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.1 }}>{value}</Typography>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", mt: 0.25 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", mt: 0.1 }}>{sub}</Typography>}
      </Box>
    </Card>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--foreground)", fontSize: "1rem" }}>
          {title}
        </Typography>
        {description && <Typography sx={{ fontSize: "0.825rem", color: "var(--muted-foreground)", mt: 0.25 }}>{description}</Typography>}
      </Box>
      <Divider sx={{ borderColor: "var(--border)", mb: 2.5 }} />
      {children}
    </Box>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const role = resolve_current_role();

  // ── Karyawan: tidak ada dashboard khusus → ke profil ────────────────────
  if (role === "karyawan") {
    return <Navigate to="/profil" replace />;
  }

  return role === "superadmin" ? <SuperadminDashboard /> : <KoordinatorDashboard />;
}

// ─── Superadmin ───────────────────────────────────────────────────────────────

function SuperadminDashboard() {
  const tahun = current_year();

  const dashboard_query = use_query({
    api_tag: "dashboard",
    api_method: "dashboardControllerGetSuperadminDashboard",
    api_query: [{ tahun }, { format: "json" } as any],
  });

  const body: any = dashboard_query.response ?? {};
  const data = body?.data ?? {};

  const budget_rows = useMemo(() => {
    const budgets: any[] = Array.isArray(data?.budget_per_koordinator) ? data.budget_per_koordinator : [];
    const tas: any[] = Array.isArray(data?.jumlah_ta_per_koordinator) ? data.jumlah_ta_per_koordinator : [];
    return budgets.map((b) => ({
      ...b,
      jumlah_ta: tas.find((t) => t.id_unit_koordinator === b.id_unit_koordinator)?.jumlah_ta ?? 0,
    }));
  }, [data?.budget_per_koordinator, data?.jumlah_ta_per_koordinator]);

  const columns: Column<any>[] = [
    { id: "nama_unit", label: "Unit Koordinator", sortable: true, render: (_, row) => <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{row.nama_unit}</Typography> },
    { id: "jumlah_ta", label: "Jumlah TA", align: "right", render: (_, row) => <StatusChip label={`${row.jumlah_ta} TA`} variant="info" size="small" /> },
    { id: "total_plafon", label: "Plafon RO", align: "right", render: (_, row) => <Typography sx={{ fontSize: "0.825rem", color: "var(--foreground)" }}>{format_rupiah(row.total_plafon)}</Typography> },
    { id: "total_terpakai", label: "Terpakai RO", align: "right", render: (_, row) => <Typography sx={{ fontSize: "0.825rem", color: "var(--foreground)" }}>{format_rupiah(row.total_terpakai)}</Typography> },
    { id: "sisa_saldo", label: "Sisa RO", align: "right", render: (_, row) => <StatusChip label={format_rupiah(row.sisa_saldo)} variant={row.sisa_saldo >= 0 ? "success" : "danger"} size="small" /> },
    { id: "total_plafon_operasional", label: "Plafon Operasional", align: "right", render: (_, row) => <Typography sx={{ fontSize: "0.825rem", color: "var(--foreground)" }}>{format_rupiah(row.total_plafon_operasional)}</Typography> },
    { id: "sisa_operasional", label: "Sisa Operasional", align: "right", render: (_, row) => <StatusChip label={format_rupiah(row.sisa_operasional)} variant={row.sisa_operasional >= 0 ? "success" : "danger"} size="small" /> },
  ];

  return (
    <DashboardLayout sectionTitle="HRIS" title="Dashboard" headerTitle={`Dashboard Superadmin — Tahun ${tahun}`} headerDescription="Ringkasan pegawai, unit kerja, dan anggaran seluruh koordinator.">
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {dashboard_query.is_loading && !data?.total_pegawai_aktif ? <InfoCard message="Memuat data dashboard..." variant="loading" /> : null}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: "Pegawai Aktif", value: data?.total_pegawai_aktif ?? 0, sub: "Seluruh unit kerja", icon: <PeopleOutline />, color: "var(--primary)" },
            { label: "Unit Kerja", value: data?.total_unit ?? 0, sub: `${data?.total_koordinator ?? 0} koordinator`, icon: <AccountTreeOutlined />, color: "#3b82f6" },
            { label: "Proyek", value: data?.total_proyek ?? 0, sub: `Fiskal ${tahun}`, icon: <WorkOutline />, color: "#22c55e" },
            { label: "Total RO", value: data?.total_ro ?? 0, sub: `Fiskal ${tahun}`, icon: <AccountBalanceWalletOutlined />, color: "#f59e0b" },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        <Section title="Anggaran per Koordinator" description="Rekap plafon RO, dana operasional, dan jumlah tenaga ahli (TA) per unit koordinator.">
          <DataTable columns={columns} data={budget_rows} searchPlaceholder="Cari unit koordinator..." rowsPerPageOptions={[5, 10, 25]} hidePagination={budget_rows.length <= 5} />
        </Section>
      </Box>
    </DashboardLayout>
  );
}

// ─── Koordinator ──────────────────────────────────────────────────────────────

function KoordinatorDashboard() {
  const dashboard_query = use_query({
    api_tag: "dashboard",
    api_method: "dashboardControllerGetKoordinatorUnitDashboard",
    api_query: [{ format: "json" } as any],
  });

  const body: any = dashboard_query.response ?? {};
  const data = body?.data ?? {};
  const unit = data?.unit ?? {};
  const alokasi = data?.alokasi_bulan_ini ?? {};
  const nama_bulan = BULAN_OPTIONS.find((b) => Number(b.value) === (alokasi.periode_bulan ?? current_month()))?.label ?? "-";

  const ro_rows: any[] = Array.isArray(data?.ro_breakdown) ? data.ro_breakdown : [];
  const operasional_rows: any[] = Array.isArray(data?.operasional_breakdown) ? data.operasional_breakdown : [];

  const ro_columns: Column<any>[] = [
    { id: "kode_ro", label: "Kode RO", render: (_, row) => <Typography sx={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--foreground)" }}>{row.kode_ro}</Typography> },
    { id: "nama_ro", label: "Nama RO" },
    { id: "nama_proyek", label: "Proyek", render: (_, row) => row.nama_proyek ?? "-" },
    { id: "total_plafon", label: "Plafon", align: "right", render: (_, row) => format_rupiah(row.total_plafon) },
    { id: "total_terpakai", label: "Terpakai", align: "right", render: (_, row) => format_rupiah(row.total_terpakai) },
    { id: "sisa_saldo", label: "Sisa", align: "right", render: (_, row) => <StatusChip label={format_rupiah(row.sisa_saldo)} variant={row.sisa_saldo >= 0 ? "success" : "danger"} size="small" /> },
  ];

  const operasional_columns: Column<any>[] = [
    { id: "tahun_fiscal", label: "Tahun Fiscal" },
    { id: "total_plafon", label: "Plafon", align: "right", render: (_, row) => format_rupiah(row.total_plafon) },
    { id: "total_terpakai", label: "Terpakai", align: "right", render: (_, row) => format_rupiah(row.total_terpakai) },
    { id: "sisa_saldo", label: "Sisa", align: "right", render: (_, row) => <StatusChip label={format_rupiah(row.sisa_saldo)} variant={row.sisa_saldo >= 0 ? "success" : "danger"} size="small" /> },
  ];

  return (
    <DashboardLayout sectionTitle="HRIS" title="Dashboard" headerTitle={unit.nama_unit ? `Dashboard ${unit.nama_unit}` : "Dashboard Koordinator"} headerDescription="Ringkasan unit kerja yang Anda kelola.">
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {dashboard_query.is_loading && data?.jumlah_pegawai_aktif === undefined ? <InfoCard message="Memuat dashboard unit Anda..." variant="loading" /> : null}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: "Pegawai Aktif", value: data?.jumlah_pegawai_aktif ?? 0, sub: "Dalam lingkup unit", icon: <PeopleOutline />, color: "var(--primary)" },
            { label: "Tenaga Ahli", value: data?.jumlah_ta ?? 0, sub: "Pegawai tipe TA", icon: <BadgeOutlined />, color: "#22c55e" },
            { label: "Sub Unit", value: data?.jumlah_sub_unit ?? 0, sub: "Di bawah koordinator", icon: <AccountTreeOutlined />, color: "#3b82f6" },
            { label: `Alokasi ${nama_bulan}`, value: format_rupiah(alokasi.total_jumlah ?? 0), sub: `${alokasi.jumlah_alokasi ?? 0} alokasi bulan berjalan`, icon: <AccountBalanceOutlined />, color: "#f59e0b" },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        <Section title="RO dalam lingkup unit" description="Daftar RO beserta plafon, pemakaian, dan sisa saldo.">
          <DataTable columns={ro_columns} data={ro_rows} searchPlaceholder="Cari RO..." rowsPerPageOptions={[5, 10]} hidePagination={ro_rows.length <= 5} />
        </Section>

        <Section title="Dana Operasional" description="Plafon dana operasional unit koordinator.">
          <DataTable columns={operasional_columns} data={operasional_rows} hideSearch hidePagination />
        </Section>
      </Box>
    </DashboardLayout>
  );
}

export default DashboardPage;
