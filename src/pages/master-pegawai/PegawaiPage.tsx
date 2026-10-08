import { useState, useMemo } from "react";
import { Box, Grid, TextField, Typography, Chip, Divider, Avatar, Stack, InputAdornment } from "@mui/material";
import { AddOutlined, EditOutlined, VisibilityOutlined, BusinessOutlined, WorkOutlineOutlined, BadgeOutlined, CalendarTodayOutlined, SearchOutlined, HistoryOutlined, AssignmentOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip, ThemedDatePicker, FileUploadInput } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, format_rupiah, format_date, to_date_input, status_variant, unwrap_list, unwrap_pagination, TIPE_PEGAWAI_OPTIONS, STATUS_AKTIF_OPTIONS, TA_KATEGORI_OPTIONS } from "../../common/hris";

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
  const [sk_search, set_sk_search] = useState("");
  // SK quick-add from detail
  const [sk_modal_open, set_sk_modal_open] = useState(false);
  const [sk_file, set_sk_file] = useState<File | null>(null);
  const [sk_form, set_sk_form] = useState<any>({
    nomor_sk: "",
    tanggal_sk: "",
    tanggal_selesai: "",
    tanggal_efektif: "",
    id_unit_kerja: "",
    jabatan: "",
    gaji_bulanan: "",
    sumber_dana_default: "OPERASIONAL",
    ro_id_default: "",
    dana_operasional_id_default: "",
    file_sk: "",
    is_tugas_tambahan: false,
    keterangan: "",
  });
  const [sk_custom_effective, set_sk_custom_effective] = useState(false);
  // Pegawai + SK langsung (full SK modal detail)
  const [create_with_sk, set_create_with_sk] = useState(false);
  const [new_sk_file, set_new_sk_file] = useState<File | null>(null);
  const [new_sk_custom_effective, set_new_sk_custom_effective] = useState(false);
  const [new_sk_form, set_new_sk_form] = useState<any>({
    nomor_sk: "",
    tanggal_sk: "",
    tanggal_selesai: "",
    tanggal_efektif: "",
    id_unit_kerja: "",
    jabatan: "",
    gaji_bulanan: "",
    sumber_dana_default: "OPERASIONAL",
    ro_id_default: "",
    dana_operasional_id_default: "",
    is_tugas_tambahan: false,
    keterangan: "",
  });

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

  const ro_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetData",
    api_query: [{ limit: 200 } as any],
  });
  const dana_query = use_query({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerGetData",
    api_query: [{ limit: 200 } as any],
  });
  const ro_options = useMemo(() => unwrap_list((ro_query as any).response).map((r: any) => ({ value: String(r.id), label: `${r.kode_ro} — ${r.nama_ro}` })), [(ro_query as any).response]);
  const dana_options = useMemo(
    () => unwrap_list((dana_query as any).response).map((d: any) => ({ value: String(d.id), label: `${d.nama_unit_koordinator ?? d.id_unit_koordinator ?? "-"} — ${d.tahun_fiscal} (${format_rupiah(d.total_plafon)})` })),
    [(dana_query as any).response],
  );

  const sk_create_mutation = use_mutation({
    api_tag: "sk",
    api_method: "skPostControllerCreate",
    options: {
      call_back: () => {
        list_query.call_back();
        (detail_query as any).call_back?.();
      },
      will_exec_after_success: () => {
        set_sk_modal_open(false);
        set_sk_file(null);
      },
    },
  });

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
  // untuk flow pegawai+SK: jangan auto-close sebelum SK selesai
  const create_pegawai_raw = use_mutation({
    api_tag: "masterPegawai",
    api_method: "pegawaiPostControllerCreate",
    options: {
      should_disable_autoclose_stack: true,
      should_disable_success_message: true,
    },
  });
  const sk_create_raw = use_mutation({
    api_tag: "sk",
    api_method: "skPostControllerCreate",
    options: {
      should_disable_autoclose_stack: true,
      should_disable_success_message: true,
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
    });
    set_create_with_sk(false);
    set_new_sk_file(null);
    set_new_sk_custom_effective(false);
    set_new_sk_form({
      nomor_sk: "",
      tanggal_sk: "",
      tanggal_selesai: "",
      tanggal_efektif: "",
      id_unit_kerja: "",
      jabatan: "",
      gaji_bulanan: "",
      sumber_dana_default: "OPERASIONAL",
      ro_id_default: "",
      dana_operasional_id_default: "",
      is_tugas_tambahan: false,
      keterangan: "",
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
    });
    set_modal_open(true);
  };

  const submit = async () => {
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
      return;
    }
    if (!create_with_sk) {
      payload.nip_nik = form.nip_nik;
      payload.tanggal_mulai = form.tanggal_mulai;
      create_mutation([payload]);
      return;
    }
    if (!new_sk_form.nomor_sk || !new_sk_form.tanggal_sk || !new_sk_form.id_unit_kerja) return;
    const tanggal_efektif = new_sk_custom_effective ? new_sk_form.tanggal_efektif : new_sk_form.tanggal_sk;
    if (!tanggal_efektif) return;
    payload.nip_nik = form.nip_nik;
    payload.tanggal_mulai = form.tanggal_mulai;
    const res: any = await (create_pegawai_raw as any)([payload]);
    const newPegawaiId = res?.data?.data?.id ?? res?.data?.id ?? res?.id ?? res?.data?.data?.data?.id;
    if (!newPegawaiId) {
      list_query.call_back();
      return;
    }
    const skBase: any = {
      nomor_sk: new_sk_form.nomor_sk,
      tanggal_sk: new_sk_form.tanggal_sk,
      tanggal_efektif,
      id_pegawai: String(newPegawaiId),
      id_unit_kerja: new_sk_form.id_unit_kerja,
    };
    if (new_sk_form.tanggal_selesai) skBase.tanggal_selesai = new_sk_form.tanggal_selesai;
    if (new_sk_form.jabatan) skBase.jabatan = new_sk_form.jabatan;
    if (new_sk_form.gaji_bulanan !== "" && new_sk_form.gaji_bulanan != null) skBase.gaji_bulanan = Number(new_sk_form.gaji_bulanan);
    if (new_sk_form.sumber_dana_default) skBase.sumber_dana_default = new_sk_form.sumber_dana_default;
    if (new_sk_form.sumber_dana_default === "RO" && new_sk_form.ro_id_default) skBase.ro_id_default = new_sk_form.ro_id_default;
    if (new_sk_form.sumber_dana_default === "OPERASIONAL" && new_sk_form.dana_operasional_id_default) skBase.dana_operasional_id_default = new_sk_form.dana_operasional_id_default;
    if (new_sk_form.is_tugas_tambahan) skBase.is_tugas_tambahan = true;
    if (new_sk_form.keterangan) skBase.keterangan = new_sk_form.keterangan;
    if (new_sk_file) skBase.file = new_sk_file;
    const skRes: any = await (sk_create_raw as any)([skBase]);
    if (skRes && !skRes?.error) {
      set_modal_open(false);
      set_create_with_sk(false);
      set_new_sk_file(null);
      list_query.call_back();
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
            <>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1.25, bgcolor: create_with_sk ? "#fef3c7" : "var(--muted)", border: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={create_with_sk} onChange={(e) => set_create_with_sk(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Buat SK sekalian (isi detail SK lengkap di bawah)</Typography>
                </Box>
                {!create_with_sk && <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>Pegawai akan dibuat tanpa SK. Tambah SK nanti via Detail → Tambah SK atau menu SK.</Typography>}
              </Grid>
              {create_with_sk && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mt: 1 }}>Detail SK Awal</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>Lengkapi seperti modal SK — nomor, tanggal, unit, gaji, sumber dana, file.</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field label="Nomor SK" value={new_sk_form.nomor_sk} onChange={(v: string) => set_new_sk_form((f: any) => ({ ...f, nomor_sk: v }))} required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ThemedDatePicker label="Tanggal SK" value={toDate(new_sk_form.tanggal_sk)} onChange={(d) => set_new_sk_form((f: any) => ({ ...f, tanggal_sk: fromDate(d) }))} required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ThemedDatePicker label="Tanggal Selesai (opsional)" value={toDate(new_sk_form.tanggal_selesai)} onChange={(d) => set_new_sk_form((f: any) => ({ ...f, tanggal_selesai: fromDate(d) }))} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1.25, bgcolor: "var(--muted)", border: "1px solid var(--border)" }}>
                      <input
                        type="checkbox"
                        checked={new_sk_custom_effective}
                        onChange={(e) => {
                          set_new_sk_custom_effective(e.target.checked);
                          if (!e.target.checked) set_new_sk_form((f: any) => ({ ...f, tanggal_efektif: f.tanggal_sk }));
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Berlaku mulai tanggal berbeda dari tanggal SK</Typography>
                    </Box>
                  </Grid>
                  {new_sk_custom_effective && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <ThemedDatePicker label="Tanggal Mulai Berlaku" value={toDate(new_sk_form.tanggal_efektif)} onChange={(d) => set_new_sk_form((f: any) => ({ ...f, tanggal_efektif: fromDate(d) }))} required />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field label="Jabatan (SK)" value={new_sk_form.jabatan} onChange={(v: string) => set_new_sk_form((f: any) => ({ ...f, jabatan: v }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field label="Gaji Bulanan (Rp)" value={new_sk_form.gaji_bulanan} onChange={(v: string) => set_new_sk_form((f: any) => ({ ...f, gaji_bulanan: v }))} type="number" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <SearchableSelect
                      label="Sumber Dana Default"
                      value={String(new_sk_form.sumber_dana_default ?? "OPERASIONAL")}
                      options={[
                        { value: "OPERASIONAL", label: "Operasional" },
                        { value: "RO", label: "RO" },
                      ]}
                      onChange={(v) => set_new_sk_form((f: any) => ({ ...f, sumber_dana_default: v }))}
                    />
                  </Grid>
                  {new_sk_form.sumber_dana_default === "RO" ? (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SearchableSelect label="RO Default" value={String(new_sk_form.ro_id_default ?? "")} options={ro_options} onChange={(v) => set_new_sk_form((f: any) => ({ ...f, ro_id_default: v }))} />
                    </Grid>
                  ) : (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SearchableSelect
                        label="Dana Operasional Default"
                        value={String(new_sk_form.dana_operasional_id_default ?? "")}
                        options={dana_options}
                        onChange={(v) => set_new_sk_form((f: any) => ({ ...f, dana_operasional_id_default: v }))}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12 }}>
                    <SearchableSelect
                      label="Unit Kerja"
                      value={String(new_sk_form.id_unit_kerja ?? "")}
                      options={unit_options}
                      onChange={(v) => set_new_sk_form((f: any) => ({ ...f, id_unit_kerja: v }))}
                      required
                      loading={unit_query.is_loading}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1.25, bgcolor: new_sk_form.is_tugas_tambahan ? "#fef3c7" : "var(--muted)", border: "1px solid var(--border)" }}>
                      <input type="checkbox" checked={Boolean(new_sk_form.is_tugas_tambahan)} onChange={(e) => set_new_sk_form((f: any) => ({ ...f, is_tugas_tambahan: e.target.checked }))} style={{ width: 16, height: 16 }} />
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Tugas tambahan (tidak menonaktifkan SK homebase)</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field label="Keterangan" value={new_sk_form.keterangan} onChange={(v: string) => set_new_sk_form((f: any) => ({ ...f, keterangan: v }))} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FileUploadInput value={new_sk_file} onChange={set_new_sk_file} accept=".pdf" label="File SK (PDF)" />
                  </Grid>
                </>
              )}
            </>
          )}
        </Grid>
      </Modal>

      <Modal
        open={detail_open}
        onClose={() => {
          set_detail_open(false);
          set_detail_id(null);
          set_sk_search("");
        }}
        title="Detail Pegawai"
        description="Profil lengkap & riwayat SK"
        maxWidth={920}
        actions={[
          {
            label: "Tutup",
            variant: "ghost",
            onClick: () => {
              set_detail_open(false);
              set_detail_id(null);
              set_sk_search("");
            },
          },
        ]}
      >
        {(() => {
          const d: any = (detail_query as any).response?.data ?? (detail_query as any).response;
          if ((detail_query as any).is_loading) return <InfoCard message="Memuat detail pegawai..." variant="info" />;
          if (!d) return <InfoCard message="Pilih pegawai untuk melihat detail." variant="info" />;
          const skList: any[] = d.riwayat_sk ?? d.sk_list ?? [];
          const activeSk = skList.find((s: any) => s.is_homebase && s.status_aktif === "AKTIF") ?? skList.find((s: any) => s.status_aktif === "AKTIF") ?? skList[0] ?? null;
          const current = activeSk;
          const initials = String(d.nama ?? "?")
            .split(" ")
            .slice(0, 2)
            .map((w: string) => w[0])
            .join("")
            .toUpperCase();
          const masaKerja = (() => {
            if (!d.tanggal_mulai) return "-";
            const start = new Date(d.tanggal_mulai);
            const now = new Date();
            let y = now.getFullYear() - start.getFullYear();
            let m = now.getMonth() - start.getMonth();
            if (m < 0) {
              y -= 1;
              m += 12;
            }
            if (y <= 0) return `${m} bln`;
            return `${y} thn ${m} bln`;
          })();
          const filteredSk = skList.filter((s: any) => {
            if (!sk_search) return true;
            const q = sk_search.toLowerCase();
            return (
              String(s.nomor_sk ?? "")
                .toLowerCase()
                .includes(q) ||
              String(s.unit_kerja?.nama_unit ?? "")
                .toLowerCase()
                .includes(q) ||
              String(s.jabatan ?? "")
                .toLowerCase()
                .includes(q)
            );
          });
          const openSkQuickAdd = () => {
            set_sk_file(null);
            set_sk_custom_effective(false);
            set_sk_form({
              nomor_sk: "",
              tanggal_sk: "",
              tanggal_selesai: "",
              tanggal_efektif: "",
              id_unit_kerja: String(current?.unit_kerja?.id ?? d.unit_kerja?.id ?? ""),
              jabatan: String(d.jabatan ?? current?.jabatan ?? ""),
              gaji_bulanan: activeSk?.gaji_bulanan != null ? String(activeSk.gaji_bulanan) : "",
              sumber_dana_default: activeSk?.sumber_dana_default ?? "OPERASIONAL",
              ro_id_default: activeSk?.ro_id_default ?? "",
              dana_operasional_id_default: activeSk?.dana_operasional_id_default ?? "",
              file_sk: "",
              is_tugas_tambahan: false,
              keterangan: "",
            });
            set_sk_modal_open(true);
          };
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {/* Hero */}
              <Box sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid var(--border)", background: "var(--card)", display: "flex", gap: 1.5, alignItems: "flex-start", flexWrap: "wrap" }}>
                <Avatar sx={{ width: 44, height: 44, bgcolor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 800, fontSize: "0.95rem", flexShrink: 0 }}>{initials}</Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)", lineHeight: 1.25 }}>{d.nama}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.75 }}>
                    <Chip
                      icon={<BadgeOutlined sx={{ fontSize: 14 }} />}
                      label={d.nip_nik}
                      size="small"
                      sx={{ bgcolor: "#f3f4f6", color: "#18181b", border: "1px solid #d1d5db", fontWeight: 600, fontSize: "0.75rem", "& .MuiChip-icon": { color: "#71717a" } }}
                    />
                    <StatusChip label={d.status_aktif} variant={status_variant(d.status_aktif)} size="small" />
                    <StatusChip label={d.tipe_pegawai} variant={d.tipe_pegawai === "TA" ? "info" : "neutral"} size="small" />
                    {d.tipe_pegawai === "TA" && <StatusChip label={d.ta_kategori === "RO" ? "TA RO" : "TA Biasa"} variant={d.ta_kategori === "RO" ? "warning" : "neutral"} size="small" />}
                  </Stack>
                  <Typography sx={{ mt: 1, fontSize: "0.78rem", color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                    <BusinessOutlined sx={{ fontSize: 14 }} /> {current?.unit_kerja?.nama_unit ?? d.unit_kerja?.nama_unit ?? "-"} {current?.unit_kerja?.kode_unit ? `· ${current.unit_kerja.kode_unit}` : ""}{" "}
                    {current?.jabatan || d.jabatan ? `· ${current?.jabatan ?? d.jabatan}` : ""}
                  </Typography>
                </Box>
                {can_edit && (
                  <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    <SoftButton size="small" startIcon={<AssignmentOutlined />} onClick={openSkQuickAdd}>
                      Tambah SK
                    </SoftButton>
                    <SoftButton
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlined />}
                      onClick={() => {
                        set_detail_open(false);
                        open_edit(d);
                      }}
                    >
                      Ubah
                    </SoftButton>
                  </Stack>
                )}
              </Box>

              {/* Info grid */}
              <Grid container spacing={1}>
                {[
                  { icon: <BusinessOutlined sx={{ fontSize: 16 }} />, label: "Unit Aktif", value: current?.unit_kerja?.nama_unit ?? d.unit_kerja?.nama_unit ?? "-", sub: current?.unit_kerja?.tipe_unit ?? d.unit_kerja?.tipe_unit ?? "" },
                  { icon: <WorkOutlineOutlined sx={{ fontSize: 16 }} />, label: "Jabatan", value: current?.jabatan ?? d.jabatan ?? "-", sub: d.tipe_pegawai === "TA" && d.bidang_keahlian ? d.bidang_keahlian : "" },
                  { icon: <CalendarTodayOutlined sx={{ fontSize: 14 }} />, label: "Masa Kerja", value: masaKerja, sub: d.tanggal_mulai ? `Mulai ${format_date(d.tanggal_mulai)}` : "" },
                  {
                    icon: <BadgeOutlined sx={{ fontSize: 16 }} />,
                    label: "Gaji (SK Aktif)",
                    value: activeSk ? format_rupiah(activeSk.gaji_bulanan) : "-",
                    sub: activeSk ? `${activeSk.nomor_sk ?? ""} · ${format_date(activeSk.tanggal_efektif)}` : "Belum ada SK aktif",
                  },
                ].map((card) => (
                  <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box sx={{ p: 1.25, borderRadius: 1.25, border: "1px solid var(--border)", bgcolor: "var(--card)", height: "100%", display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "var(--muted)",
                          color: "var(--muted-foreground)",
                          border: "1px solid var(--border)",
                          flexShrink: 0,
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>{card.label}</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--foreground)", lineHeight: 1.25, wordBreak: "break-word" }}>{card.value}</Typography>
                        {card.sub && <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)", lineHeight: 1.3, wordBreak: "break-word" }}>{card.sub}</Typography>}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Kontak */}
              <Box sx={{ p: 1.25, borderRadius: 1.25, border: "1px solid var(--border)", bgcolor: "var(--muted)", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                <Box sx={{ minWidth: 160 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Email</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, wordBreak: "break-all" }}>{d.email ?? "-"}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                <Box sx={{ minWidth: 120 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Telepon</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{d.telepon ?? "-"}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                <Box sx={{ minWidth: 140 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Tanggal Mulai</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{format_date(d.tanggal_mulai)}</Typography>
                </Box>
                {d.tipe_pegawai === "TA" && (
                  <>
                    <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                    <Box sx={{ minWidth: 160 }}>
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Kontrak</Typography>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{d.kontrak_mulai ? `${format_date(d.kontrak_mulai)} — ${format_date(d.kontrak_selesai)}` : "-"}</Typography>
                    </Box>
                  </>
                )}
              </Box>

              {/* Riwayat SK */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 24, height: 24, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "var(--foreground)", color: "var(--card)" }}>
                      <HistoryOutlined sx={{ fontSize: 14 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>Riwayat SK</Typography>
                    <Chip label={`${filteredSk.length} data`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", fontWeight: 600, fontSize: "0.7rem" }} />
                  </Stack>
                  <TextField
                    size="small"
                    placeholder="Cari No SK / unit / jabatan..."
                    value={sk_search}
                    onChange={(e) => set_sk_search(e.target.value)}
                    sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 1.25, bgcolor: "var(--card)" } }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchOutlined sx={{ fontSize: 18, color: "var(--muted-foreground)" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Stack>

                {filteredSk.length === 0 ? (
                  <Box sx={{ p: 2, borderRadius: 1.25, border: "1px dashed var(--border)", bgcolor: "var(--card)", textAlign: "center" }}>
                    <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>{skList.length === 0 ? "Belum ada riwayat SK." : "Tidak ada hasil untuk pencarian tersebut."}</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.25} sx={{ maxHeight: 360, overflow: "auto", pr: 0.5, scrollbarWidth: "thin" }}>
                    {filteredSk.map((r: any) => {
                      const isActive = r.status_aktif === "AKTIF";
                      return (
                        <Box
                          key={r.id}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.25,
                            border: "1px solid var(--border)",
                            bgcolor: isActive ? "color-mix(in srgb, var(--primary) 4%, var(--card))" : "var(--card)",
                            display: "flex",
                            gap: 1.25,
                            alignItems: "flex-start",
                            position: "relative",
                            overflow: "hidden",
                            "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 3, bgcolor: isActive ? "var(--primary)" : "var(--border)" },
                          }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              mt: 0.75,
                              bgcolor: isActive ? "var(--primary)" : "var(--muted-foreground)",
                              boxShadow: isActive ? "0 0 0 4px color-mix(in srgb, var(--primary) 18%, transparent)" : "none",
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--foreground)" }}>{r.nomor_sk ?? "-"}</Typography>
                              <Typography sx={{ fontSize: "0.7rem", color: "#374151", bgcolor: "#f3f4f6", px: 0.75, py: 0.2, borderRadius: 1, border: "1px solid #d1d5db" }}>
                                {r.unit_kerja?.nama_unit ?? "-"} {r.unit_kerja?.kode_unit ? `· ${r.unit_kerja.kode_unit}` : ""}
                              </Typography>
                              {r.is_homebase ? (
                                <Chip label="Homebase" size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }} />
                              ) : (
                                <Chip label="Tugas Tambahan" size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }} />
                              )}
                              <StatusChip label={r.status_aktif} variant={status_variant(r.status_aktif)} size="small" />
                            </Stack>
                            <Typography sx={{ fontSize: "0.78rem", color: "var(--muted-foreground)", mt: 0.5, wordBreak: "break-word" }}>
                              {r.jabatan ? `Jabatan: ${r.jabatan}` : "Jabatan: -"} · Efektif {format_date(r.tanggal_efektif)} {r.tanggal_selesai ? `— ${format_date(r.tanggal_selesai)}` : "— sekarang"} · SK {format_date(r.tanggal_sk)}{" "}
                              {r.gaji_bulanan != null ? `· ${format_rupiah(r.gaji_bulanan)}` : ""}
                            </Typography>
                            {r.keterangan && <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", mt: 0.25, fontStyle: "italic", wordBreak: "break-word" }}>{r.keterangan}</Typography>}
                            {r.file_sk && <Typography sx={{ fontSize: "0.72rem", color: "var(--primary)", mt: 0.25, wordBreak: "break-all" }}>File: {r.file_sk}</Typography>}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Box>
          );
        })()}
      </Modal>

      {/* SK quick-add modal — auto-fill pegawai dari detail */}
      <Modal
        open={sk_modal_open}
        onClose={() => {
          set_sk_modal_open(false);
          set_sk_file(null);
        }}
        title={(() => {
          const d: any = (detail_query as any).response?.data ?? (detail_query as any).response;
          return d ? `Tambah SK — ${d.nama}` : "Tambah SK";
        })()}
        description="Form SK terisi otomatis untuk pegawai ini. Lengkapi nomor, tanggal, dan file."
        maxWidth={640}
        actions={[
          {
            label: "Batal",
            variant: "ghost",
            onClick: () => {
              set_sk_modal_open(false);
              set_sk_file(null);
            },
          },
          {
            label: "Simpan SK",
            variant: "primary",
            onClick: () => {
              if (!detail_id || !sk_form.nomor_sk || !sk_form.tanggal_sk || !sk_form.id_unit_kerja) return;
              const tanggal_efektif = sk_custom_effective ? sk_form.tanggal_efektif : sk_form.tanggal_sk;
              if (!tanggal_efektif) return;
              const base: any = {
                nomor_sk: sk_form.nomor_sk,
                tanggal_sk: sk_form.tanggal_sk,
                tanggal_efektif,
                id_pegawai: detail_id,
                id_unit_kerja: sk_form.id_unit_kerja,
              };
              if (sk_form.tanggal_selesai) base.tanggal_selesai = sk_form.tanggal_selesai;
              if (sk_form.jabatan) base.jabatan = sk_form.jabatan;
              if (sk_form.gaji_bulanan !== "" && sk_form.gaji_bulanan != null) base.gaji_bulanan = Number(sk_form.gaji_bulanan);
              if (sk_form.sumber_dana_default) base.sumber_dana_default = sk_form.sumber_dana_default;
              if (sk_form.sumber_dana_default === "RO" && sk_form.ro_id_default) base.ro_id_default = sk_form.ro_id_default;
              if (sk_form.sumber_dana_default === "OPERASIONAL" && sk_form.dana_operasional_id_default) base.dana_operasional_id_default = sk_form.dana_operasional_id_default;
              if (sk_form.is_tugas_tambahan) base.is_tugas_tambahan = true;
              if (sk_form.keterangan) base.keterangan = sk_form.keterangan;
              if (sk_file) base.file = sk_file;
              else if (sk_form.file_sk) base.file_sk = sk_form.file_sk;
              sk_create_mutation([base]);
            },
          },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <Field label="Nomor SK" value={sk_form.nomor_sk} onChange={(v: string) => set_sk_form((f: any) => ({ ...f, nomor_sk: v }))} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Tanggal SK" value={toDate(sk_form.tanggal_sk)} onChange={(d) => set_sk_form((f: any) => ({ ...f, tanggal_sk: fromDate(d) }))} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ThemedDatePicker label="Tanggal Selesai (opsional)" value={toDate(sk_form.tanggal_selesai)} onChange={(d) => set_sk_form((f: any) => ({ ...f, tanggal_selesai: fromDate(d) }))} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1.25, bgcolor: "var(--muted)", border: "1px solid var(--border)" }}>
              <input
                type="checkbox"
                checked={sk_custom_effective}
                onChange={(e) => {
                  set_sk_custom_effective(e.target.checked);
                  if (!e.target.checked) set_sk_form((f: any) => ({ ...f, tanggal_efektif: f.tanggal_sk }));
                }}
                style={{ width: 16, height: 16 }}
              />
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Berlaku mulai tanggal berbeda dari tanggal SK</Typography>
            </Box>
            <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.5 }}>Tanggal berlaku menentukan awal penugasan.</Typography>
          </Grid>
          {sk_custom_effective && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <ThemedDatePicker label="Tanggal Mulai Berlaku" value={toDate(sk_form.tanggal_efektif)} onChange={(d) => set_sk_form((f: any) => ({ ...f, tanggal_efektif: fromDate(d) }))} required />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Jabatan" value={sk_form.jabatan} onChange={(v: string) => set_sk_form((f: any) => ({ ...f, jabatan: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Gaji Bulanan (Rp)" value={sk_form.gaji_bulanan} onChange={(v: string) => set_sk_form((f: any) => ({ ...f, gaji_bulanan: v }))} type="number" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect
              label="Sumber Dana Default"
              value={String(sk_form.sumber_dana_default ?? "OPERASIONAL")}
              options={[
                { value: "OPERASIONAL", label: "Operasional" },
                { value: "RO", label: "RO" },
              ]}
              onChange={(v) => set_sk_form((f: any) => ({ ...f, sumber_dana_default: v }))}
            />
          </Grid>
          {sk_form.sumber_dana_default === "RO" ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect label="RO Default" value={String(sk_form.ro_id_default ?? "")} options={ro_options} onChange={(v) => set_sk_form((f: any) => ({ ...f, ro_id_default: v }))} />
            </Grid>
          ) : (
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect label="Dana Operasional Default" value={String(sk_form.dana_operasional_id_default ?? "")} options={dana_options} onChange={(v) => set_sk_form((f: any) => ({ ...f, dana_operasional_id_default: v }))} />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Unit Kerja" value={String(sk_form.id_unit_kerja ?? "")} options={unit_options} onChange={(v) => set_sk_form((f: any) => ({ ...f, id_unit_kerja: v }))} required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 1.25, bgcolor: sk_form.is_tugas_tambahan ? "#fef3c7" : "var(--muted)", border: "1px solid var(--border)" }}>
              <input type="checkbox" checked={Boolean(sk_form.is_tugas_tambahan)} onChange={(e) => set_sk_form((f: any) => ({ ...f, is_tugas_tambahan: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Tugas tambahan (rangkap, tidak menonaktifkan SK homebase aktif)</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Keterangan" value={sk_form.keterangan} onChange={(v: string) => set_sk_form((f: any) => ({ ...f, keterangan: v }))} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FileUploadInput value={sk_file} onChange={set_sk_file} existingFileUrl={sk_form.file_sk} accept=".pdf" label="File SK (PDF)" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 1, borderRadius: 1.25, bgcolor: "var(--muted)", border: "1px solid var(--border)", display: "flex", gap: 1, alignItems: "center" }}>
              <AssignmentOutlined sx={{ fontSize: 16, color: "var(--primary)" }} />
              <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                Pegawai otomatis terisi:{" "}
                <b style={{ color: "var(--foreground)" }}>
                  {(() => {
                    const d: any = (detail_query as any).response?.data ?? (detail_query as any).response;
                    return d ? `${d.nama} — ${d.nip_nik}` : "-";
                  })()}
                </b>
                . Unit & jabatan default dari SK aktif.
              </Typography>
            </Box>
          </Grid>
        </Grid>
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
