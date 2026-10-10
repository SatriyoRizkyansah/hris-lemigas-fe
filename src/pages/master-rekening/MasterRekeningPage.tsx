import { useEffect, useMemo, useState } from "react";
import { Box, Grid, Switch, TextField, Typography } from "@mui/material";
import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, ConfirmDialog, InfoCard, Modal, ServerDataTable, SoftButton, StatusChip, type Column } from "../../components";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { format_date, resolve_current_role } from "../../common/hris";

const api = async (path: string, init?: RequestInit) => {
  const token = auth_signal.value.selectedToken || "";
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(", ") : (body?.message ?? "Permintaan gagal"));
  return body?.data ?? body;
};

export function MasterRekeningPage() {
  const can_manage = ["superadmin", "keuangan"].includes(resolve_current_role());
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmTarget, setConfirmTarget] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/master-rekening");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat rekening");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.nama_bank, row.nomor_rekening, row.nama_rekening].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nama_bank: "", nomor_rekening: "", nama_rekening: "", status_aktif: true });
    setModalOpen(true);
  };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ nama_bank: row.nama_bank ?? "", nomor_rekening: row.nomor_rekening ?? "", nama_rekening: row.nama_rekening ?? "", status_aktif: row.status_aktif === "AKTIF" });
    setModalOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      const payload = { nama_bank: form.nama_bank?.trim(), nomor_rekening: form.nomor_rekening?.trim(), nama_rekening: form.nama_rekening?.trim(), ...(editing ? { status_aktif: Boolean(form.status_aktif) } : {}) };
      await api(editing ? `/api/master-rekening/${editing.id}` : "/api/master-rekening", { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal menyimpan rekening");
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!confirmTarget) return;
    try {
      await api(`/api/master-rekening/${confirmTarget.id}`, { method: "DELETE" });
      setConfirmTarget(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal menghapus rekening");
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nama_rekening",
      label: "Rekening",
      width: 260,
      render: (_v, row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.84rem" }}>{row.nama_rekening}</Typography>
          <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>{row.nama_bank}</Typography>
        </Box>
      ),
    },
    { id: "nomor_rekening", label: "Nomor Rekening", width: 190, render: (_v, row) => <Typography sx={{ fontFamily: "monospace", fontSize: "0.84rem" }}>{row.nomor_rekening || "Kas Tunai"}</Typography> },
    { id: "status_aktif", label: "Status", width: 110, render: (_v, row) => <StatusChip label={row.status_aktif === "AKTIF" ? "Aktif" : "Nonaktif"} variant={row.status_aktif === "AKTIF" ? "success" : "danger"} size="small" /> },
    { id: "updated_at", label: "Diperbarui", width: 130, hideMobile: true, render: (_v, row) => format_date(row.updated_at) },
    {
      id: "aksi",
      label: "Aksi",
      width: 100,
      align: "right",
      render: (_v, row) =>
        can_manage ? (
          <ActionButtonGroup>
            <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => openEdit(row)} />
            <ActionButton variant="delete" title="Hapus" icon={<DeleteOutlined fontSize="small" />} onClick={() => setConfirmTarget(row)} />
          </ActionButtonGroup>
        ) : null,
    },
  ];

  return (
    <DashboardLayout sectionTitle="Master Data" title="Rekening" headerTitle="Master Rekening Bank & Kas" headerDescription="Kelola rekening fisik BLU, rekening valas, deposito, dan kas tunai untuk rekonsiliasi.">
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {error && (
          <Box sx={{ mb: 1.5 }}>
            <InfoCard message={error} variant="error" />
          </Box>
        )}
        <ServerDataTable
          columns={columns}
          data={filteredRows}
          title="Daftar Rekening Fisik"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari bank, nama, atau nomor rekening..."
          isLoading={loading}
          totalRows={filteredRows.length}
          page={0}
          rowsPerPage={50}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
          rowsPerPageOptions={[50]}
          compact
          emptyStateLabel="Belum ada rekening fisik."
        />
        {can_manage && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
            <SoftButton startIcon={<AddOutlined />} onClick={openCreate}>
              Tambah Rekening
            </SoftButton>
          </Box>
        )}
      </Box>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Rekening" : "Tambah Rekening"}
        maxWidth={560}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => setModalOpen(false) },
          { label: saving ? "Menyimpan..." : "Simpan", variant: "primary", onClick: save, disabled: saving },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField label="Nama Bank" size="small" fullWidth required value={form.nama_bank ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, nama_bank: e.target.value }))} placeholder="Bank Mandiri / Kas Tunai" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Nomor Rekening" size="small" fullWidth required value={form.nomor_rekening ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, nomor_rekening: e.target.value }))} placeholder="1010002727772 atau KAS-TUNAI" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Nama Rekening" size="small" fullWidth required value={form.nama_rekening ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, nama_rekening: e.target.value }))} placeholder="RPL 019 BLU LEMIGAS UNTUK OPS P." />
          </Grid>
          {editing && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Switch checked={Boolean(form.status_aktif)} onChange={(e) => setForm((f: any) => ({ ...f, status_aktif: e.target.checked }))} />
                <Typography sx={{ fontSize: "0.85rem" }}>Rekening aktif</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={remove}
        title="Hapus Rekening"
        message={`Rekening "${confirmTarget?.nama_rekening ?? ""}" akan dihapus.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}
export default MasterRekeningPage;
