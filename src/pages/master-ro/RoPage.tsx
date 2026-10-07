import { useState } from "react";
import { Box, Grid, TextField, Typography, Divider, Stack, Chip } from "@mui/material";
import { AddOutlined, EditOutlined, DeleteOutlined, VisibilityOutlined, UploadFileOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, DataTable, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, current_year, format_rupiah, format_date, status_variant, unwrap_list, unwrap_pagination, STATUS_RO_OPTIONS } from "../../common/hris";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";

function Field({ label, value, onChange, required, disabled, type }: any) {
  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      type={type}
      value={value ?? ""}
      slotProps={type === "date" ? { inputLabel: { shrink: true } } : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function RoPage() {
  const can_edit = resolve_current_role() === "superadmin";
  const can_manage_ledger = can_edit || resolve_current_role() === "koordinator";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [id_proyek, setIdProyek] = useState("");
  const [id_unit, setIdUnit] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  // detail
  const [detail_id, setDetailId] = useState<string | null>(null);
  const [detail_open, setDetailOpen] = useState(false);
  const [rab_file, setRabFile] = useState<File | null>(null);
  const [rab_uploading, setRabUploading] = useState(false);
  const [trx_modal_open, setTrxModalOpen] = useState(false);
  const [trx_form, setTrxForm] = useState<any>({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
  const [trx_editing, setTrxEditing] = useState<any>(null);

  const list_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetData",
    api_query: [{ query: search || undefined, page: page + 1, limit: rows_per_page, id_proyek: id_proyek || undefined, id_unit_koordinator: id_unit || undefined } as any],
  });

  const detail_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetDetail",
    api_query: [detail_id as any] as any,
    should_running_if: Boolean(detail_id),
  } as any);

  const proyek_query = use_query({ api_tag: "masterProyek", api_method: "proyekControllerGetData", api_query: [{ limit: 200 } as any] });
  const unit_query = use_query({ api_tag: "masterUnitKerja", api_method: "unitKerjaGetControllerGetData", api_query: [{ tipe_unit: "KOORDINATOR", limit: 200 } as any] });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);

  const proyek_options = unwrap_list(proyek_query.response).map((p: any) => ({ value: String(p.id), label: `${p.kode_proyek} — ${p.nama_proyek}` }));
  const unit_options = unwrap_list(unit_query.response).map((u: any) => ({ value: String(u.id), label: `${u.kode_unit} — ${u.nama_unit}` }));

  const set_field = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const create_mutation = use_mutation({ api_tag: "masterRo", api_method: "roControllerCreate", options: { call_back: () => list_query.call_back(), will_exec_after_success: () => set_modal_open(false) } });
  const update_mutation = use_mutation({
    api_tag: "masterRo",
    api_method: "roControllerUpdate",
    options: {
      call_back: () => {
        list_query.call_back();
        if (detail_id) detail_query.call_back();
      },
      will_exec_after_success: () => set_modal_open(false),
    },
  });
  const delete_mutation = use_mutation({ api_tag: "masterRo", api_method: "roControllerRemove", options: { call_back: () => list_query.call_back() } });

  const open_create = () => {
    setEditing(null);
    setForm({ kode_ro: "", nama_ro: "", id_proyek: "", id_unit_koordinator: "", tahun_fiscal: String(current_year()), total_plafon: "", no_kontrak: "", pj: "", no_sk: "", mulai_sk: "", berakhir_sk: "", status_ro: "AKTIF" });
    set_modal_open(true);
  };
  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      kode_ro: row.kode_ro ?? "",
      nama_ro: row.nama_ro ?? "",
      id_proyek: row.id_proyek ?? row.proyek_id ?? "",
      id_unit_koordinator: row.id_unit_koordinator ?? row.unit_koordinator_id ?? "",
      tahun_fiscal: String(row.tahun_fiscal ?? current_year()),
      total_plafon: row.total_plafon ?? "",
      no_kontrak: row.no_kontrak ?? "",
      pj: row.pj ?? "",
      no_sk: row.no_sk ?? "",
      mulai_sk: row.mulai_sk ? String(row.mulai_sk).slice(0, 10) : "",
      berakhir_sk: row.berakhir_sk ? String(row.berakhir_sk).slice(0, 10) : "",
      status_ro: row.status_ro ?? "AKTIF",
    });
    set_modal_open(true);
  };
  const submit = () => {
    if (editing) {
      update_mutation([
        editing.id,
        {
          nama_ro: form.nama_ro,
          total_plafon: Number(form.total_plafon),
          no_kontrak: form.no_kontrak || undefined,
          pj: form.pj || undefined,
          no_sk: form.no_sk || undefined,
          mulai_sk: form.mulai_sk || undefined,
          berakhir_sk: form.berakhir_sk || undefined,
          status_ro: form.status_ro || undefined,
        },
      ]);
    } else {
      create_mutation([
        {
          kode_ro: form.kode_ro,
          nama_ro: form.nama_ro,
          id_proyek: form.id_proyek,
          id_unit_koordinator: form.id_unit_koordinator,
          tahun_fiscal: Number(form.tahun_fiscal),
          total_plafon: Number(form.total_plafon),
          no_kontrak: form.no_kontrak || undefined,
          pj: form.pj || undefined,
          no_sk: form.no_sk || undefined,
          mulai_sk: form.mulai_sk || undefined,
          berakhir_sk: form.berakhir_sk || undefined,
          status_ro: form.status_ro || undefined,
        },
      ]);
    }
  };

  const open_detail = (row: any) => {
    setDetailId(String(row.id));
    setDetailOpen(true);
  };

  const detail: any = (detail_query.response as any)?.data ?? (detail_query.response as any) ?? null;
  // unwrap detail: api returns { data: { ... } } or { data: { data: ... } }
  const d = detail?.data ?? detail;
  const ledger: any[] = d?.transaksi_list ?? d?.list ?? [];
  const total_debit = d?.total_debit ?? ledger.reduce((s: number, r: any) => s + Number(r.debit ?? 0), 0);
  const total_kredit = d?.total_kredit ?? ledger.reduce((s: number, r: any) => s + Number(r.kredit ?? 0), 0);
  const saldo_ledger = d?.saldo_ledger ?? total_kredit - total_debit;
  const alokasi_list: any[] = d?.alokasi_list ?? [];

  const handle_rab_upload = async () => {
    if (!detail_id || !rab_file) return;
    setRabUploading(true);
    try {
      const token = auth_signal.value.selectedToken || "";
      const fd = new FormData();
      fd.append("file", rab_file);
      const res = await fetch(`/api/ro/${detail_id}/rab`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      if (!res.ok) throw new Error(await res.text());
      setRabFile(null);
      detail_query.call_back();
      list_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal upload RAB");
    } finally {
      setRabUploading(false);
    }
  };

  const handle_trx_submit = async () => {
    if (!detail_id) return;
    const token = auth_signal.value.selectedToken || "";
    const payload: any = {
      nama_kegiatan: trx_form.nama_kegiatan,
      no_kuitansi: trx_form.no_kuitansi || undefined,
      tanggal: trx_form.tanggal,
      debit: Number(trx_form.debit) || 0,
      kredit: Number(trx_form.kredit) || 0,
      keterangan: trx_form.keterangan || undefined,
    };
    const url = trx_editing ? `/api/ro/${detail_id}/transaksi/${trx_editing.id}` : `/api/ro/${detail_id}/transaksi`;
    const method = trx_editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setTrxModalOpen(false);
      setTrxEditing(null);
      setTrxForm({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
      detail_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal simpan transaksi");
    }
  };

  const handle_trx_delete = async (tid: string) => {
    if (!detail_id || !confirm("Hapus transaksi ini?")) return;
    const token = auth_signal.value.selectedToken || "";
    try {
      const res = await fetch(`/api/ro/${detail_id}/transaksi/${tid}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(await res.text());
      detail_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal hapus transaksi");
    }
  };

  const columns: Column<any>[] = [
    { id: "no", label: "No", width: 55, render: (_: any, _row: any, idx?: number) => String(page * rows_per_page + (idx ?? 0) + 1) },
    {
      id: "nama_ro",
      label: "Nama RO",
      width: 220,
      sortable: true,
      render: (_: any, row: any) => (
        <Box sx={{ overflow: "hidden" }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(row.nama_ro ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {String(row.kode_ro ?? "-")} · {String(row.nama_proyek ?? row.proyek?.nama_proyek ?? "-")}
          </Typography>
        </Box>
      ),
    },
    { id: "status_ro", label: "Status", width: 110, render: (_: any, row: any) => <StatusChip label={String(row.status_ro ?? "AKTIF")} variant={status_variant(row.status_ro)} size="small" /> },
    {
      id: "nama_unit_koordinator",
      label: "Koor",
      width: 150,
      hideMobile: true,
      render: (_: any, row: any) => <Box sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.85rem" }}>{String(row.nama_unit_koordinator ?? row.unit_koordinator?.nama_unit ?? "-")}</Box>,
    },
    { id: "no_sk", label: "No SK", width: 150, render: (_: any, row: any) => <Box sx={{ fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(row.no_sk ?? "-")}</Box> },
    { id: "mulai_sk", label: "Mulai SK", width: 115, hideMobile: true, render: (_: any, row: any) => format_date(row.mulai_sk) },
    { id: "berakhir_sk", label: "Berakhir SK", width: 115, hideMobile: true, render: (_: any, row: any) => format_date(row.berakhir_sk) },
    { id: "total_plafon", label: "Anggaran", align: "right", width: 140, render: (_: any, row: any) => format_rupiah(row.total_plafon) },
    {
      id: "sisa_saldo",
      label: "Sisa",
      align: "right",
      width: 130,
      hideMobile: true,
      render: (_: any, row: any) => <Typography sx={{ fontSize: "0.825rem", fontWeight: 600, color: (row.sisa_saldo ?? 0) >= 0 ? "var(--foreground)" : "#ef4444", whiteSpace: "nowrap" }}>{format_rupiah(row.sisa_saldo)}</Typography>,
    },
    {
      id: "aksi",
      label: "Aksi",
      align: "right" as const,
      width: 140,
      render: (_: any, row: any) => (
        <ActionButtonGroup>
          <ActionButton variant="edit" title="Detail" icon={<VisibilityOutlined fontSize="small" />} onClick={() => open_detail(row)} />
          {can_edit && <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />}
          {can_edit && <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => setConfirmTarget(row)} />}
        </ActionButtonGroup>
      ),
    },
  ];

  const ledger_columns: Column<any>[] = [
    { id: "no", label: "No", width: 50, render: (_: any, _r: any, idx?: number) => String((idx ?? 0) + 1) },
    { id: "nama_kegiatan", label: "Nama Kegiatan", width: 200, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-word", fontSize: "0.82rem" }}>{String(r.nama_kegiatan ?? "-")}</Box> },
    { id: "no_kuitansi", label: "No Kuitansi", width: 130, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-all", fontSize: "0.8rem" }}>{String(r.no_kuitansi ?? "-")}</Box> },
    { id: "tanggal", label: "Tanggal", width: 110, render: (_: any, r: any) => format_date(r.tanggal) },
    { id: "debit", label: "Debit", align: "right", width: 120, render: (_: any, r: any) => (Number(r.debit) ? format_rupiah(r.debit) : "-") },
    { id: "kredit", label: "Kredit", align: "right", width: 120, render: (_: any, r: any) => (Number(r.kredit) ? format_rupiah(r.kredit) : "-") },
    { id: "saldo", label: "Saldo", align: "right", width: 120, render: (_: any, r: any) => format_rupiah(r.saldo ?? r.saldo_ledger ?? 0) },
    { id: "keterangan", label: "Keterangan", width: 160, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-word", fontSize: "0.8rem" }}>{String(r.keterangan ?? "-")}</Box> },
    ...(can_manage_ledger
      ? [
          {
            id: "aksi_trx",
            label: "Aksi",
            align: "right" as const,
            width: 90,
            render: (_: any, r: any) => (
              <ActionButtonGroup>
                <ActionButton
                  variant="edit"
                  title="Ubah"
                  icon={<EditOutlined fontSize="small" />}
                  onClick={() => {
                    setTrxEditing(r);
                    setTrxForm({
                      nama_kegiatan: r.nama_kegiatan ?? "",
                      no_kuitansi: r.no_kuitansi ?? "",
                      tanggal: String(r.tanggal ?? "").slice(0, 10),
                      debit: String(r.debit ?? ""),
                      kredit: String(r.kredit ?? ""),
                      keterangan: r.keterangan ?? "",
                    });
                    setTrxModalOpen(true);
                  }}
                />
                <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => handle_trx_delete(r.id)} />
              </ActionButtonGroup>
            ),
          } as any,
        ]
      : []),
  ];

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="RO"
      headerTitle="Master Rencana Operasi (RO)"
      headerDescription="Plafon RO per proyek dan unit koordinator beserta pemakaian anggaran. Klik baris untuk lihat detail dana."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah RO
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data RO." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar RO"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari kode / nama RO..."
            filters={[
              {
                id: "id_proyek",
                label: "Proyek",
                value: id_proyek,
                options: [{ label: "Semua Proyek", value: "" }, ...proyek_options],
                onChange: (v: string) => {
                  setIdProyek(v);
                  setPage(0);
                },
              },
              {
                id: "id_unit_koordinator",
                label: "Unit Koordinator",
                value: id_unit,
                options: [{ label: "Semua Unit", value: "" }, ...unit_options],
                onChange: (v: string) => {
                  setIdUnit(v);
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
            emptyStateLabel="Belum ada data RO."
            onRowClick={open_detail}
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah RO: ${editing.nama_ro}` : "Tambah RO"}
        description={editing ? "Perbarui data RO." : "Lengkapi data RO baru."}
        maxWidth={700}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kode RO" value={form.kode_ro} onChange={(v: string) => set_field("kode_ro", v)} required disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tahun Fiscal" value={form.tahun_fiscal} onChange={(v: string) => set_field("tahun_fiscal", v)} required type="number" disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama RO" value={form.nama_ro} onChange={(v: string) => set_field("nama_ro", v)} required />
          </Grid>
          {!editing && (
            <>
              <Grid size={{ xs: 12 }}>
                <SearchableSelect label="Proyek" value={String(form.id_proyek ?? "")} options={proyek_options} onChange={(v) => set_field("id_proyek", v)} loading={proyek_query.is_loading} placeholder="Pilih proyek..." required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <SearchableSelect
                  label="Unit Koordinator"
                  value={String(form.id_unit_koordinator ?? "")}
                  options={unit_options}
                  onChange={(v) => set_field("id_unit_koordinator", v)}
                  loading={unit_query.is_loading}
                  placeholder="Pilih unit koordinator..."
                  required
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="No Kontrak" value={form.no_kontrak} onChange={(v: string) => set_field("no_kontrak", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="PJ" value={form.pj} onChange={(v: string) => set_field("pj", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="No SK" value={form.no_sk} onChange={(v: string) => set_field("no_sk", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Status RO" value={String(form.status_ro ?? "AKTIF")} options={STATUS_RO_OPTIONS} onChange={(v) => set_field("status_ro", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Mulai SK" value={form.mulai_sk} onChange={(v: string) => set_field("mulai_sk", v)} type="date" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Berakhir SK" value={form.berakhir_sk} onChange={(v: string) => set_field("berakhir_sk", v)} type="date" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Total Plafon (Rp)" value={form.total_plafon} onChange={(v: string) => set_field("total_plafon", v)} required type="number" />
          </Grid>
        </Grid>
      </Modal>

      <Modal
        open={detail_open}
        onClose={() => {
          setDetailOpen(false);
          setDetailId(null);
        }}
        title={d ? `Detail RO: ${d.nama_ro ?? "-"}` : "Detail RO"}
        description="Rincian dana RO, RAB, dan aliran dana."
        maxWidth={1100}
        actions={[
          {
            label: "Tutup",
            variant: "ghost",
            onClick: () => {
              setDetailOpen(false);
              setDetailId(null);
            },
          },
        ]}
      >
        {!d ? (
          <InfoCard message="Memuat detail..." variant="info" />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, p: 2, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--muted)" }}>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>NAMA RO</Typography>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>{String(d.nama_ro ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>NO. KONTRAK</Typography>
                <Typography sx={{ fontSize: "0.85rem" }}>{String(d.no_kontrak ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>KOOR</Typography>
                <Typography sx={{ fontSize: "0.85rem" }}>{String(d.nama_unit_koordinator ?? d.unit_koordinator?.nama_unit ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>PJ</Typography>
                <Typography sx={{ fontSize: "0.85rem" }}>{String(d.pj ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>ANGGARAN</Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{format_rupiah(d.total_plafon)}</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                  Terpakai {format_rupiah(d.total_terpakai)} · Sisa {format_rupiah(d.sisa_saldo)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>STATUS / SK</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <StatusChip label={String(d.status_ro ?? "AKTIF")} variant={status_variant(d.status_ro)} size="small" />
                  <Typography sx={{ fontSize: "0.78rem" }}>{String(d.no_sk ?? "-")}</Typography>
                </Stack>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                  {format_date(d.mulai_sk)} — {format_date(d.berakhir_sk)}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: { sm: "1 / span 2" } }}>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600, mb: 0.5 }}>UPLOAD RAB</Typography>
                {d.file_rab ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={String(d.file_rab).split("/").pop()} size="small" />
                    <a href={`/api/uploaded/${d.file_rab}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>
                      Lihat file
                    </a>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>Belum ada file RAB</Typography>
                )}
                {can_manage_ledger && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "center" }}>
                    <input type="file" accept=".pdf,.xlsx,.xls" onChange={(e) => setRabFile(e.target.files?.[0] ?? null)} />
                    <SoftButton size="small" startIcon={<UploadFileOutlined />} disabled={!rab_file || rab_uploading} onClick={handle_rab_upload}>
                      {rab_uploading ? "Mengunggah..." : "Upload RAB"}
                    </SoftButton>
                  </Box>
                )}
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Ledger Dana RO</Typography>
                {can_manage_ledger && (
                  <SoftButton
                    size="small"
                    startIcon={<AddOutlined />}
                    onClick={() => {
                      setTrxEditing(null);
                      setTrxForm({ nama_kegiatan: "", no_kuitansi: "", tanggal: new Date().toISOString().slice(0, 10), debit: "", kredit: "", keterangan: "" });
                      setTrxModalOpen(true);
                    }}
                  >
                    Tambah Transaksi
                  </SoftButton>
                )}
              </Box>
              <DataTable columns={ledger_columns} data={ledger} title="" hideSearch hidePagination emptyState={<Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Belum ada transaksi ledger.</Typography>} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, mt: 1.5, p: 1.5, border: "1px solid var(--border)", borderRadius: 1, bgcolor: "var(--card)" }}>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>TOTAL DEBIT</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#dc2626" }}>{format_rupiah(total_debit)}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>TOTAL KREDIT</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a" }}>{format_rupiah(total_kredit)}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>SALDO</Typography>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>{format_rupiah(saldo_ledger)}</Typography>
                </Box>
              </Box>
            </Box>

            <Divider />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1 }}>Alokasi Gaji TA (dari RO ini)</Typography>
              {alokasi_list.length === 0 ? (
                <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Belum ada alokasi gaji TA untuk RO ini.</Typography>
              ) : (
                <Box sx={{ border: "1px solid var(--border)", borderRadius: 1, overflow: "hidden" }}>
                  {alokasi_list.map((a: any) => (
                    <Box key={a.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1, borderBottom: "1px solid var(--border)", "&:last-child": { borderBottom: 0 } }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{String(a.pegawai?.nama ?? a.pegawai_id ?? "-")}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                          {String(a.pegawai?.nip_nik ?? "")} · {String(a.periode_bulan ?? "")}/{String(a.periode_tahun ?? "")}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{format_rupiah(a.jumlah)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Modal>

      <Modal
        open={trx_modal_open}
        onClose={() => setTrxModalOpen(false)}
        title={trx_editing ? "Ubah Transaksi" : "Tambah Transaksi"}
        description="Isi debit untuk pengeluaran, kredit untuk uang masuk."
        maxWidth={600}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => setTrxModalOpen(false) },
          { label: trx_editing ? "Simpan" : "Tambah", variant: "primary", onClick: handle_trx_submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama Kegiatan" value={trx_form.nama_kegiatan} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, nama_kegiatan: v }))} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="No Kuitansi" value={trx_form.no_kuitansi} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, no_kuitansi: v }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tanggal" value={trx_form.tanggal} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, tanggal: v }))} type="date" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Debit (Rp)" value={trx_form.debit} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, debit: v }))} type="number" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Kredit (Rp)" value={trx_form.kredit} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, kredit: v }))} type="number" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Keterangan" value={trx_form.keterangan} onChange={(v: string) => setTrxForm((f: any) => ({ ...f, keterangan: v }))} />
          </Grid>
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Hapus RO"
        message={`RO "${confirm_target?.nama_ro ?? ""}" akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}
export default RoPage;
