import { useMemo } from "react";
import { Box, Typography, Grid, Card, Divider, Stack, Tooltip as MuiTooltip } from "@mui/material";
import { PeopleOutline, AccountTreeOutlined, WorkOutline, AccountBalanceWalletOutlined, BadgeOutlined, AccountBalanceOutlined, WarningAmberOutlined, TrendingUpOutlined, GroupsOutlined } from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, LabelList } from "recharts";
import { DashboardLayout } from "../../layouts";
import { DataTable, StatusChip, InfoCard } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import { resolve_current_role, current_year, current_month, format_rupiah, format_date, BULAN_OPTIONS } from "../../common/hris";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  primary: "#4f7cff",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  slate: "#64748b",
  rose: "#f43f5e",
  teal: "#14b8a6",
  orange: "#f97316",
};

const TIPE_COLOR: Record<string, string> = {
  PNS: C.primary,
  ASN: C.cyan,
  OUTSOURCING: C.amber,
  TA: C.green,
};

const TIPE_LABEL: Record<string, string> = {
  PNS: "PNS",
  ASN: "ASN",
  OUTSOURCING: "Outsourcing",
  TA: "Tenaga Ahli",
};

const KOORDINATOR_COLORS = [C.primary, C.green, C.amber, C.violet, C.cyan, C.rose, C.teal, C.orange];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rb = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
};

// ─── Shared Components ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ label, value, sub, icon, color, trend }: StatCardProps) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        height: "100%",
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
          backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
          color,
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.15,
            wordBreak: "break-word",
            // Turunkan ukuran jika value berupa string rupiah panjang
            ...(typeof value === "string" && value.length > 10 ? { fontSize: "1.05rem" } : {}),
          }}
        >
          {value}
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", mt: 0.35 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: "0.74rem", color: "var(--muted-foreground)", mt: 0.2 }}>{sub}</Typography>}
        {trend && <Typography sx={{ fontSize: "0.72rem", color: C.green, mt: 0.3, fontWeight: 600 }}>{trend}</Typography>}
      </Box>
    </Card>
  );
}

function ChartCard({ title, description, children, minH = 280, action }: { title: string; description?: string; children: React.ReactNode; minH?: number; action?: React.ReactNode }) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--foreground)" }}>{title}</Typography>
          {description && <Typography sx={{ fontSize: "0.76rem", color: "var(--muted-foreground)", mt: 0.2 }}>{description}</Typography>}
        </Box>
        {action}
      </Box>
      <Divider sx={{ borderColor: "var(--border)", my: 1.5 }} />
      <Box sx={{ minHeight: minH }}>{children}</Box>
    </Card>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--foreground)", fontSize: "1rem" }}>
          {title}
        </Typography>
        {description && <Typography sx={{ fontSize: "0.825rem", color: "var(--muted-foreground)", mt: 0.2 }}>{description}</Typography>}
      </Box>
      <Divider sx={{ borderColor: "var(--border)", mb: 2.5 }} />
      {children}
    </Box>
  );
}

// Custom Recharts tooltip wrapper
function RpTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        p: 1.5,
        fontSize: "0.8rem",
        color: "var(--foreground)",
        boxShadow: "0 4px 16px rgba(0,0,0,.12)",
        minWidth: 160,
      }}
    >
      {label && <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}>{label}</Typography>}
      {payload.map((p: any, i: number) => (
        <Box key={i} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: p.color ?? p.fill }} />
            <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{p.name}</Typography>
          </Box>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{typeof p.value === "number" && p.value > 100_000 ? format_rupiah(p.value) : p.value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const role = resolve_current_role();
  if (role === "karyawan") return <Navigate to="/profil" replace />;
  if (role === "superadmin" || role === "keuangan") return <SuperadminDashboard />;
  return <KoordinatorDashboard />;
}

// ─── SUPERADMIN DASHBOARD ─────────────────────────────────────────────────────

function SuperadminDashboard() {
  const tahun = current_year();

  const dashboard_q = use_query({
    api_tag: "dashboard",
    api_method: "dashboardControllerGetSuperadminDashboard",
    api_query: [{ tahun }, { format: "json" } as any],
  });

  const expiring_q = use_query({
    api_tag: "dashboard",
    api_method: "dashboardControllerGetSkExpiringSoon",
    api_query: [{ format: "json" } as any],
  });

  const body: any = dashboard_q.response ?? {};
  const data = body?.data ?? {};

  // ── Derived data ────────────────────────────────────────────────────────────

  const pieData: { name: string; value: number; color: string }[] = useMemo(
    () =>
      (data?.pegawai_per_tipe ?? []).map((p: any) => ({
        name: TIPE_LABEL[p.tipe] ?? p.tipe,
        value: p.jumlah,
        color: TIPE_COLOR[p.tipe] ?? C.slate,
      })),
    [data?.pegawai_per_tipe],
  );

  const budgetChartData = useMemo(() => {
    return (data?.budget_per_koordinator ?? []).map((b: any, idx: number) => ({
      nama: b.nama_unit.replace(/Koordinator\s*/i, "Koor. ").substring(0, 20),
      nama_full: b.nama_unit,
      "RO Terpakai": b.total_terpakai,
      "RO Sisa": Math.max(0, b.sisa_saldo),
      "Op. Terpakai": b.terpakai_operasional,
      "Op. Sisa": Math.max(0, b.sisa_operasional),
      jumlah_ta: b.jumlah_ta,
      _color: KOORDINATOR_COLORS[idx % KOORDINATOR_COLORS.length],
    }));
  }, [data?.budget_per_koordinator]);

  const taBarData = useMemo(
    () =>
      (data?.jumlah_ta_per_koordinator ?? []).map((t: any, idx: number) => ({
        nama: t.nama_unit.replace(/Koordinator\s*/i, "Koor. ").substring(0, 18),
        nama_full: t.nama_unit,
        "Jumlah TA": t.jumlah_ta,
        _color: KOORDINATOR_COLORS[idx % KOORDINATOR_COLORS.length],
      })),
    [data?.jumlah_ta_per_koordinator],
  );

  const monthlyTrend: any[] = data?.monthly_trend ?? [];

  // ── SK Expiring ─────────────────────────────────────────────────────────────
  const expBody: any = expiring_q.response ?? {};
  const expData = expBody?.data ?? {};
  const skExpList: any[] = Array.isArray(expData?.sk_list) ? expData.sk_list : [];

  const skExpColumns: Column<any>[] = [
    {
      id: "pegawai",
      label: "Pegawai",
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--foreground)" }}>{row.pegawai?.nama}</Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
            {row.pegawai?.tipe_pegawai} · {row.pegawai?.nip_nik}
          </Typography>
        </Box>
      ),
    },
    {
      id: "unit_kerja",
      label: "Unit",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem", color: "var(--foreground)" }}>{row.unit_kerja?.nama_unit ?? "-"}</Typography>,
    },
    {
      id: "nomor_sk",
      label: "No. SK",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem", fontFamily: "monospace", color: "var(--foreground)" }}>{row.nomor_sk}</Typography>,
    },
    {
      id: "tanggal_selesai",
      label: "Berakhir",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem", color: "var(--foreground)" }}>{format_date(row.tanggal_selesai)}</Typography>,
    },
    {
      id: "sisa_hari",
      label: "Sisa",
      align: "right",
      render: (_, row) => <StatusChip label={`${row.sisa_hari} hari`} variant={row.sisa_hari <= 7 ? "danger" : row.sisa_hari <= 14 ? "warning" : "info"} size="small" />,
    },
  ];

  const budgetTableColumns: Column<any>[] = [
    {
      id: "nama_unit",
      label: "Unit Koordinator",
      sortable: true,
      render: (_, row) => <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{row.nama_unit}</Typography>,
    },
    {
      id: "jumlah_ta",
      label: "TA",
      align: "right",
      render: (_, row) => <StatusChip label={`${row.jumlah_ta} TA`} variant="info" size="small" />,
    },
    {
      id: "total_plafon",
      label: "Plafon RO",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem" }}>{format_rupiah(row.total_plafon)}</Typography>,
    },
    {
      id: "total_terpakai",
      label: "Terpakai RO",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem" }}>{format_rupiah(row.total_terpakai)}</Typography>,
    },
    {
      id: "sisa_saldo",
      label: "Sisa RO",
      align: "right",
      render: (_, row) => <StatusChip label={format_rupiah(row.sisa_saldo)} variant={row.sisa_saldo >= 0 ? "success" : "danger"} size="small" />,
    },
    {
      id: "total_plafon_operasional",
      label: "Plafon Op.",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem" }}>{format_rupiah(row.total_plafon_operasional)}</Typography>,
    },
    {
      id: "sisa_operasional",
      label: "Sisa Op.",
      align: "right",
      render: (_, row) => <StatusChip label={format_rupiah(row.sisa_operasional)} variant={row.sisa_operasional >= 0 ? "success" : "danger"} size="small" />,
    },
  ];

  const totalAlokasi = useMemo(() => monthlyTrend.reduce((s: number, m: any) => s + (m.total_jumlah ?? 0), 0), [monthlyTrend]);

  return (
    <DashboardLayout sectionTitle="HRIS" title="Dashboard" headerTitle={`Dashboard Superadmin — ${tahun}`} headerDescription="Ringkasan pegawai, unit kerja, anggaran, dan tren alokasi gaji seluruh koordinator.">
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {dashboard_q.is_loading && !data?.total_pegawai_aktif ? <InfoCard message="Memuat data dashboard..." variant="loading" /> : null}

        {/* ── Stat cards ── */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            {
              label: "Pegawai Aktif",
              value: data?.total_pegawai_aktif ?? 0,
              sub: "Seluruh unit kerja",
              icon: <PeopleOutline />,
              color: C.primary,
            },
            {
              label: "Unit Kerja",
              value: data?.total_unit ?? 0,
              sub: `${data?.total_koordinator ?? 0} koordinator`,
              icon: <AccountTreeOutlined />,
              color: C.cyan,
            },
            {
              label: "Proyek",
              value: data?.total_proyek ?? 0,
              sub: `Fiskal ${tahun}`,
              icon: <WorkOutline />,
              color: C.green,
            },
            {
              label: "Total RO",
              value: data?.total_ro ?? 0,
              sub: `Fiskal ${tahun}`,
              icon: <AccountBalanceWalletOutlined />,
              color: C.amber,
            },
            {
              label: "Total Alokasi Gaji",
              value: rb(totalAlokasi),
              sub: `Tahun ${tahun}`,
              icon: <TrendingUpOutlined />,
              color: C.violet,
            },
            {
              label: "SK Hampir Berakhir",
              value: expData?.total ?? 0,
              sub: "Dalam 30 hari ke depan",
              icon: <WarningAmberOutlined />,
              color: expData?.total > 0 ? C.red : C.slate,
            },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 4 }}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* ── Row 1: Pie + Bar TA per Koordinator ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Donut: Komposisi Pegawai */}
          <Grid size={{ xs: 12, md: 5 }}>
            <ChartCard title="Komposisi Pegawai" description="Distribusi tipe pegawai aktif di seluruh unit" minH={260}>
              {pieData.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
                  <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>Belum ada data</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: 2, height: 260 }}>
                  <ResponsiveContainer width="60%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<RpTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ flex: 1 }}>
                    {pieData.map((d) => (
                      <Box key={d.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: "0.8rem", color: "var(--foreground)" }}>{d.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)", ml: 1 }}>{d.value}</Typography>
                      </Box>
                    ))}
                    <Divider sx={{ borderColor: "var(--border)", my: 1 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Total</Typography>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>{pieData.reduce((s, d) => s + d.value, 0)}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* Bar: TA per Koordinator */}
          <Grid size={{ xs: 12, md: 7 }}>
            <ChartCard title="Tenaga Ahli per Koordinator" description="Jumlah TA aktif yang bernaung di setiap unit koordinator" minH={260}>
              {taBarData.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
                  <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>Belum ada data</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={taBarData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0].payload;
                        return (
                          <Box sx={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", p: 1.5 }}>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.5 }}>{row.nama_full}</Typography>
                            <Typography sx={{ fontSize: "0.82rem" }}>
                              <b>{row["Jumlah TA"]}</b> Tenaga Ahli aktif
                            </Typography>
                          </Box>
                        );
                      }}
                    />
                    <Bar dataKey="Jumlah TA" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {taBarData.map((entry: { _color: string }, i: number) => (
                        <Cell key={i} fill={entry._color} />
                      ))}
                      <LabelList dataKey="Jumlah TA" position="top" style={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── Row 2: Stacked bar budget + line trend ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Stacked bar: Budget RO per koordinator */}
          <Grid size={{ xs: 12, md: 7 }}>
            <ChartCard title="Utilisasi Anggaran RO per Koordinator" description={`Perbandingan dana terpakai vs sisa saldo RO — Fiskal ${tahun}`} minH={300}>
              {budgetChartData.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
                  <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>Belum ada data</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetChartData} margin={{ top: 8, right: 16, left: 8, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tickFormatter={rb} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload;
                        return (
                          <Box sx={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", p: 1.5, minWidth: 200 }}>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.5 }}>{row.nama_full}</Typography>
                            {payload.map((p: any, i: number) => (
                              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.25 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: 1, background: p.fill }} />
                                  <Typography sx={{ fontSize: "0.76rem", color: "var(--muted-foreground)" }}>{p.name}</Typography>
                                </Box>
                                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{format_rupiah(p.value)}</Typography>
                              </Box>
                            ))}
                          </Box>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="RO Terpakai" stackId="ro" fill={C.red} radius={[0, 0, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="RO Sisa" stackId="ro" fill={C.green} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Grid>

          {/* Area chart: Monthly trend */}
          <Grid size={{ xs: 12, md: 5 }}>
            <ChartCard title="Tren Alokasi Gaji Bulanan" description={`Total alokasi gaji TA yang dibayarkan per bulan — ${tahun}`} minH={300}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradAlokasi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.violet} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tickFormatter={rb} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <Box sx={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", p: 1.5 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}>{label}</Typography>
                          <Typography sx={{ fontSize: "0.78rem" }}>
                            Alokasi: <b>{format_rupiah(payload[0]?.value as number)}</b>
                          </Typography>
                          <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{payload[0]?.payload?.jumlah_alokasi ?? 0} entri alokasi</Typography>
                        </Box>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="total_jumlah" name="Total Alokasi" stroke={C.violet} strokeWidth={2.5} fill="url(#gradAlokasi)" dot={{ r: 3.5, fill: C.violet, stroke: "var(--card)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── Row 3: Utilisasi Operasional per koordinator ── */}
        {budgetChartData.length > 0 && (
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={12}>
              <ChartCard title="Utilisasi Dana Operasional per Koordinator" description={`Perbandingan dana operasional terpakai vs sisa — Fiskal ${tahun}`} minH={240}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={budgetChartData} layout="vertical" margin={{ top: 4, right: 60, left: 120, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tickFormatter={rb} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis type="category" dataKey="nama_full" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={115} />
                    <Tooltip content={<RpTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Op. Terpakai" stackId="op" fill={C.amber} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Op. Sisa" stackId="op" fill={C.teal} radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="Op. Sisa" position="right" formatter={(v: number) => rb(v)} style={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        )}

        {/* ── SK Expiring Soon ── */}
        <Section title={`⚠️ SK Hampir Berakhir (${skExpList.length})`} description="SK aktif yang berakhir dalam 30 hari ke depan. Segera tindaklanjuti perpanjangan.">
          {expiring_q.is_loading ? (
            <InfoCard message="Memuat data SK..." variant="loading" />
          ) : skExpList.length === 0 ? (
            <InfoCard message="Tidak ada SK yang berakhir dalam 30 hari ke depan." variant="info" />
          ) : (
            <DataTable columns={skExpColumns} data={skExpList} searchPlaceholder="Cari pegawai / SK..." rowsPerPageOptions={[5, 10, 25]} hidePagination={skExpList.length <= 5} />
          )}
        </Section>

        {/* ── Budget table ── */}
        <Section title="Rekap Anggaran per Koordinator" description="Detail plafon, pemakaian, dan sisa saldo RO & dana operasional seluruh koordinator.">
          <DataTable columns={budgetTableColumns} data={data?.budget_per_koordinator ?? []} searchPlaceholder="Cari unit koordinator..." rowsPerPageOptions={[5, 10, 25]} hidePagination={(data?.budget_per_koordinator ?? []).length <= 5} />
        </Section>
      </Box>
    </DashboardLayout>
  );
}

// ─── KOORDINATOR DASHBOARD ────────────────────────────────────────────────────

function KoordinatorDashboard() {
  const tahun = current_year();

  const dashboard_q = use_query({
    api_tag: "dashboard",
    api_method: "dashboardControllerGetKoordinatorUnitDashboard",
    api_query: [{ tahun }, { format: "json" } as any],
  });

  const body: any = dashboard_q.response ?? {};
  const data = body?.data ?? {};
  const unit = data?.unit ?? {};
  const alokasi = data?.alokasi_bulan_ini ?? {};
  const nama_bulan = BULAN_OPTIONS.find((b) => Number(b.value) === (alokasi.periode_bulan ?? current_month()))?.label ?? "-";

  const ro_rows: any[] = Array.isArray(data?.ro_breakdown) ? data.ro_breakdown : [];
  const op_rows: any[] = Array.isArray(data?.operasional_breakdown) ? data.operasional_breakdown : [];
  const monthly_trend: any[] = Array.isArray(data?.monthly_trend) ? data.monthly_trend : [];
  const ta_list: any[] = Array.isArray(data?.ta_list) ? data.ta_list : [];

  // ── Derived chart data ────────────────────────────────────────────────────

  // Horizontal bar: RO usage
  const roChartData = useMemo(
    () =>
      ro_rows.map((r) => ({
        nama: r.kode_ro,
        nama_full: `${r.kode_ro} — ${r.nama_ro}`,
        Terpakai: r.total_terpakai,
        Sisa: Math.max(0, r.sisa_saldo),
        pct: r.pct_terpakai ?? 0,
      })),
    [ro_rows],
  );

  // Donut: komposisi dana (RO vs Operasional)
  const totalRoPlafon = ro_rows.reduce((s, r) => s + r.total_plafon, 0);
  const totalOpPlafon = op_rows.reduce((s, r) => s + r.total_plafon, 0);
  const totalRoTerpakai = ro_rows.reduce((s, r) => s + r.total_terpakai, 0);
  const totalOpTerpakai = op_rows.reduce((s, r) => s + r.total_terpakai, 0);

  const danaDonutData = [
    { name: "RO Terpakai", value: totalRoTerpakai, color: C.red },
    { name: "RO Sisa", value: Math.max(0, totalRoPlafon - totalRoTerpakai), color: C.green },
    { name: "Op. Terpakai", value: totalOpTerpakai, color: C.amber },
    { name: "Op. Sisa", value: Math.max(0, totalOpPlafon - totalOpTerpakai), color: C.teal },
  ].filter((d) => d.value > 0);

  // Total alokasi tahun berjalan
  const totalAlokasiTahun = useMemo(() => monthly_trend.reduce((s, m) => s + (m.total_jumlah ?? 0), 0), [monthly_trend]);

  // ── TA table columns ─────────────────────────────────────────────────────

  const taColumns: Column<any>[] = [
    {
      id: "nama",
      label: "Nama TA",
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--foreground)" }}>{row.nama}</Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{row.bidang_keahlian ?? "-"}</Typography>
        </Box>
      ),
    },
    {
      id: "nama_unit",
      label: "Sub Unit",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem", color: "var(--foreground)" }}>{row.nama_unit ?? "-"}</Typography>,
    },
    {
      id: "gaji_bulanan",
      label: "Gaji / Bulan",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem" }}>{format_rupiah(row.gaji_bulanan)}</Typography>,
    },
    {
      id: "total_alokasi_bulan_ini",
      label: `Alokasi ${nama_bulan}`,
      align: "right",
      render: (_, row) => <StatusChip label={format_rupiah(row.total_alokasi_bulan_ini)} variant={row.total_alokasi_bulan_ini > 0 ? "success" : "neutral"} size="small" />,
    },
    {
      id: "kontrak_selesai",
      label: "Kontrak Berakhir",
      align: "right",
      render: (_, row) => {
        if (!row.kontrak_selesai) return <Typography sx={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>-</Typography>;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(row.kontrak_selesai);
        const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <MuiTooltip title={`${diffDays} hari lagi`} placement="left">
            <Box>
              <Typography sx={{ fontSize: "0.82rem", color: diffDays <= 30 ? C.red : "var(--foreground)" }}>{format_date(row.kontrak_selesai)}</Typography>
            </Box>
          </MuiTooltip>
        );
      },
    },
  ];

  const roTableColumns: Column<any>[] = [
    {
      id: "kode_ro",
      label: "Kode RO",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, fontFamily: "monospace", color: "var(--foreground)" }}>{row.kode_ro}</Typography>,
    },
    { id: "nama_ro", label: "Nama RO" },
    {
      id: "nama_proyek",
      label: "Proyek",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem" }}>{row.nama_proyek ?? "-"}</Typography>,
    },
    {
      id: "total_plafon",
      label: "Plafon",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem" }}>{format_rupiah(row.total_plafon)}</Typography>,
    },
    {
      id: "total_terpakai",
      label: "Terpakai",
      align: "right",
      render: (_, row) => <Typography sx={{ fontSize: "0.82rem" }}>{format_rupiah(row.total_terpakai)}</Typography>,
    },
    {
      id: "pct_terpakai",
      label: "Utilisasi",
      align: "right",
      render: (_, row) => <StatusChip label={`${row.pct_terpakai ?? 0}%`} variant={row.pct_terpakai >= 90 ? "danger" : row.pct_terpakai >= 70 ? "warning" : "success"} size="small" />,
    },
    {
      id: "sisa_saldo",
      label: "Sisa",
      align: "right",
      render: (_, row) => <StatusChip label={format_rupiah(row.sisa_saldo)} variant={row.sisa_saldo >= 0 ? "success" : "danger"} size="small" />,
    },
  ];

  return (
    <DashboardLayout sectionTitle="HRIS" title="Dashboard" headerTitle={unit.nama_unit ? `Dashboard ${unit.nama_unit}` : "Dashboard Koordinator"} headerDescription="Ringkasan pegawai, anggaran, dan tren alokasi gaji unit yang Anda kelola.">
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {dashboard_q.is_loading && data?.jumlah_pegawai_aktif === undefined ? <InfoCard message="Memuat dashboard unit Anda..." variant="loading" /> : null}

        {/* ── Stat cards ── */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            {
              label: "Pegawai Aktif",
              value: data?.jumlah_pegawai_aktif ?? 0,
              sub: "Dalam lingkup unit",
              icon: <PeopleOutline />,
              color: C.primary,
            },
            {
              label: "Tenaga Ahli",
              value: data?.jumlah_ta ?? 0,
              sub: "Pegawai tipe TA",
              icon: <BadgeOutlined />,
              color: C.green,
            },
            {
              label: "Sub Unit",
              value: data?.jumlah_sub_unit ?? 0,
              sub: "Di bawah koordinator",
              icon: <AccountTreeOutlined />,
              color: C.cyan,
            },
            {
              label: `Alokasi ${nama_bulan}`,
              value: format_rupiah(alokasi.total_jumlah ?? 0),
              sub: `${alokasi.jumlah_alokasi ?? 0} entri alokasi`,
              icon: <AccountBalanceOutlined />,
              color: C.amber,
            },
            {
              label: "Total Alokasi Tahun",
              value: rb(totalAlokasiTahun),
              sub: `Kumulatif ${tahun}`,
              icon: <TrendingUpOutlined />,
              color: C.violet,
            },
            {
              label: "Jumlah RO",
              value: ro_rows.length,
              sub: `Fiskal ${tahun}`,
              icon: <GroupsOutlined />,
              color: C.rose,
            },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 4 }}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* ── Row 1: RO Bar + Dana Donut ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Horizontal bar: RO usage */}
          <Grid size={{ xs: 12, md: 7 }}>
            <ChartCard title="Utilisasi RO" description="Perbandingan dana RO terpakai vs sisa per Research Operation" minH={roChartData.length > 0 ? Math.max(220, roChartData.length * 44) : 220}>
              {roChartData.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
                  <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>Belum ada RO untuk tahun {tahun}</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(220, roChartData.length * 44)}>
                  <BarChart data={roChartData} layout="vertical" margin={{ top: 4, right: 60, left: 64, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tickFormatter={rb} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis type="category" dataKey="nama" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={60} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload;
                        return (
                          <Box sx={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", p: 1.5, minWidth: 200 }}>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.5 }}>{row.nama_full}</Typography>
                            <Typography sx={{ fontSize: "0.78rem", mb: 0.25 }}>
                              Terpakai: <b>{format_rupiah(row.Terpakai)}</b>
                            </Typography>
                            <Typography sx={{ fontSize: "0.78rem" }}>
                              Sisa: <b>{format_rupiah(row.Sisa)}</b>
                            </Typography>
                            <Typography sx={{ fontSize: "0.76rem", color: "var(--muted-foreground)", mt: 0.5 }}>Utilisasi: {row.pct}%</Typography>
                          </Box>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Terpakai" stackId="ro" fill={C.red} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Sisa" stackId="ro" fill={C.green} radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="Sisa" position="right" formatter={(v: number) => rb(v)} style={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Grid>

          {/* Donut: komposisi dana */}
          <Grid size={{ xs: 12, md: 5 }}>
            <ChartCard title="Komposisi Dana" description="Total plafon RO dan Operasional: terpakai vs sisa" minH={220}>
              {danaDonutData.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
                  <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>Belum ada data anggaran</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={danaDonutData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} dataKey="value">
                        {danaDonutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<RpTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={0.75} sx={{ width: "100%", px: 1 }}>
                    {danaDonutData.map((d) => (
                      <Box key={d.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Box sx={{ width: 9, height: 9, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{d.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>{format_rupiah(d.value)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── Row 2: Monthly trend ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={12}>
            <ChartCard title="Tren Alokasi Gaji Bulanan" description={`Total alokasi gaji TA yang dibayarkan per bulan dalam unit — ${tahun}`} minH={240}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthly_trend} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradKoord" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.primary} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tickFormatter={rb} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <Box sx={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", p: 1.5 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}>
                            {label} {tahun}
                          </Typography>
                          <Typography sx={{ fontSize: "0.78rem" }}>
                            Alokasi: <b>{format_rupiah(payload[0]?.value as number)}</b>
                          </Typography>
                          <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{payload[0]?.payload?.jumlah_alokasi ?? 0} entri</Typography>
                        </Box>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="total_jumlah" name="Total Alokasi" stroke={C.primary} strokeWidth={2.5} fill="url(#gradKoord)" dot={{ r: 3.5, fill: C.primary, stroke: "var(--card)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── Daftar TA ── */}
        {ta_list.length > 0 && (
          <Section title={`Daftar Tenaga Ahli (${ta_list.length})`} description={`TA aktif dalam lingkup unit beserta status alokasi gaji ${nama_bulan}.`}>
            <DataTable columns={taColumns} data={ta_list} searchPlaceholder="Cari TA..." rowsPerPageOptions={[5, 10, 25]} hidePagination={ta_list.length <= 5} />
          </Section>
        )}

        {/* ── RO detail ── */}
        <Section title="Detail RO dalam Lingkup Unit" description="Daftar RO beserta plafon, pemakaian, utilisasi, dan sisa saldo.">
          <DataTable columns={roTableColumns} data={ro_rows} searchPlaceholder="Cari RO..." rowsPerPageOptions={[5, 10]} hidePagination={ro_rows.length <= 5} />
        </Section>

        {/* ── Dana Operasional ── */}
        <Section title="Dana Operasional" description="Plafon dana operasional unit koordinator tahun berjalan.">
          <DataTable
            columns={[
              { id: "tahun_fiscal", label: "Tahun Fiskal" },
              {
                id: "total_plafon",
                label: "Plafon",
                align: "right",
                render: (_, row) => format_rupiah(row.total_plafon),
              },
              {
                id: "total_terpakai",
                label: "Terpakai",
                align: "right",
                render: (_, row) => format_rupiah(row.total_terpakai),
              },
              {
                id: "pct_terpakai",
                label: "Utilisasi",
                align: "right",
                render: (_, row) => <StatusChip label={`${row.pct_terpakai ?? 0}%`} variant={row.pct_terpakai >= 90 ? "danger" : row.pct_terpakai >= 70 ? "warning" : "success"} size="small" />,
              },
              {
                id: "sisa_saldo",
                label: "Sisa",
                align: "right",
                render: (_, row) => <StatusChip label={format_rupiah(row.sisa_saldo)} variant={row.sisa_saldo >= 0 ? "success" : "danger"} size="small" />,
              },
            ]}
            data={op_rows}
            hideSearch
            hidePagination
          />
        </Section>
      </Box>
    </DashboardLayout>
  );
}

export default DashboardPage;
