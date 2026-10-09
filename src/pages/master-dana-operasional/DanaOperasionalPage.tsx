import { useState } from "react";
import { Box, Grid, TextField, Typography, Divider } from "@mui/material";
import { AddOutlined, EditOutlined, DeleteOutlined, VisibilityOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, DataTable, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, current_year, format_rupiah, format_date, unwrap_list, unwrap_pagination } from "../../common/hris";
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
  const can_edit = resolve_current_role() === "superadmin";
  const can_manage_ledger = can_edit || resolve_current_role() === "koordinator";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [id_unit, setIdUnit] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [confirm_target, setConfirmTarget] = useState<any>(null);

  const [detail_id, setDetailId] = useState<string | null>(null);
  const [detail_open, setDetailOpen] = useState(false);
  const [trx_modal_open, setTrxModalOpen] = useState(false);
  const [trx_form, setTrxForm] = useState<any>({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
  const [trx_editing, setTrxEditing] = useState<any>(null);

  const list_query = use_query({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerGetData",
    api_query: [{ query: search || undefined, page: page + 1, limit: rows_per_page, id_unit_koordinator: id_unit || undefined } as any],
  });
  const detail_query = use_query({ api_tag: "masterDanaOperasional", api_method: "danaOperasionalControllerGetDetail", api_query: [detail_id as any] as any, should_running_if: Boolean(detail_id) } as any);
  const ledger_do_query = use_query({ api_tag: "masterDanaOperasional", api_method: "danaOperasionalControllerGetLedger", api_query: [detail_id as string], should_running_if: Boolean(detail_id) } as any);
  const unit_query = use_query({ api_tag: "masterUnitKerja", api_method: "unitKerjaGetControllerGetData", api_query: [{ tipe_unit: "KOORDINATOR", limit: 200 } as any] });

  const body: any = list_query.response ?? {};
  const rows: any[] = unwrap_list(body);
  const pagination = unwrap_pagination(body);
  const unit_options = unwrap_list(unit_query.response).map((u: any) => ({ value: String(u.id), label: `${u.kode_unit} — ${u.nama_unit}` }));

  const set_field = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));
  const create_mutation = use_mutation({ api_tag: "masterDanaOperasional", api_method: "danaOperasionalControllerCreate", options: { call_back: () => list_query.call_back(), will_exec_after_success: () => set_modal_open(false) } });
  const update_mutation = use_mutation({
    api_tag: "masterDanaOperasional",
    api_method: "danaOperasionalControllerUpdate",
    options: {
      call_back: () => {
        list_query.call_back();
        if (detail_id) detail_query.call_back();
      },
      will_exec_after_success: () => set_modal_open(false),
    },
  });
  const delete_mutation = use_mutation({ api_tag: "masterDanaOperasional", api_method: "danaOperasionalControllerRemove", options: { call_back: () => list_query.call_back() } });

  const open_create = () => {
    setEditing(null);
    setForm({ id_unit_koordinator: "", tahun_fiscal: String(current_year()), total_plafon: "" });
    set_modal_open(true);
  };
  const open_edit = (row: any) => {
    setEditing(row);
    setForm({ id_unit_koordinator: row.id_unit_koordinator ?? "", tahun_fiscal: String(row.tahun_fiscal ?? current_year()), total_plafon: row.total_plafon ?? "" });
    set_modal_open(true);
  };
  const submit = () => {
    if (editing) update_mutation([editing.id, { total_plafon: Number(form.total_plafon) }]);
    else create_mutation([{ id_unit_koordinator: form.id_unit_koordinator, tahun_fiscal: Number(form.tahun_fiscal), total_plafon: Number(form.total_plafon) }]);
  };
  const open_detail = (row: any) => {
    setDetailId(String(row.id));
    setDetailOpen(true);
  };

  const detail: any = (detail_query.response as any)?.data ?? (detail_query.response as any) ?? null;
  const d = detail?.data ?? detail;

  // Ledger dari endpoint /ledger — running balance dari backend
  const ledger_resp: any = (ledger_do_query.response as any)?.data ?? (ledger_do_query.response as any) ?? null;
  const ledger: any[] = ledger_resp?.list ?? ledger_resp ?? [];
  const total_debit = ledger_resp?.total_debit ?? 0;
  const total_kredit = ledger_resp?.total_kredit ?? 0;
  const saldo_ledger = ledger_resp?.saldo_ledger ?? 0;
  const alokasi_list: any[] = d?.alokasi_list ?? [];

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
    const url = trx_editing ? `/api/dana-operasional/${detail_id}/transaksi/${trx_editing.id}` : `/api/dana-operasional/${detail_id}/transaksi`;
    const method = trx_editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setTrxModalOpen(false);
      setTrxEditing(null);
      setTrxForm({ nama_kegiatan: "", no_kuitansi: "", tanggal: "", debit: "", kredit: "", keterangan: "" });
      detail_query.call_back();
      ledger_do_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal simpan transaksi");
    }
  };
  const handle_trx_delete = async (tid: string) => {
    if (!detail_id || !confirm("Hapus transaksi ini?")) return;
    const token = auth_signal.value.selectedToken || "";
    try {
      const res = await fetch(`/api/dana-operasional/${detail_id}/transaksi/${tid}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(await res.text());
      detail_query.call_back();
      ledger_do_query.call_back();
    } catch (e: any) {
      alert(e?.message ?? "Gagal hapus transaksi");
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nama_unit_koordinator",
      label: "Unit Koordinator",
      sortable: true,
      render: (_: any, row: any) => <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama_unit_koordinator ?? "-")}</Typography>,
    },
    { id: "tahun_fiscal", label: "Tahun Fiscal", align: "center", render: (_: any, row: any) => String(row.tahun_fiscal ?? "-") },
    { id: "total_plafon", label: "Plafon", align: "right", render: (_: any, row: any) => format_rupiah(row.total_plafon) },
    { id: "total_terpakai", label: "Terpakai", align: "right", hideMobile: true, render: (_: any, row: any) => format_rupiah(row.total_terpakai) },
    {
      id: "sisa_saldo",
      label: "Sisa Saldo",
      align: "right",
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

  const ledger_columns: Column<any>[] = [
    { id: "no", label: "No", width: 50, render: (_: any, _r: any, idx?: number) => String((idx ?? 0) + 1) },
    { id: "nama_kegiatan", label: "Nama Kegiatan", width: 200, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-word", fontSize: "0.82rem" }}>{String(r.nama_kegiatan ?? "-")}</Box> },
    { id: "no_kuitansi", label: "No Kuitansi", width: 130, render: (_: any, r: any) => <Box sx={{ wordBreak: "break-all", fontSize: "0.8rem" }}>{String(r.no_kuitansi ?? "-")}</Box> },
    { id: "tanggal", label: "Tanggal", width: 110, render: (_: any, r: any) => format_date(r.tanggal) },
    { id: "debit", label: "Debit", align: "right", width: 120, render: (_: any, r: any) => (Number(r.debit) ? format_rupiah(r.debit) : "-") },
    { id: "kredit", label: "Kredit", align: "right", width: 120, render: (_: any, r: any) => (Number(r.kredit) ? format_rupiah(r.kredit) : "-") },
    { id: "saldo", label: "Saldo Berjalan", align: "right", width: 120, render: (_: any, r: any) => <Box sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.82rem", color: (r.saldo ?? 0) < 0 ? "#dc2626" : "inherit" }}>{format_rupiah(r.saldo ?? 0)}</Box> },
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
      title="Dana Operasional"
      headerTitle="Master Dana Operasional"
      headerDescription="Plafon dana operasional per unit koordinator dan tahun fiscal. Klik baris untuk lihat detail dana."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Dana Operasional
          </SoftButton>
        ) : undefined
      }
    >
      <div style={{ padding: "20px 24px" }}>
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
            emptyStateLabel="Belum ada data dana operasional."
            onRowClick={open_detail}
          />
        )}
      </div>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? "Ubah Dana Operasional" : "Tambah Dana Operasional"}
        description={editing ? "Perbarui total plafon." : "Lengkapi data dana operasional baru."}
        maxWidth={560}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
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
              disabled={Boolean(editing)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Tahun Fiscal" value={form.tahun_fiscal} onChange={(v: string) => set_field("tahun_fiscal", v)} required type="number" disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
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
        title={d ? `Detail Dana: ${d.nama_unit_koordinator ?? "-"} — ${d.tahun_fiscal ?? ""}` : "Detail Dana Operasional"}
        description="Rincian ledger dan aliran dana operasional."
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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <Box sx={{ p: 2, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>PLAFON AWAL</Typography>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, mt: 0.5 }}>{format_rupiah(d.total_plafon)}</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.25 }}>{String(d.nama_unit_koordinator ?? "-")} · {String(d.tahun_fiscal ?? "-")}</Typography>
              </Box>
              <Box sx={{ p: 2, border: "1px solid var(--border)", borderRadius: 2, bgcolor: "var(--card)" }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>TOTAL PENGELUARAN</Typography>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, mt: 0.5, color: total_debit > 0 ? "#dc2626" : undefined }}>{format_rupiah(total_debit)}</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.25 }}>Kredit masuk: {format_rupiah(total_kredit)}</Typography>
              </Box>
              <Box sx={{ p: 2, border: "1px solid var(--border)", borderRadius: 2, bgcolor: saldo_ledger < 0 ? "#fef2f2" : "var(--card)", borderColor: saldo_ledger < 0 ? "#fecaca" : "var(--border)" }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: 0.5 }}>SISA SALDO AKHIR</Typography>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, mt: 0.5, color: saldo_ledger < 0 ? "#dc2626" : "#16a34a" }}>{format_rupiah(saldo_ledger)}</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", mt: 0.25 }}>Running balance dari ledger</Typography>
              </Box>
            </Box>
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Ledger Dana Operasional</Typography>
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
                  <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600 }}>SISA SALDO AKHIR</Typography>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: saldo_ledger < 0 ? "#dc2626" : "#16a34a" }}>{format_rupiah(saldo_ledger)}</Typography>
                </Box>
              </Box>
            </Box>
            <Divider />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1 }}>Alokasi Gaji TA (dari dana ini)</Typography>
              {alokasi_list.length === 0 ? (
                <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Belum ada alokasi gaji TA untuk dana ini.</Typography>
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
