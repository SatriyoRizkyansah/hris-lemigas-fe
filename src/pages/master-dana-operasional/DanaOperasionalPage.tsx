import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, TextField, Typography, Chip } from "@mui/material";
import { EditOutlined, DeleteOutlined, VisibilityOutlined, AccountBalanceWalletOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, SearchableSelect, ServerDataTable } from "../../components";
import { RupiahField } from "../../components/common/RupiahField";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, current_year, format_rupiah, unwrap_list, unwrap_pagination, kategori_kamar_label, kategori_kamar_percent, KATEGORI_KAMAR_OPTIONS } from "../../common/hris";
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

export function DanaOperasionalPage() {
  const navigate = useNavigate();
  const role = resolve_current_role();
  const can_edit = role === "superadmin";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [id_unit, setIdUnit] = useState("");
  const [kategori_filter, setKategoriFilter] = useState("");
  const [tahun_fiscal, setTahunFiscal] = useState(String(current_year()));
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
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerGetData",
    api_query: [
      { query: search || undefined, page: page + 1, limit: rows_per_page, id_unit_koordinator: id_unit || undefined, kategori_kamar: kategori_filter || undefined, tahun_fiscal: tahun_fiscal ? Number(tahun_fiscal) : undefined } as any,
    ],
  });
  const unit_query = use_query({ api_tag: "masterUnitKerja", api_method: "unitKerjaGetControllerGetData", api_query: [{ tipe_unit: "KOORDINATOR", limit: 200 } as any] });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);
  const unit_options = unwrap_list(unit_query.response).map((u: any) => ({ value: String(u.id), label: `${u.kode_unit} — ${u.nama_unit}` }));

  const set_field = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));
  const update_mutation = use_mutation({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerUpdate",
    options: { call_back: () => list_query.call_back(), will_exec_after_success: () => set_modal_open(false) },
  });
  const delete_mutation = use_mutation({ api_tag: "masterDanaOperasional", api_method: "danaOperasionalControllerRemove", options: { call_back: () => list_query.call_back() } });

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      id_unit_koordinator: row.id_unit_koordinator ?? row.unit_koordinator_id ?? "",
      id_rekening: row.id_rekening ?? row.rekening_id ?? "",
      tahun_fiscal: String(row.tahun_fiscal ?? current_year()),
      total_plafon: row.total_plafon ?? "",
      kategori_kamar: row.kategori_kamar ?? "LAINNYA",
    });
    set_modal_open(true);
  };
  const submit = () => {
    if (editing) update_mutation([editing.id, { total_plafon: Number(form.total_plafon), id_rekening: form.id_rekening || undefined }]);
  };
  const open_detail = (row: any) => navigate(`/dana-operasional/${row.id}`);

  const kamar_summary = (() => {
    const map: Record<string, { total_plafon: number; total_terpakai: number; total_sisa: number; count: number }> = {};
    rows.forEach((r: any) => {
      const k = r.kategori_kamar ?? "LAINNYA";
      if (!map[k]) map[k] = { total_plafon: 0, total_terpakai: 0, total_sisa: 0, count: 0 };
      map[k].total_plafon += Number(r.total_plafon ?? 0);
      map[k].total_terpakai += Number(r.total_terpakai ?? 0);
      map[k].total_sisa += Number(r.sisa_saldo ?? r.total_plafon ?? 0);
      map[k].count += 1;
    });
    return map;
  })();

  const columns: Column<any>[] = [
    { id: "nama_unit_koordinator", label: "Unit Koordinator", width: 180, sortable: true, render: (_: any, row: any) => <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{String(row.nama_unit_koordinator ?? "-")}</Typography> },
    {
      id: "kategori_kamar",
      label: "Kamar",
      width: 120,
      render: (_: any, row: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Chip
            label={kategori_kamar_label(row.kategori_kamar)}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.7rem",
              color: row.kategori_kamar === "LAINNYA" ? "var(--muted-foreground)" : "#1d4ed8",
              bgcolor: row.kategori_kamar === "LAINNYA" ? "var(--muted)" : "#dbeafe",
              border: "1px solid",
              borderColor: row.kategori_kamar === "LAINNYA" ? "var(--border)" : "#bfdbfe",
              "& .MuiChip-label": { px: 1 },
            }}
          />
          <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{kategori_kamar_percent(row.kategori_kamar)}</Typography>
        </Box>
      ),
    },
    { id: "tahun_fiscal", label: "Tahun Fiscal", align: "center", width: 95, render: (_: any, row: any) => String(row.tahun_fiscal ?? "-") },
    { id: "total_plafon", label: "Plafon", align: "right", width: 125, render: (_: any, row: any) => format_rupiah(row.total_plafon) },
    { id: "total_terpakai", label: "Sisa Saldo", align: "right", width: 125, hideMobile: true, render: (_: any, row: any) => format_rupiah(row.total_terpakai) },
    {
      id: "sisa_saldo",
      label: "Terpakai",
      align: "right",
      width: 125,
      render: (_: any, row: any) => <Typography sx={{ fontSize: "0.825rem", fontWeight: 600, color: (row.sisa_saldo ?? 0) >= 0 ? "var(--foreground)" : "#ef4444" }}>{format_rupiah(row.sisa_saldo)}</Typography>,
    },
    {
      id: "aksi",
      label: "Aksi",
      align: "right" as const,
      render: (_: any, row: any) => (
        <ActionButtonGroup>
          <ActionButton variant="edit" title="Detail" icon={<VisibilityOutlined fontSize="small" />} onClick={() => open_detail(row)} />
          {can_edit && <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />}
          {can_edit && <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => setConfirmTarget(row)} />}
        </ActionButtonGroup>
      ),
    },
  ];

  return (
    <DashboardLayout
      sectionTitle="Master Data"
      title="Dana Operasional"
      headerTitle="Master Dana Operasional"
      headerDescription="Plafon dana operasional per unit koordinator dan tahun fiscal. Wallet dibuat otomatis dari distribusi margin proyek. Klik baris untuk lihat ledger detail."
      headerAction={undefined}
    >
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.length > 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr 1fr" }, gap: 1.5 }}>
            {KATEGORI_KAMAR_OPTIONS.filter((o) => o.value !== "LAINNYA").map((opt) => {
              const s = kamar_summary[opt.value];
              const has = Boolean(s);
              const sisa = has ? s.total_terpakai : 0;
              const low = has && sisa < s.total_plafon * 0.15 && sisa >= 0;
              const over = has && sisa < 0;
              return (
                <Box
                  key={opt.value}
                  onClick={() => {
                    setKategoriFilter(opt.value);
                    setPage(0);
                  }}
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: over ? "#fecaca" : low ? "#fde68a" : "var(--border)",
                    bgcolor: over ? "#fef2f2" : low ? "#fffbeb" : "var(--card)",
                    cursor: "pointer",
                    opacity: has ? 1 : 0.55,
                    transition: "all 0.15s",
                    "&:hover": { borderColor: "var(--primary)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                    <AccountBalanceWalletOutlined sx={{ fontSize: 16, color: has ? "var(--primary)" : "var(--muted-foreground)" }} />
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.4, color: "var(--muted-foreground)" }}>{opt.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: over ? "#dc2626" : "var(--foreground)" }}>{has ? format_rupiah(s.total_plafon) : "—"}</Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)", mt: 0.25 }}>{has ? `Terpakai ${format_rupiah(s.total_terpakai)} · Sisa ${format_rupiah(sisa)} · ${s.count} wallet` : "Belum ada wallet"}</Typography>
                  {over && <Chip label="Over budget" size="small" color="error" sx={{ mt: 0.75, height: 18, fontSize: "0.65rem" }} />}
                  {low && !over && <Chip label="Saldo menipis" size="small" color="warning" sx={{ mt: 0.75, height: 18, fontSize: "0.65rem" }} />}
                </Box>
              );
            })}
          </Box>
        )}
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data dana operasional." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Dana Operasional"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari unit koordinator..."
            filters={[
              {
                id: "tahun_fiscal",
                label: "Tahun Fiscal",
                value: tahun_fiscal,
                options: [
                  { label: "Semua Tahun", value: "" },
                  ...[0, 1, 2, 3].map((i) => {
                    const y = current_year() - i;
                    return { label: String(y), value: String(y) };
                  }),
                ],
                onChange: (v: string) => {
                  setTahunFiscal(v);
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
              {
                id: "kategori_kamar",
                label: "Kamar",
                value: kategori_filter,
                options: [{ label: "Semua Kamar", value: "" }, ...KATEGORI_KAMAR_OPTIONS],
                onChange: (v: string) => {
                  setKategoriFilter(v);
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
            emptyStateLabel="Belum ada data dana operasional."
            onRowClick={open_detail}
          />
        )}
      </div>
      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title="Ubah Dana Operasional"
        description="Perbarui total plafon."
        maxWidth={560}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: "Simpan Perubahan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect
              label="Unit Koordinator"
              value={String(form.id_unit_koordinator ?? "")}
              options={unit_options}
              onChange={(v) => set_field("id_unit_koordinator", v)}
              loading={unit_query.is_loading}
              placeholder="Pilih unit koordinator..."
              disabled
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tahun Fiscal" value={form.tahun_fiscal} onChange={(v: string) => set_field("tahun_fiscal", v)} required type="number" disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RupiahField label="Total Plafon" value={form.total_plafon} onChange={(n) => set_field("total_plafon", n)} required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect
              label="Rekening Fisik"
              value={String(form.id_rekening ?? "")}
              options={[{ value: "", label: "Belum dipetakan" }, ...rekening_options]}
              onChange={(v) => set_field("id_rekening", v)}
              placeholder="Pilih rekening untuk rekonsiliasi..."
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Kamar (Kategori)" value={String(form.kategori_kamar ?? "LAINNYA")} options={KATEGORI_KAMAR_OPTIONS} onChange={(v) => set_field("kategori_kamar", v)} disabled placeholder="Pilih kamar..." />
            {<Typography sx={{ fontSize: "0.7rem", color: "var(--muted-foreground)", mt: 0.5 }}>{kategori_kamar_percent(form.kategori_kamar)} dari margin</Typography>}
          </Grid>
        </Grid>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm_target)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirm_target) delete_mutation([confirm_target.id]);
        }}
        title="Hapus Dana Operasional"
        message={`Dana operasional ${confirm_target?.tahun_fiscal ?? ""} untuk "${confirm_target?.nama_unit_koordinator ?? ""}" akan dihapus.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}
export default DanaOperasionalPage;
