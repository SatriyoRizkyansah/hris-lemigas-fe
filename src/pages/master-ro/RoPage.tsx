import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, TextField, Typography, Chip } from "@mui/material";
import { AddOutlined, EditOutlined, DeleteOutlined, VisibilityOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip } from "../../components";
import { RupiahField } from "../../components/common/RupiahField";
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

const isIncomplete = (row: any) => !row.no_kontrak || !row.pj || !row.no_sk || !row.mulai_sk || !row.berakhir_sk;

export function RoPage() {
  const navigate = useNavigate();
  const role = resolve_current_role();
  const can_edit = role === "superadmin";
  const can_edit_own = role === "superadmin" || role === "koordinator";
  const can_delete = role === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [id_proyek, setIdProyek] = useState("");
  const [id_unit, setIdUnit] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);
  const [rekening_options, setRekeningOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const load_rekening = async () => {
      try {
        const token = auth_signal.value.selectedToken || "";
        const response = await fetch("/api/master-rekening", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const body = await response.json();
        const rows = body?.data ?? body ?? [];
        setRekeningOptions((Array.isArray(rows) ? rows : []).filter((row: any) => row.status_aktif === "AKTIF").map((row: any) => ({ value: row.id, label: `${row.nama_rekening} — ${row.nomor_rekening}` })));
      } catch {
        setRekeningOptions([]);
      }
    };
    void load_rekening();
  }, []);

  const list_query = use_query({
    api_tag: "masterRo",
    api_method: "roControllerGetData",
    api_query: [{ query: search || undefined, page: page + 1, limit: rows_per_page, id_proyek: id_proyek || undefined, id_unit_koordinator: id_unit || undefined } as any],
  });

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
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });
  const delete_mutation = use_mutation({ api_tag: "masterRo", api_method: "roControllerRemove", options: { call_back: () => list_query.call_back() } });

  const open_create = () => {
    setEditing(null);
    setForm({
      kode_ro: "",
      nama_ro: "",
      id_proyek: "",
      id_unit_koordinator: "",
      id_rekening: "",
      tahun_fiscal: String(current_year()),
      total_plafon: "",
      no_kontrak: "",
      pj: "",
      no_sk: "",
      mulai_sk: "",
      berakhir_sk: "",
      status_ro: "AKTIF",
    });
    set_modal_open(true);
  };
  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      kode_ro: row.kode_ro ?? "",
      nama_ro: row.nama_ro ?? "",
      id_proyek: row.id_proyek ?? row.proyek_id ?? "",
      id_unit_koordinator: row.id_unit_koordinator ?? row.unit_koordinator_id ?? "",
      id_rekening: row.id_rekening ?? row.rekening_id ?? "",
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
          id_rekening: form.id_rekening || undefined,
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
          id_rekening: form.id_rekening || undefined,
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
    navigate(`/ro/${row.id}`);
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
    {
      id: "status_ro",
      label: "Status",
      width: 130,
      render: (_: any, row: any) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap" }}>
          <StatusChip label={String(row.status_ro ?? "AKTIF")} variant={status_variant(row.status_ro)} size="small" />
          {isIncomplete(row) && <Chip label="Belum lengkap" size="small" color="warning" sx={{ height: 18, fontSize: "0.65rem" }} />}
        </Box>
      ),
    },
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
      width: 160,
      render: (_: any, row: any) => (
        <ActionButtonGroup>
          <ActionButton variant="edit" title="Detail" icon={<VisibilityOutlined fontSize="small" />} onClick={() => open_detail(row)} />
          {can_edit_own && <ActionButton variant="edit" title={isIncomplete(row) ? "Lengkapi" : "Ubah"} icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />}
          {can_delete && <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => setConfirmTarget(row)} />}
        </ActionButtonGroup>
      ),
    },
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
                <SearchableSelect label="Proyek" value={String(form.id_proyek ?? "")} options={proyek_options} onChange={(v: string) => set_field("id_proyek", v)} loading={proyek_query.is_loading} placeholder="Pilih proyek..." required />
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
          <Grid size={{ xs: 12 }}>
            <SearchableSelect
              label="Rekening Fisik"
              value={String(form.id_rekening ?? "")}
              options={[{ value: "", label: "Belum dipetakan" }, ...rekening_options]}
              onChange={(v: string) => set_field("id_rekening", v)}
              placeholder="Pilih rekening untuk rekonsiliasi..."
            />
          </Grid>
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
            <SearchableSelect label="Status RO" value={String(form.status_ro ?? "AKTIF")} options={STATUS_RO_OPTIONS} onChange={(v: string) => set_field("status_ro", v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Mulai SK" value={form.mulai_sk} onChange={(v: string) => set_field("mulai_sk", v)} type="date" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Berakhir SK" value={form.berakhir_sk} onChange={(v: string) => set_field("berakhir_sk", v)} type="date" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <RupiahField label="Total Plafon" value={form.total_plafon} onChange={(n) => set_field("total_plafon", n)} required />
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
