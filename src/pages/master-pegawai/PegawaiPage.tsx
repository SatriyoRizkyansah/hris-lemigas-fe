import { useState } from "react";
import { Box, Grid, TextField, Typography, Chip, Divider } from "@mui/material";
import { AddOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, DataTable, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip, ThemedDatePicker } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, format_rupiah, format_date, to_date_input, status_variant, unwrap_list, unwrap_pagination, TIPE_PEGAWAI_OPTIONS, STATUS_AKTIF_OPTIONS, TA_KATEGORI_OPTIONS } from "../../common/hris";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";

function Field({ label, value, onChange, required, disabled, type, multiline }: any) {
  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      type={type}
      multiline={multiline}
      rows={multiline ? 3 : undefined}
      value={value ?? ""}
      slotProps={type === "date" ? { inputLabel: { shrink: true } } : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

const toDate = (v: string): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fromDate = (d: Date | null): string => {
  if (!d) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export function PegawaiPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [tipe, setTipe] = useState("");
  const [status, setStatus] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  const [detail_id, set_detail_id] = useState<string | null>(null);
  const [detail_open, set_detail_open] = useState(false);
  const [penempatan_form, set_penempatan_form] = useState<any>({ unit_kerja_id: "", jabatan: "", tmt: "", no_sk: "", keterangan: "" });
  const [penempatan_loading, set_penempatan_loading] = useState(false);

  const list_query = use_query({
    api_tag: "masterPegawai",
    api_method: "pegawaiGetControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        tipe_pegawai: tipe || undefined,
        status_aktif: status || undefined,
      } as any,
    ],
  });

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const detail_query = use_query({
    api_tag: "masterPegawai" as any,
    api_method: "pegawaiGetControllerGetDetail" as any,
    api_query: [detail_id as any] as any,
    should_running_if: Boolean(detail_id && detail_open),
  } as any);

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);

  const unit_options = unwrap_list(unit_query.response).map((u: any) => ({
    value: String(u.id),
    label: `${u.kode_unit} — ${u.nama_unit}`,
  }));

  const set_field = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const create_mutation = use_mutation({
    api_tag: "masterPegawai",
    api_method: "pegawaiPostControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "masterPegawai",
    api_method: "pegawaiPutControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const delete_mutation = use_mutation({
    api_tag: "masterPegawai",
    api_method: "pegawaiDeleteControllerRemove",
    options: { call_back: () => list_query.call_back() },
  });

  const open_create = () => {
    setEditing(null);
    setForm({
      nip_nik: "",
      nama: "",
      tipe_pegawai: "TA",
      ta_kategori: "BIASA",
      jabatan: "",
      email: "",
      telepon: "",
      tanggal_mulai: "",
      status_aktif: "AKTIF",
      bidang_keahlian: "",
      id_unit_kerja: "",
    });
    set_modal_open(true);
  };

  const open_detail = (row: any) => {
    set_detail_id(String(row.id));
    set_detail_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      nip_nik: row.nip_nik ?? "",
      nama: row.nama ?? "",
      tipe_pegawai: row.tipe_pegawai ?? "TA",
      ta_kategori: row.ta_kategori ?? "BIASA",
      jabatan: row.jabatan ?? "",
      email: row.email ?? "",
      telepon: row.telepon ?? "",
      tanggal_mulai: to_date_input(row.tanggal_mulai),
      status_aktif: row.status_aktif ?? "AKTIF",
      bidang_keahlian: row.bidang_keahlian ?? "",
      kontrak_mulai: to_date_input(row.kontrak_mulai),
      kontrak_selesai: to_date_input(row.kontrak_selesai),
      id_unit_kerja: row.unit_kerja?.id ?? row.id_unit_kerja ?? "",
    });
    set_modal_open(true);
  };

  const submit_penempatan = async () => {
    if (!detail_id || !penempatan_form.unit_kerja_id || !penempatan_form.tmt) return;
    set_penempatan_loading(true);
    try {
      const token = auth_signal.value.selectedToken || auth_signal.value.data?.token || "";
      const res = await fetch(`/api/pegawai/${detail_id}/penempatan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          unit_kerja_id: penempatan_form.unit_kerja_id,
          jabatan: penempatan_form.jabatan || undefined,
          tmt: penempatan_form.tmt,
          no_sk: penempatan_form.no_sk || undefined,
          keterangan: penempatan_form.keterangan || undefined,
          is_homebase: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      set_penempatan_form({ unit_kerja_id: "", jabatan: "", tmt: "", no_sk: "", keterangan: "" });
      (detail_query as any).call_back?.();
      list_query.call_back();
    } catch (e: any) {
      console.error(e);
    } finally {
      set_penempatan_loading(false);
    }
  };

  const submit = () => {
    const payload: any = {
      nama: form.nama,
      tipe_pegawai: form.tipe_pegawai,
      ta_kategori: form.tipe_pegawai === "TA" ? form.ta_kategori || "BIASA" : undefined,
      jabatan: form.jabatan || undefined,
      email: form.email || undefined,
      telepon: form.telepon || undefined,
      status_aktif: form.status_aktif || undefined,
      bidang_keahlian: form.tipe_pegawai === "TA" ? form.bidang_keahlian || undefined : undefined,
    };
    if (editing) {
      if (form.tipe_pegawai === "TA") {
        payload.kontrak_mulai = form.kontrak_mulai || undefined;
        payload.kontrak_selesai = form.kontrak_selesai || undefined;
      }
      update_mutation([editing.id, payload]);
    } else {
      payload.nip_nik = form.nip_nik;
      payload.tanggal_mulai = form.tanggal_mulai;
      payload.id_unit_kerja = form.id_unit_kerja || undefined;
      create_mutation([payload]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nip_nik",
      label: "NIP/NIK",
      width: 145,
      sortable: true,
      render: (_, row) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.nip_nik ?? "-")}</Typography>,
    },
    {
      id: "nama",
      label: "Nama",
      width: 210,
      sortable: true,
      render: (_, row) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.3 }}>{String(row.nama ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.3 }}>{String(row.email ?? "-")}</Typography>
        </Box>
      ),
    },
    {
      id: "tipe_pegawai",
      label: "Tipe",
      width: 85,
      render: (_, row) => <StatusChip label={String(row.tipe_pegawai ?? "-")} variant={row.tipe_pegawai === "TA" ? "info" : "neutral"} size="small" />,
    },
    {
      id: "ta_kategori",
      label: "Kategori TA",
      width: 105,
      hideMobile: true,
      render: (_, row) =>
        row.tipe_pegawai === "TA" ? (
          <StatusChip label={row.ta_kategori === "RO" ? "TA RO" : "TA Biasa"} variant={row.ta_kategori === "RO" ? "warning" : "neutral"} size="small" />
        ) : (
          <Box sx={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>-</Box>
        ),
    },
    { id: "jabatan", label: "Jabatan", width: 170, render: (_, row) => <Box sx={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.jabatan ?? "-")}</Box> },
    {
      id: "nama_unit_kerja",
      label: "Unit Kerja",
      width: 170,
      hideMobile: true,
      render: (_, row) => <Box sx={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>{String(row.unit_kerja?.nama_unit ?? row.nama_unit_kerja ?? "-")}</Box>,
    },
    {
      id: "gaji_bulanan",
      label: "Gaji/Bulan",
      width: 135,
      align: "right",
      hideMobile: true,
      render: (_, row) => <Box sx={{ whiteSpace: "nowrap" }}>{format_rupiah(row.gaji_bulanan)}</Box>,
    },
    {
      id: "status_aktif",
      label: "Status",
      width: 95,
      render: (_, row) => <StatusChip label={String(row.status_aktif ?? "-")} variant={status_variant(row.status_aktif)} size="small" />,
    },
    {
      id: "aksi",
      label: "Aksi",
      width: 110,
      align: "right" as const,
      render: (_: any, row: any) => (
        <ActionButtonGroup>
          <ActionButton variant="view" title="Detail & Riwayat Unit" icon={<VisibilityOutlined fontSize="small" />} onClick={() => open_detail(row)} />
          {can_edit && <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />}
        </ActionButtonGroup>
      ),
    },
  ];

  const filters = [
    {
      id: "tipe_pegawai",
      label: "Tipe Pegawai",
      value: tipe,
      options: [{ label: "Semua Tipe", value: "" }, ...TIPE_PEGAWAI_OPTIONS],
      onChange: (v: string) => {
        setTipe(v);
        setPage(0);
      },
    },
    {
      id: "status_aktif",
      label: "Status",
      value: status,
      options: [{ label: "Semua Status", value: "" }, ...STATUS_AKTIF_OPTIONS],
      onChange: (v: string) => {
        setStatus(v);
        setPage(0);
      },
    },
  ];

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="Pegawai"
      headerTitle="Master Pegawai"
      headerDescription="Data pegawai LEMIGAS — PNS, ASN, Outsourcing, dan Tenaga Ahli (TA)."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Pegawai
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data pegawai. Coba lagi." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Pegawai"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari nama, NIP/NIK, email..."
            filters={filters}
            isLoading={list_query.is_loading}
            totalRows={pagination.total_datas}
            page={page}
            rowsPerPage={rows_per_page}
            onPageChange={setPage}
            onRowsPerPageChange={(rpp) => {
              set_rows_per_page(rpp);
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            emptyStateLabel="Belum ada data pegawai."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah Pegawai: ${editing.nama}` : "Tambah Pegawai"}
        description={editing ? "Perbarui data pegawai." : "Lengkapi data pegawai baru."}
        maxWidth={680}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="NIP/NIK" value={form.nip_nik} onChange={(v: string) => set_field("nip_nik", v)} required disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Nama Lengkap" value={form.nama} onChange={(v: string) => set_field("nama", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Tipe Pegawai" value={String(form.tipe_pegawai ?? "")} options={TIPE_PEGAWAI_OPTIONS} onChange={(v) => set_field("tipe_pegawai", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Status" value={String(form.status_aktif ?? "")} options={STATUS_AKTIF_OPTIONS} onChange={(v) => set_field("status_aktif", v)} />
          </Grid>
          {form.tipe_pegawai === "TA" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect label="Kategori TA" value={String(form.ta_kategori ?? "BIASA")} options={TA_KATEGORI_OPTIONS} onChange={(v) => set_field("ta_kategori", v)} />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Jabatan" value={form.jabatan} onChange={(v: string) => set_field("jabatan", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Email" value={form.email} onChange={(v: string) => set_field("email", v)} type="email" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Telepon" value={form.telepon} onChange={(v: string) => set_field("telepon", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Tanggal Mulai Kerja" value={toDate(form.tanggal_mulai)} onChange={(d) => set_field("tanggal_mulai", fromDate(d))} required disabled={Boolean(editing)} />
            <Typography sx={{ mt: 0.5, fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Dasar masa kerja pegawai; tidak berubah saat ada SK baru.</Typography>
          </Grid>
          {form.tipe_pegawai === "TA" && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field label="Bidang Keahlian" value={form.bidang_keahlian} onChange={(v: string) => set_field("bidang_keahlian", v)} />
              </Grid>
              {editing && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ThemedDatePicker label="Mulai Kontrak" value={toDate(form.kontrak_mulai)} onChange={(d) => set_field("kontrak_mulai", fromDate(d))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ThemedDatePicker label="Kontrak Selesai" value={toDate(form.kontrak_selesai)} onChange={(d) => set_field("kontrak_selesai", fromDate(d))} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Kontrak mengikuti periode SK aktif. Ubah via menu SK untuk sinkronisasi otomatis.</Typography>
                  </Grid>
                </>
              )}
              {!editing && (
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", p: 1.5, bgcolor: "var(--muted)", borderRadius: 1 }}>
                    Periode kontrak akan mengikuti tanggal mulai & selesai dari SK yang dibuat setelah pegawai ditambahkan.
                  </Typography>
                </Grid>
              )}
            </>
          )}
          {!editing && (
            <Grid size={{ xs: 12 }}>
              <SearchableSelect label="Unit Kerja Awal" value={String(form.id_unit_kerja ?? "")} options={unit_options} onChange={(v) => set_field("id_unit_kerja", v)} loading={unit_query.is_loading} />
            </Grid>
          )}
        </Grid>
      </Modal>

      <Modal
        open={detail_open}
        onClose={() => {
          set_detail_open(false);
          set_detail_id(null);
        }}
        title={(() => {
          const d: any = (detail_query as any).response?.data ?? (detail_query as any).response;
          return d ? `Detail: ${d.nama} — ${d.nip_nik}` : "Detail Pegawai";
        })()}
        description="Riwayat penempatan unit kerja (homebase history) — tracking perpindahan unit."
        maxWidth={900}
        actions={[
          {
            label: "Tutup",
            variant: "ghost",
            onClick: () => {
              set_detail_open(false);
              set_detail_id(null);
            },
          },
        ]}
      >
        {(() => {
          const d: any = (detail_query as any).response?.data ?? (detail_query as any).response;
          if ((detail_query as any).is_loading) return <InfoCard message="Memuat detail..." variant="info" />;
          if (!d) return <InfoCard message="Pilih pegawai untuk melihat detail." variant="info" />;
          const penempatan: any[] = d.riwayat_penempatan ?? [];
          const current = penempatan.find((p: any) => p.is_homebase && p.status_aktif === "AKTIF") ?? penempatan[0];
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, p: 1.5, bgcolor: "var(--muted)", borderRadius: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>NIP/NIK</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{d.nip_nik}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>Tipe</Typography>
                  <StatusChip label={d.tipe_pegawai} variant={d.tipe_pegawai === "TA" ? "info" : "neutral"} size="small" />
                </Box>
                {d.tipe_pegawai === "TA" && (
                  <Box>
                    <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>Kategori</Typography>
                    <StatusChip label={d.ta_kategori === "RO" ? "TA RO" : "TA Biasa"} variant={d.ta_kategori === "RO" ? "warning" : "neutral"} size="small" />
                  </Box>
                )}
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>Unit Aktif</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{current?.unit_kerja?.nama_unit ?? d.unit_kerja?.nama_unit ?? "-"}</Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                    {current?.unit_kerja?.kode_unit ?? ""} {current?.jabatan ? `— ${current.jabatan}` : d.jabatan ? `— ${d.jabatan}` : ""}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>Status</Typography>
                  <StatusChip label={d.status_aktif} variant={status_variant(d.status_aktif)} size="small" />
                </Box>
              </Box>

              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Riwayat Penempatan (Homebase History)</Typography>
              <DataTable
                columns={[
                  {
                    id: "unit",
                    label: "Unit Kerja",
                    width: 200,
                    render: (_: any, r: any) => (
                      <Box>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{r.unit_kerja?.nama_unit ?? "-"}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                          {r.unit_kerja?.kode_unit ?? ""} — {r.unit_kerja?.tipe_unit ?? ""}
                        </Typography>
                      </Box>
                    ),
                  },
                  { id: "jabatan", label: "Jabatan", width: 150, render: (_: any, r: any) => String(r.jabatan ?? "-") },
                  { id: "tmt", label: "TMT", width: 110, render: (_: any, r: any) => format_date(r.tmt) },
                  { id: "selesai", label: "Selesai", width: 110, render: (_: any, r: any) => (r.tanggal_selesai ? format_date(r.tanggal_selesai) : "-") },
                  { id: "no_sk", label: "No SK", width: 140, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-all", fontSize: "0.75rem" }}>{r.no_sk ?? "-"}</Box> },
                  { id: "status", label: "Status", width: 90, render: (_: any, r: any) => <StatusChip label={r.status_aktif} variant={status_variant(r.status_aktif)} size="small" /> },
                  { id: "homebase", label: "Homebase", width: 90, render: (_: any, r: any) => (r.is_homebase ? <Chip label="Ya" size="small" color="primary" /> : <Chip label="-" size="small" variant="outlined" />) },
                  { id: "ket", label: "Keterangan", width: 150, render: (_: any, r: any) => String(r.keterangan ?? "-") },
                ]}
                data={penempatan}
                emptyState={<Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>Belum ada riwayat penempatan.</Typography>}
              />

              {can_edit && (
                <Box sx={{ p: 1.5, border: "1px solid var(--border)", borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1.5 }}>Tambah Penempatan / Mutasi</Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SearchableSelect
                        label="Unit Kerja Tujuan"
                        value={String(penempatan_form.unit_kerja_id ?? "")}
                        options={unit_options}
                        onChange={(v) => set_penempatan_form((f: any) => ({ ...f, unit_kerja_id: v }))}
                        placeholder="Pilih unit..."
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field label="Jabatan di Unit Baru" value={penempatan_form.jabatan} onChange={(v: string) => set_penempatan_form((f: any) => ({ ...f, jabatan: v }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <ThemedDatePicker label="TMT" value={toDate(penempatan_form.tmt)} onChange={(d) => set_penempatan_form((f: any) => ({ ...f, tmt: fromDate(d) }))} required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Field label="No SK" value={penempatan_form.no_sk} onChange={(v: string) => set_penempatan_form((f: any) => ({ ...f, no_sk: v }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Field label="Keterangan" value={penempatan_form.keterangan} onChange={(v: string) => set_penempatan_form((f: any) => ({ ...f, keterangan: v }))} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftButton onClick={submit_penempatan} disabled={!penempatan_form.unit_kerja_id || !penempatan_form.tmt || penempatan_loading}>
                        {penempatan_loading ? "Menyimpan..." : "Simpan Penempatan"}
                      </SoftButton>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          );
        })()}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Nonaktifkan Pegawai"
        message={`Pegawai "${confirm_target?.nama ?? ""}" akan dinonaktifkan. Data tetap tersimpan namun tidak lagi dihitung sebagai pegawai aktif.`}
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default PegawaiPage;
