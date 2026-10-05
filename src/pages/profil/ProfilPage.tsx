import { useState } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { DashboardLayout } from "../../layouts";
import { DataEmpty, InfoCard, SoftButton, StatusChip, TableSkeleton, DataTable, TablePagination } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import { format_rupiah, format_date, status_variant, BULAN_OPTIONS } from "../../common/hris";

function SectionCard({ title, children }: { title: string; children: any }) {
  return (
    <Card sx={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 2 }}>
      <CardContent>
        <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--foreground)", mb: 1.5 }}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--foreground)" }}>{value ?? "-"}</Typography>
    </Box>
  );
}

export function ProfilPage() {
  const [alokasi_page, set_alokasi_page] = useState(0);
  const [alokasi_rows, set_alokasi_rows] = useState(10);

  const profile_query = use_query({
    api_tag: "myProfile",
    api_method: "myProfileControllerGetProfile",
    api_query: [],
  });

  const sk_query = use_query({
    api_tag: "myProfile",
    api_method: "myProfileControllerGetMySk",
    api_query: [],
  });

  const alokasi_query = use_query({
    api_tag: "myProfile",
    api_method: "myProfileControllerGetMyAlokasi",
    api_query: [{ page: alokasi_page + 1, limit: alokasi_rows } as any],
  });

  const profile_body: any = profile_query.response ?? {};
  const profile = profile_body.data ?? profile_body;
  const user = profile?.user ?? {};
  const pegawai = profile?.pegawai ?? null;
  const sk_aktif = pegawai?.sk_aktif ?? null;

  const sk_response: any = sk_query.response ?? {};
  const sk_rows: any[] = Array.isArray(sk_response) ? sk_response : Array.isArray(sk_response?.data) ? sk_response.data : [];

  const alokasi_body: any = alokasi_query.response ?? {};
  const alokasi_data = alokasi_body.data ?? alokasi_body;
  const alokasi_rows_data: any[] = Array.isArray(alokasi_data?.alokasi) ? alokasi_data.alokasi : [];
  const alokasi_pagination = alokasi_data?.pagination ?? {};

  const sk_columns: Column<any>[] = [
    {
      id: "nomor_sk",
      label: "Nomor SK",
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nomor_sk ?? "-")}</Typography>,
    },
    { id: "jabatan", label: "Jabatan", render: (_, row) => String(row.jabatan ?? "-") },
    {
      id: "masa_berlaku",
      label: "Masa Berlaku",
      render: (_, row) => `${format_date(row.masa_berlaku_mulai)} s.d. ${format_date(row.masa_berlaku_akhir)}`,
    },
    {
      id: "status_aktif",
      label: "Status",
      render: (_, row) => <StatusChip label={String(row.status_aktif ?? "-")} variant={status_variant(row.status_aktif)} size="small" />,
    },
  ];

  const alokasi_columns: Column<any>[] = [
    {
      id: "periode",
      label: "Periode",
      sortable: true,
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
      hideMobile: true,
      render: (_, row) => String(row.nama_ro ?? row.dana_operasional_id ?? "-"),
    },
    { id: "jumlah", label: "Jumlah", align: "right", render: (_, row) => format_rupiah(row.jumlah) },
    {
      id: "status",
      label: "Status",
      render: (_, row) => <StatusChip label={String(row.status ?? "-")} variant={status_variant(row.status)} size="small" />,
    },
    { id: "keterangan", label: "Keterangan", hideMobile: true, render: (_, row) => String(row.keterangan ?? "-") },
  ];

  return (
    <DashboardLayout
      sectionTitle="Akun"
      title="Profil Saya"
      headerTitle="Profil Saya"
      headerDescription="Informasi akun, data kepegawaian, riwayat SK, dan alokasi gaji."
      headerAction={<SoftButton onClick={() => profile_query.call_back()}>Muat Ulang</SoftButton>}
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {profile_query.error && !profile_query.is_loading ? (
          <InfoCard message="Gagal memuat profil." variant="error" />
        ) : profile_query.is_loading ? (
          <TableSkeleton rows={3} columns={3} />
        ) : (
          <>
            <SectionCard title="Informasi Akun">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoItem label="Nama" value={String(user.nama ?? "-")} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoItem label="Email" value={String(user.email ?? "-")} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoItem label="Role" value={String(user.nama_role ?? user.role ?? "-")} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoItem label="Status Pegawai" value={pegawai ? <StatusChip label={String(pegawai.status_aktif ?? "-")} variant={status_variant(pegawai.status_aktif)} size="small" /> : "—"} />
                </Grid>
              </Grid>
            </SectionCard>

            {pegawai ? (
              <SectionCard title="Data Kepegawaian">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoItem label="NIP/NIK" value={String(pegawai.nip_nik ?? "-")} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoItem label="Jabatan" value={String(pegawai.jabatan ?? "-")} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoItem label="Tipe Pegawai" value={String(pegawai.tipe_pegawai ?? "-")} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoItem label="Unit Kerja" value={pegawai.unit_kerja ? String(pegawai.unit_kerja.nama_unit) : "-"} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoItem label="Gaji Bulanan" value={format_rupiah(pegawai.gaji_bulanan)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    {sk_aktif ? (
                      <InfoItem label="SK Aktif" value={`${String(sk_aktif.nomor_sk ?? "-")} — ${String(sk_aktif.jabatan ?? "-")} (${format_date(sk_aktif.masa_berlaku_mulai)} s.d. ${format_date(sk_aktif.masa_berlaku_akhir)})`} />
                    ) : (
                      <InfoItem label="SK Aktif" value="Belum ada SK aktif" />
                    )}
                  </Grid>
                </Grid>
              </SectionCard>
            ) : (
              <InfoCard message="Akun ini belum terhubung dengan data pegawai." variant="warning" />
            )}
          </>
        )}

        <SectionCard title="Riwayat SK">{sk_query.is_loading ? <TableSkeleton rows={3} columns={4} /> : sk_rows.length === 0 ? <DataEmpty /> : <DataTable columns={sk_columns} data={sk_rows} hideSearch hidePagination />}</SectionCard>

        <SectionCard title="Alokasi Gaji">
          {alokasi_query.is_loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : alokasi_rows_data.length === 0 ? (
            <DataEmpty />
          ) : (
            <Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                  Gaji bulanan: <strong style={{ color: "var(--foreground)" }}>{format_rupiah(alokasi_data?.gaji_bulanan)}</strong>
                </Typography>
              </Box>
              <DataTable columns={alokasi_columns} data={alokasi_rows_data} hideSearch hidePagination />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <TablePagination
                  page={alokasi_page}
                  rowsPerPage={alokasi_rows}
                  totalRows={alokasi_pagination.total_datas ?? alokasi_rows_data.length}
                  onPageChange={set_alokasi_page}
                  onRowsPerPageChange={(rpp) => {
                    set_alokasi_rows(rpp);
                    set_alokasi_page(0);
                  }}
                />
              </Box>
            </Box>
          )}
        </SectionCard>
      </Box>
    </DashboardLayout>
  );
}

export default ProfilPage;
