import { useState, useEffect, useRef } from "react";
import { Box, Divider, FormControl, Grid, InputLabel, ListSubheader, MenuItem, Select, TextField, Typography } from "@mui/material";
import { AddOutlined, EditOutlined, BlockOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, current_year, current_month, format_rupiah, status_variant, BULAN_OPTIONS, SUMBER_DANA_OPTIONS, unwrap_list, unwrap_pagination } from "../../common/hris";

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

export function AlokasiGajiPage() {
  const role = resolve_current_role();
  const can_edit = role === "superadmin" || role === "koordinator";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [bulan, setBulan] = useState(String(current_month()));
  const [tahun, setTahun] = useState(String(current_year()));
  const [sumber, setSumber] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);
  const [sk_autofill, set_sk_autofill] = useState<any>(null); // SK aktif pegawai terpilih
  const autofill_applied = useRef(false); // guard agar tidak override saat edit

  // Fetch SK aktif saat pegawai dipilih (hanya mode create)
  const sk_query = use_query({
    api_tag: "sk",
    api_method: "skGetControllerGetRiwayat",
    api_query: [form.id_pegawai || "", { status_aktif: "AKTIF", limit: 5 }],
    should_running_if: Boolean(form.id_pegawai) && !editing,
    options: { should_disable_error_message: true },
  });

  const list_query = use_query({
    api_tag: "alokasiGajiTa",
    api_method: "alokasiGetControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        periode_bulan: Number(bulan) || undefined,
        periode_tahun: Number(tahun) || undefined,
        sumber_dana: sumber || undefined,
      } as any,
    ],
  });

  const pegawai_query = use_query({
    api_tag: "masterPegawai",
    api_method: "pegawaiGetControllerGetData",
    api_query: [{ tipe_pegawai: "TA", status_aktif: "AKTIF", limit: 200 } as any],
  });

  const ro_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const do_query = use_query({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerGetData",
    api_query: [{ limit: 200 } as any],
  });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);

  const pegawai_options = unwrap_list(pegawai_query.response).map((p: any) => ({
    value: String(p.id),
    label: `${p.nama} — ${p.nip_nik}`,
  }));

  // Build map of pegawai id to data for root coordinator lookup
  const pegawaiMap = new Map<string, any>();
  unwrap_list(pegawai_query.response).forEach((p: any) => {
    pegawaiMap.set(p.id, p);
  });
  const selectedPegawai = form.id_pegawai ? pegawaiMap.get(form.id_pegawai) : null;
  const selectedUnit = selectedPegawai?.unit_kerja ?? null;
  const rootKoordinatorId = selectedUnit?.tipe_unit === "KOORDINATOR" ? selectedUnit.id : (selectedUnit?.parent_unit_id ?? null);

  const ro_options_all = unwrap_list(ro_query.response).map((r: any) => ({
    value: String(r.id),
    label: `${r.kode_ro} — ${r.nama_ro}`,
    unitKoordinatorId: r.unit_koordinator?.id ?? r.id_unit_koordinator ?? r.unit_koordinator_id ?? null,
  }));
  const ro_options = rootKoordinatorId ? ro_options_all.filter((o) => o.unitKoordinatorId === rootKoordinatorId) : [];

  const do_options_all = unwrap_list(do_query.response).map((d: any) => ({
    value: String(d.id),
    label: `${d.tahun_fiscal} — ${format_rupiah(d.total_plafon)} (${d.nama_unit_koordinator ?? "-"})`,
    unitKoordinatorId: d.unit_koordinator?.id ?? d.id_unit_koordinator ?? d.unit_koordinator_id ?? null,
  }));
  const do_options = rootKoordinatorId ? do_options_all.filter((o) => o.unitKoordinatorId === rootKoordinatorId) : [];

  const set_field = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  // Auto-fill dari SK aktif ketika pegawai dipilih (create mode only)
  useEffect(() => {
    if (editing || !form.id_pegawai) return;
    const sk_list = unwrap_list(sk_query.response);
    // Prioritaskan SK homebase aktif
    const active_sk = sk_list.find((s: any) => s.is_homebase) ?? sk_list[0] ?? null;
    if (!active_sk) {
      set_sk_autofill(null);
      return;
    }
    if (!autofill_applied.current) {
      autofill_applied.current = true;
      set_sk_autofill(active_sk);
      setForm((f: any) => ({
        ...f,
        jumlah: active_sk.gaji_bulanan ? String(active_sk.gaji_bulanan) : f.jumlah,
        sumber_dana: active_sk.sumber_dana_default ?? f.sumber_dana ?? "RO",
        id_ro: active_sk.ro_id_default ?? f.id_ro ?? "",
        id_dana_operasional: active_sk.dana_operasional_id_default ?? f.id_dana_operasional ?? "",
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sk_query.response]);

  // Reset autofill guard + dependent fields saat pegawai berubah
  useEffect(() => {
    if (editing) return;
    autofill_applied.current = false;
    set_sk_autofill(null);
    setForm((f: any) => ({
      ...f,
      jumlah: "",
      id_ro: "",
      id_dana_operasional: "",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id_pegawai]);

  // Reset RO/DO saat tahun berubah
  useEffect(() => {
    setForm((f: any) => ({
      ...f,
      id_ro: "",
      id_dana_operasional: "",
    }));
  }, [form.periode_tahun]);

  const create_mutation = use_mutation({
    api_tag: "alokasiGajiTa",
    api_method: "alokasiPostControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "alokasiGajiTa",
    api_method: "alokasiPutControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const cancel_mutation = use_mutation({
    api_tag: "alokasiGajiTa",
    api_method: "alokasiDeleteControllerCancel",
    options: { call_back: () => list_query.call_back() },
  });

  const open_create = () => {
    setEditing(null);
    autofill_applied.current = false;
    set_sk_autofill(null);
    setForm({
      id_pegawai: "",
      periode_bulan: bulan || String(current_month()),
      periode_tahun: tahun || String(current_year()),
      sumber_dana: "RO",
      id_ro: "",
      id_dana_operasional: "",
      jumlah: "",
      keterangan: "",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      id_pegawai: row.id_pegawai ?? "",
      periode_bulan: String(row.periode_bulan ?? ""),
      periode_tahun: String(row.periode_tahun ?? ""),
      sumber_dana: row.sumber_dana ?? "RO",
      id_ro: row.id_ro ?? "",
      id_dana_operasional: row.id_dana_operasional ?? "",
      jumlah: row.jumlah ?? "",
      keterangan: row.keterangan ?? "",
    });
    set_modal_open(true);
  };

  const submit = () => {
    const base = {
      sumber_dana: form.sumber_dana,
      id_ro: form.sumber_dana === "RO" ? form.id_ro || undefined : undefined,
      id_dana_operasional: form.sumber_dana === "OPERASIONAL" ? form.id_dana_operasional || undefined : undefined,
      jumlah: Number(form.jumlah),
      keterangan: form.keterangan || undefined,
    };
    if (editing) {
      update_mutation([editing.id, base]);
    } else {
      create_mutation([
        {
          ...base,
          id_pegawai: form.id_pegawai,
          periode_bulan: Number(form.periode_bulan),
          periode_tahun: Number(form.periode_tahun),
        },
      ]);
    }
  };

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
    {
      id: "periode",
      label: "Periode",
      hideMobile: true,
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
      render: (_, row) => String(row.nama_ro ?? row.id_dana_operasional ?? "-"),
    },
    { id: "jumlah", label: "Jumlah", align: "right", render: (_, row) => format_rupiah(row.jumlah) },
    {
      id: "status",
      label: "Status",
      render: (_, row) => <StatusChip label={String(row.status ?? "-")} variant={status_variant(row.status)} size="small" />,
    },
    { id: "keterangan", label: "Keterangan", hideMobile: true, render: (_, row) => String(row.keterangan ?? "-") },
    ...(can_edit
      ? [
          {
            id: "aksi",
            label: "Aksi",
            align: "right" as const,
            render: (_: any, row: any) => (
              <ActionButtonGroup>
                <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />
                <ActionButton variant="reject" title="Batalkan" icon={<BlockOutlined fontSize="small" />} onClick={() => setConfirmTarget(row)} />
              </ActionButtonGroup>
            ),
          },
        ]
      : []),
  ];

  return (
    <DashboardLayout
      sectionTitle="Transaksi"
      title="Alokasi Gaji TA"
      headerTitle="Alokasi Gaji Tenaga Ahli"
      headerDescription="Alokasi gaji TA dari RO atau dana operasional per periode."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Alokasi
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data alokasi gaji." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Alokasi Gaji"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari nama pegawai..."
            filters={[
              {
                id: "periode_bulan",
                label: "Bulan",
                value: bulan,
                options: [{ label: "Semua Bulan", value: "" }, ...BULAN_OPTIONS],
                onChange: (v: string) => {
                  setBulan(v);
                  setPage(0);
                },
              },
              {
                id: "periode_tahun",
                label: "Tahun",
                value: tahun,
                options: Array.from({ length: 5 }, (_, i) => {
                  const y = String(current_year() - i);
                  return { label: y, value: y };
                }),
                onChange: (v: string) => {
                  setTahun(v);
                  setPage(0);
                },
              },
              {
                id: "sumber_dana",
                label: "Sumber Dana",
                value: sumber,
                options: [{ label: "Semua Sumber", value: "" }, ...SUMBER_DANA_OPTIONS],
                onChange: (v: string) => {
                  setSumber(v);
                  setPage(0);
                },
              },
            ]}
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
            emptyStateLabel="Belum ada data alokasi gaji."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? "Ubah Alokasi Gaji" : "Tambah Alokasi Gaji"}
        description={editing ? "Perbarui data alokasi gaji." : "Lengkapi data alokasi gaji baru."}
        maxWidth={680}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Pegawai (TA)" value={String(form.id_pegawai ?? "")} options={pegawai_options} onChange={(v) => set_field("id_pegawai", v)} loading={pegawai_query.is_loading} disabled={Boolean(editing)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Periode Bulan" value={String(form.periode_bulan ?? "")} options={BULAN_OPTIONS} onChange={(v) => set_field("periode_bulan", v)} disabled={Boolean(editing)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Periode Tahun" value={form.periode_tahun} onChange={(v: string) => set_field("periode_tahun", v)} required type="number" disabled={Boolean(editing)} />
          </Grid>

          {/* Grouped sumber dana: RO (Direct Cost) dan Dana Operasional (Margin) */}
          <Grid size={{ xs: 12 }}>            <FormControl fullWidth size="small" required>
              <InputLabel shrink={Boolean(form.id_ro || form.id_dana_operasional || form.sumber_dana)}>
                Sumber Dana
              </InputLabel>
              <Select
                value={
                  form.sumber_dana === "RO" && form.id_ro
                    ? `RO::${form.id_ro}`
                    : form.sumber_dana === "OPERASIONAL" && form.id_dana_operasional
                    ? `DO::${form.id_dana_operasional}`
                    : ""
                }
                label="Sumber Dana"
                displayEmpty
                onChange={(e) => {
                  const val = String(e.target.value);
                  if (val.startsWith("RO::")) {
                    set_field("sumber_dana", "RO");
                    set_field("id_ro", val.replace("RO::", ""));
                    set_field("id_dana_operasional", "");
                  } else if (val.startsWith("DO::")) {
                    set_field("sumber_dana", "OPERASIONAL");
                    set_field("id_dana_operasional", val.replace("DO::", ""));
                    set_field("id_ro", "");
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border)" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--muted-foreground)" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
                }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 320, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" } } }}
              >
                {/* Group: RO */}
                <ListSubheader sx={{ bgcolor: "var(--muted)", color: "var(--muted-foreground)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.5, lineHeight: "28px", px: 2 }}>
                  ▸ RO — DIRECT COST
                </ListSubheader>
                {ro_query.is_loading ? (
                  <MenuItem disabled value="" sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", pl: 3 }}>Memuat RO...</MenuItem>
                ) : ro_options.length === 0 ? (
                  <MenuItem disabled value="" sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", pl: 3 }}>Tidak ada RO tersedia</MenuItem>
                ) : (
                  ro_options.map((r) => (
                    <MenuItem key={r.value} value={`RO::${r.value}`} sx={{ fontSize: "0.85rem", pl: 3, "&.Mui-selected": { bgcolor: "color-mix(in srgb, var(--primary) 12%, transparent)" } }}>
                      {r.label}
                    </MenuItem>
                  ))
                )}

                <Divider sx={{ my: 0.5 }} />

                {/* Group: Dana Operasional */}
                <ListSubheader sx={{ bgcolor: "var(--muted)", color: "var(--muted-foreground)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.5, lineHeight: "28px", px: 2 }}>
                  ▸ DANA OPERASIONAL — MARGIN
                </ListSubheader>
                {do_query.is_loading ? (
                  <MenuItem disabled value="" sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", pl: 3 }}>Memuat Dana Operasional...</MenuItem>
                ) : do_options.length === 0 ? (
                  <MenuItem disabled value="" sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)", pl: 3 }}>Tidak ada Dana Operasional tersedia</MenuItem>
                ) : (
                  do_options.map((d) => (
                    <MenuItem key={d.value} value={`DO::${d.value}`} sx={{ fontSize: "0.85rem", pl: 3, "&.Mui-selected": { bgcolor: "color-mix(in srgb, var(--primary) 12%, transparent)" } }}>
                      {d.label}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Jumlah */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Jumlah (Rp)"
              size="small"
              fullWidth
              required
              type="number"
              value={form.jumlah ?? ""}
              onChange={(e) => set_field("jumlah", e.target.value)}
              helperText={
                sk_autofill?.gaji_bulanan && !editing
                  ? `Dari SK ${sk_autofill.nomor_sk ?? ""}: ${format_rupiah(sk_autofill.gaji_bulanan)}`
                  : undefined
              }
              slotProps={{ formHelperText: { sx: { color: "var(--muted-foreground)", fontSize: "0.72rem", ml: 0 } } }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Keterangan" value={form.keterangan} onChange={(v: string) => set_field("keterangan", v)} multiline />
          </Grid>
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) cancel_mutation([confirm_target.id]);
        }}
        title="Batalkan Alokasi"
        message={`Alokasi gaji "${confirm_target?.nama_pegawai ?? ""}" periode ${confirm_target?.periode_bulan ?? ""}/${confirm_target?.periode_tahun ?? ""} akan dibatalkan.`}
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tutup"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default AlokasiGajiPage;
