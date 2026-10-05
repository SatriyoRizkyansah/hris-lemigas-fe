import { useState } from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { AddOutlined, EditOutlined } from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import { ActionButton, ActionButtonGroup, InfoCard, Modal, SearchableSelect, ServerDataTable, SoftButton, StatusChip } from "../../components";
import type { Column } from "../../components";
import use_query from "@Hooks/api-use-query";
import use_mutation from "@Hooks/api-use-mutation";
import { resolve_current_role, status_variant, ROLE_OPTIONS, STATUS_AKTIF_OPTIONS, unwrap_list, unwrap_pagination } from "../../common/hris";

function Field({ label, value, onChange, required, disabled, type }: any) {
  return <TextField label={label} size="small" fullWidth required={required} disabled={disabled} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

export function UsersPage() {
  const can_edit = resolve_current_role() === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows_per_page, set_rows_per_page] = useState(10);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [modal_open, set_modal_open] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const list_query = use_query({
    api_tag: "users",
    api_method: "usersGetControllerGetData",
    api_query: [
      {
        query: search || undefined,
        page: page + 1,
        limit: rows_per_page,
        role: role || undefined,
        status: status || undefined,
      } as any,
    ],
  });

  const unit_query = use_query({
    api_tag: "masterUnitKerja",
    api_method: "unitKerjaGetControllerGetData",
    api_query: [{ limit: 200 } as any],
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
    api_tag: "users",
    api_method: "usersPostControllerCreate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const update_mutation = use_mutation({
    api_tag: "users",
    api_method: "usersPutControllerUpdate",
    options: {
      call_back: () => list_query.call_back(),
      will_exec_after_success: () => set_modal_open(false),
    },
  });

  const open_create = () => {
    setEditing(null);
    setForm({
      email: "",
      nama: "",
      password: "",
      role: "KARYAWAN",
      id_unit_kerja: "",
      status: "AKTIF",
    });
    set_modal_open(true);
  };

  const open_edit = (row: any) => {
    setEditing(row);
    setForm({
      email: row.email ?? "",
      nama: row.nama ?? "",
      password: "",
      role: row.role ?? "KARYAWAN",
      id_unit_kerja: row.id_unit_kerja ?? "",
      status: row.status ?? "AKTIF",
    });
    set_modal_open(true);
  };

  const submit = () => {
    if (editing) {
      update_mutation([
        editing.id,
        {
          nama: form.nama,
          password: form.password || undefined,
          role: form.role,
          id_unit_kerja: form.id_unit_kerja || undefined,
          status: form.status,
        },
      ]);
    } else {
      create_mutation([
        {
          email: form.email,
          nama: form.nama,
          password: form.password,
          role: form.role,
          id_unit_kerja: form.id_unit_kerja || undefined,
          status: form.status,
        },
      ]);
    }
  };

  const columns: Column<any>[] = [
    {
      id: "nama",
      label: "Pengguna",
      sortable: true,
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>{String(row.nama ?? "-")}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{String(row.email ?? "-")}</Typography>
        </Box>
      ),
    },
    {
      id: "role",
      label: "Role",
      render: (_, row) => <StatusChip label={String(row.nama_role ?? row.role ?? "-")} variant={row.role === "SUPERADMIN" ? "danger" : row.role === "KOORDINATOR" ? "warning" : "info"} size="small" />,
    },
    { id: "nama_unit_kerja", label: "Unit Kerja", hideMobile: true, render: (_, row) => String(row.nama_unit_kerja ?? "-") },
    {
      id: "status",
      label: "Status",
      render: (_, row) => <StatusChip label={String(row.status ?? "-")} variant={status_variant(row.status)} size="small" />,
    },
    ...(can_edit
      ? [
          {
            id: "aksi",
            label: "Aksi",
            align: "right" as const,
            render: (_: any, row: any) => (
              <ActionButtonGroup>
                <ActionButton variant="edit" title="Ubah" icon={<EditOutlined fontSize="small" />} onClick={() => open_edit(row)} />
              </ActionButtonGroup>
            ),
          },
        ]
      : []),
  ];

  return (
    <DashboardLayout
      sectionTitle="Pengguna"
      title="Pengguna"
      headerTitle="Manajemen Pengguna"
      headerDescription="Akun pengguna sistem beserta role dan status."
      headerAction={
        can_edit ? (
          <SoftButton startIcon={<AddOutlined />} onClick={open_create}>
            Tambah Pengguna
          </SoftButton>
        ) : undefined
      }
    >
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        {list_query.error && !list_query.is_loading ? (
          <InfoCard message="Gagal memuat data pengguna." variant="error" />
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            title="Daftar Pengguna"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Cari nama / email..."
            filters={[
              {
                id: "role",
                label: "Role",
                value: role,
                options: [{ label: "Semua Role", value: "" }, ...ROLE_OPTIONS],
                onChange: (v: string) => {
                  setRole(v);
                  setPage(0);
                },
              },
              {
                id: "status",
                label: "Status",
                value: status,
                options: [{ label: "Semua Status", value: "" }, ...STATUS_AKTIF_OPTIONS],
                onChange: (v: string) => {
                  setStatus(v);
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
            emptyStateLabel="Belum ada data pengguna."
          />
        )}
      </Box>

      <Modal
        open={modal_open}
        onClose={() => set_modal_open(false)}
        title={editing ? `Ubah Pengguna: ${editing.nama}` : "Tambah Pengguna"}
        description={editing ? "Kosongkan password jika tidak ingin mengubahnya." : "Lengkapi data pengguna baru."}
        maxWidth={560}
        actions={[
          { label: "Batal", variant: "ghost", onClick: () => set_modal_open(false) },
          { label: editing ? "Simpan Perubahan" : "Simpan", variant: "primary", onClick: submit },
        ]}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <Field label="Email" value={form.email} onChange={(v: string) => set_field("email", v)} required disabled={Boolean(editing)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Nama" value={form.nama} onChange={(v: string) => set_field("nama", v)} required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label={editing ? "Password Baru (opsional)" : "Password"} value={form.password} onChange={(v: string) => set_field("password", v)} required={!editing} type="password" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Role" value={String(form.role ?? "")} options={ROLE_OPTIONS} onChange={(v) => set_field("role", v)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SearchableSelect label="Status" value={String(form.status ?? "AKTIF")} options={STATUS_AKTIF_OPTIONS} onChange={(v) => set_field("status", v)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <SearchableSelect label="Unit Kerja" value={String(form.id_unit_kerja ?? "")} options={unit_options} onChange={(v) => set_field("id_unit_kerja", v)} loading={unit_query.is_loading} placeholder="Tanpa unit kerja..." />
          </Grid>
        </Grid>
      </Modal>
    </DashboardLayout>
  );
}

export default UsersPage;
