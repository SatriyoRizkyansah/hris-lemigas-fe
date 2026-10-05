import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  Chip,
  Divider,
} from "@mui/material";
import {
  PeopleOutline,
  TrendingUp,
  CheckCircleOutline,
  ErrorOutline,
  EditOutlined,
  DeleteOutlined,
  VisibilityOutlined,
  AddOutlined,
  DownloadOutlined,
} from "@mui/icons-material";
import { DashboardLayout } from "../../layouts";
import {
  ServerDataTable,
  DataTable,
  ActionButton,
  ActionButtonGroup,
  ActionMenuButton,
  Modal,
  ConfirmDialog,
  SearchableSelect,
  StatusChip,
  SoftButton,
  InfoCard,
} from "../../components";
import type { Column } from "../../components";

// ─── Dummy Data ───────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  joined: string;
}

const DUMMY_USERS: User[] = [
  { id: "1", name: "Budi Santoso", email: "budi@example.com", role: "Admin", status: "active", joined: "2024-01-15" },
  { id: "2", name: "Siti Rahayu", email: "siti@example.com", role: "Manager", status: "active", joined: "2024-02-03" },
  { id: "3", name: "Ahmad Fauzi", email: "ahmad@example.com", role: "Staff", status: "pending", joined: "2024-03-22" },
  { id: "4", name: "Dewi Lestari", email: "dewi@example.com", role: "Staff", status: "inactive", joined: "2023-11-08" },
  { id: "5", name: "Rizky Pratama", email: "rizky@example.com", role: "Admin", status: "active", joined: "2024-04-01" },
  { id: "6", name: "Maya Indah", email: "maya@example.com", role: "Manager", status: "active", joined: "2024-04-10" },
  { id: "7", name: "Fajar Nugroho", email: "fajar@example.com", role: "Staff", status: "pending", joined: "2024-05-02" },
  { id: "8", name: "Rina Kusuma", email: "rina@example.com", role: "Staff", status: "active", joined: "2024-05-14" },
];

const STATUS_MAP: Record<User["status"], { label: string; variant: "success" | "neutral" | "warning" }> = {
  active:   { label: "Aktif",    variant: "success" },
  inactive: { label: "Nonaktif", variant: "neutral" },
  pending:  { label: "Pending",  variant: "warning" },
};

const ROLE_OPTIONS = [
  { value: "__all", label: "Semua Role" },
  { value: "Admin",   label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Staff",   label: "Staff" },
];

const STATUS_OPTIONS = [
  { value: "__all",    label: "Semua Status" },
  { value: "active",   label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
  { value: "pending",  label: "Pending" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", mt: 0.25 }}>
          {label}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)", mt: 0.1 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--foreground)", fontSize: "1rem" }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: "0.825rem", color: "var(--muted-foreground)", mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: "var(--border)", mb: 2.5 }} />
      {children}
    </Box>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage() {
  // ── Table state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("__all");
  const [statusFilter, setStatusFilter] = useState("__all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // ── Modal / dialog state ─────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // ── SearchableSelect state ───────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // ── Filtered data ────────────────────────────────────────────────────────
  const filtered = DUMMY_USERS.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "__all" || u.role === roleFilter;
    const matchStatus = statusFilter === "__all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Table columns ────────────────────────────────────────────────────────
  const columns: Column<User>[] = [
    {
      id: "name",
      label: "Nama",
      width: "25%",
      render: (_, row) => (
        <Box>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
            {row.name}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
            {row.email}
          </Typography>
        </Box>
      ),
    },
    {
      id: "role",
      label: "Role",
      width: "15%",
      render: (_, row) => (
        <Chip
          label={row.role}
          size="small"
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: "6px",
            backgroundColor: "var(--accent)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            "& .MuiChip-label": { px: 1.25 },
          }}
        />
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "15%",
      render: (_, row) => {
        const s = STATUS_MAP[row.status];
        return <StatusChip label={s.label} variant={s.variant} />;
      },
    },
    {
      id: "joined",
      label: "Bergabung",
      width: "15%",
      render: (_, row) => (
        <Typography sx={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
          {new Date(row.joined).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
        </Typography>
      ),
    },
    {
      id: "id",
      label: "Aksi",
      align: "center",
      width: "15%",
      render: (_, row) => (
        <ActionButtonGroup>
          <ActionButton
            variant="view"
            title="Lihat Detail"
            icon={<VisibilityOutlined fontSize="small" />}
            onClick={() => { setSelectedUser(row); setModalOpen(true); }}
          />
          <ActionButton
            variant="edit"
            title="Edit"
            icon={<EditOutlined fontSize="small" />}
            onClick={() => alert(`Edit: ${row.name}`)}
          />
          <ActionMenuButton
            items={[
              {
                label: "Download Data",
                icon: <DownloadOutlined fontSize="small" />,
                onClick: () => alert(`Download: ${row.name}`),
              },
              { label: "", icon: undefined, onClick: () => {}, divider: true },
              {
                label: "Hapus",
                icon: <DeleteOutlined fontSize="small" />,
                variant: "danger",
                onClick: () => { setSelectedUser(row); setConfirmOpen(true); },
              },
            ]}
          />
        </ActionButtonGroup>
      ),
    },
  ];

  return (
    <DashboardLayout sectionTitle="Template" title="Dashboard">
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: "Total Pengguna", value: DUMMY_USERS.length, sub: "Terdaftar di sistem", icon: <PeopleOutline />, color: "var(--primary)" },
            { label: "Pengguna Aktif", value: DUMMY_USERS.filter(u => u.status === "active").length, sub: "Dari total pengguna", icon: <CheckCircleOutline />, color: "#22c55e" },
            { label: "Pending",        value: DUMMY_USERS.filter(u => u.status === "pending").length, sub: "Menunggu verifikasi", icon: <ErrorOutline />,       color: "#f59e0b" },
            { label: "Pertumbuhan",    value: "+12%",                                                  sub: "Bulan ini",         icon: <TrendingUp />,            color: "#3b82f6" },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* ── ServerDataTable ────────────────────────────────────────────── */}
        <Section
          title="ServerDataTable"
          description="Tabel dengan server-side pagination, search, dan multi-filter. Cocok untuk data besar dari API."
        >
          <ServerDataTable
            columns={columns}
            data={paginated}
            title="Data Pengguna"
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(0); }}
            onSearchSubmit={() => {}}
            searchPlaceholder="Cari nama atau email..."
            filters={[
              {
                id: "role",
                label: "Role",
                value: roleFilter,
                options: ROLE_OPTIONS,
                onChange: (v) => { setRoleFilter(v); setPage(0); },
              },
              {
                id: "status",
                label: "Status",
                value: statusFilter,
                options: STATUS_OPTIONS,
                onChange: (v) => { setStatusFilter(v); setPage(0); },
              },
            ]}
            totalRows={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(rpp) => { setRowsPerPage(rpp); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Section>

        {/* ── DataTable (client-side) ────────────────────────────────────── */}
        <Section
          title="DataTable (Client-side)"
          description="Tabel dengan pagination dan search di sisi client. Cocok untuk data statis atau kecil."
        >
          <DataTable
            columns={columns}
            data={DUMMY_USERS}
            searchPlaceholder="Cari pengguna..."
            rowsPerPageOptions={[5, 10]}
          />
        </Section>

        {/* ── UI Components ─────────────────────────────────────────────── */}
        <Section
          title="UI Components"
          description="Kumpulan komponen reusable — chip status, button, select, dan info card."
        >
          <Grid container spacing={3}>

            {/* StatusChip */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 2.5, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                  StatusChip
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <StatusChip label="Aktif"    variant="success" />
                  <StatusChip label="Nonaktif" variant="neutral" />
                  <StatusChip label="Pending"  variant="warning" />
                  <StatusChip label="Error"    variant="danger" />
                  <StatusChip label="Info"     variant="info" />
                </Box>
              </Card>
            </Grid>

            {/* SoftButton */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 2.5, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                  SoftButton
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <SoftButton
                    startIcon={<AddOutlined />}
                    onClick={() => setModalOpen(true)}
                  >
                    Tambah Data
                  </SoftButton>
                  <SoftButton
                    color="success"
                    startIcon={<CheckCircleOutline />}
                    onClick={() => {}}
                  >
                    Approve
                  </SoftButton>
                  <SoftButton
                    color="error"
                    startIcon={<DeleteOutlined />}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Hapus
                  </SoftButton>
                </Box>
              </Card>
            </Grid>

            {/* ActionButton variants */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 2.5, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                  ActionButton & ActionMenuButton
                </Typography>
                <ActionButtonGroup>
                  <ActionButton variant="view"     title="View"   icon={<VisibilityOutlined fontSize="small" />} onClick={() => {}} />
                  <ActionButton variant="edit"     title="Edit"   icon={<EditOutlined      fontSize="small" />} onClick={() => {}} />
                  <ActionButton variant="delete"   title="Hapus"  icon={<DeleteOutlined    fontSize="small" />} onClick={() => {}} />
                  <ActionMenuButton
                    items={[
                      { label: "Download", icon: <DownloadOutlined fontSize="small" />, onClick: () => {} },
                      { label: "Hapus",    icon: <DeleteOutlined   fontSize="small" />, variant: "danger", onClick: () => setConfirmOpen(true) },
                    ]}
                  />
                </ActionButtonGroup>
              </Card>
            </Grid>

            {/* SearchableSelect */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 2.5, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                  SearchableSelect
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <SearchableSelect
                    label="Pilih Role"
                    value={selectedRole}
                    options={ROLE_OPTIONS.filter(o => o.value !== "__all")}
                    onChange={setSelectedRole}
                  />
                  <SearchableSelect
                    label="Pilih Status"
                    value={selectedStatus}
                    options={STATUS_OPTIONS.filter(o => o.value !== "__all")}
                    onChange={setSelectedStatus}
                  />
                </Box>
              </Card>
            </Grid>

            {/* InfoCard */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 2.5, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                  InfoCard
                </Typography>
                <InfoCard message="Ini adalah pesan informasi biasa." variant="info" />
                <InfoCard message="Terjadi kesalahan saat memproses data." variant="error" />
                <InfoCard message="Perhatian: data ini belum dikonfirmasi." variant="warning" />
              </Card>
            </Grid>
          </Grid>
        </Section>

        {/* ── Modal ─────────────────────────────────────────────────────── */}
        <Section
          title="Modal & ConfirmDialog"
          description="Modal dengan sections dan actions. ConfirmDialog untuk konfirmasi destructive action."
        >
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <SoftButton startIcon={<AddOutlined />} onClick={() => { setSelectedUser(null); setModalOpen(true); }}>
              Buka Modal
            </SoftButton>
            <SoftButton color="error" startIcon={<DeleteOutlined />} onClick={() => { setSelectedUser(DUMMY_USERS[0]); setConfirmOpen(true); }}>
              Buka Confirm Dialog
            </SoftButton>
          </Box>
        </Section>

      </Box>

      {/* ── Modal Detail ──────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedUser ? `Detail: ${selectedUser.name}` : "Tambah Pengguna Baru"}
        description={selectedUser ? "Informasi lengkap pengguna." : "Isi form untuk menambahkan pengguna baru."}
        sections={
          selectedUser
            ? [
                {
                  title: "Informasi Dasar",
                  content: (
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 1 }}>
                      {[
                        ["ID", selectedUser.id],
                        ["Nama", selectedUser.name],
                        ["Email", selectedUser.email],
                        ["Role", selectedUser.role],
                        ["Status", STATUS_MAP[selectedUser.status].label],
                        ["Bergabung", new Date(selectedUser.joined).toLocaleDateString("id-ID", { dateStyle: "long" })],
                      ].map(([k, v]) => (
                        <Box key={k}>
                          <Typography sx={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}</Typography>
                          <Typography sx={{ fontSize: "0.875rem", color: "var(--foreground)", fontWeight: 500, mt: 0.25 }}>{v}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ),
                },
                {
                  title: "Catatan",
                  description: "Tambahkan catatan tambahan di sini sesuai kebutuhan.",
                },
              ]
            : [
                {
                  title: "Form Pengguna",
                  description: "Isi semua field yang diperlukan. Ini adalah contoh section dalam Modal.",
                },
              ]
        }
        actions={[
          { label: "Tutup",  onClick: () => setModalOpen(false), variant: "ghost" },
          { label: "Simpan", onClick: () => setModalOpen(false), variant: "primary" },
        ]}
      />

      {/* ── Confirm Dialog ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => alert(`Hapus: ${selectedUser?.name ?? "data"}`)}
        title="Hapus Pengguna"
        message={`Kamu yakin ingin menghapus "${selectedUser?.name ?? "data ini"}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </DashboardLayout>
  );
}

export default DashboardPage;
