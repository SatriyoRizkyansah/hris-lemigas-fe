import { Suspense, lazy, type ReactNode } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader } from "../components";
import { is_authenticated } from "@Signal/use-signal/auth-init-signal";
import { resolve_current_role, type HrisRole } from "../common/hris";
import { get_role_home_path } from "../layouts/components/sidebarItems";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/HrisDashboard"));
const PegawaiPage = lazy(() => import("../pages/master-pegawai/PegawaiPage"));
const UnitKerjaPage = lazy(() => import("../pages/master-unit/UnitKerjaPage"));
const ProyekPage = lazy(() => import("../pages/master-proyek/ProyekPage"));
const RoPage = lazy(() => import("../pages/master-ro/RoPage"));
const RoDetailPage = lazy(() => import("../pages/master-ro/RoDetailPage"));
const DanaOperasionalPage = lazy(() => import("../pages/master-dana-operasional/DanaOperasionalPage"));
const SkPage = lazy(() => import("../pages/sk/SkPage"));
const AlokasiGajiPage = lazy(() => import("../pages/alokasi-gaji/AlokasiGajiPage"));
const RekapAlokasiPage = lazy(() => import("../pages/alokasi-gaji/RekapAlokasiPage"));
const UsersPage = lazy(() => import("../pages/users/UsersPage"));
const ProfilPage = lazy(() => import("../pages/profil/ProfilPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

/** Redirect ke /login jika belum authenticated */
function ProtectedRoutes() {
  const location = useLocation();
  if (!is_authenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/** Redirect ke home jika sudah authenticated */
function GuestOnlyRoute() {
  if (is_authenticated()) {
    return <Navigate to={get_role_home_path(resolve_current_role())} replace />;
  }
  return <Outlet />;
}

/** Guard role — redirect ke home role jika tidak berhak */
function RequireRole({ roles, children }: { roles: HrisRole[]; children: ReactNode }) {
  const role = resolve_current_role();
  if (!roles.includes(role)) {
    return <Navigate to={get_role_home_path(role)} replace />;
  }
  return <>{children}</>;
}

const SUPERADMIN_ONLY: HrisRole[] = ["superadmin"];
const SUPERADMIN_KOORDINATOR: HrisRole[] = ["superadmin", "koordinator"];
// FINANCE_TEAM defined per spec (superadmin+keuangan) — used for future finance-only guards
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FINANCE_TEAM: HrisRole[] = ["superadmin", "keuangan"];
const ALL_MANAGEMENT: HrisRole[] = ["superadmin", "koordinator", "keuangan"];
const EVERYONE: HrisRole[] = ["superadmin", "koordinator", "keuangan", "karyawan"];
void FINANCE_TEAM;

// ─── App Routes ───────────────────────────────────────────────────────────────

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Guest-only routes */}
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage appName="HRIS Lemigas" tagline="Sistem Informasi Kepegawaian & Alokasi Gaji Tenaga Ahli LEMIGAS." />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Master data */}
          <Route
            path="/pegawai"
            element={
              <RequireRole roles={SUPERADMIN_KOORDINATOR}>
                <PegawaiPage />
              </RequireRole>
            }
          />
          <Route
            path="/unit-kerja"
            element={
              <RequireRole roles={SUPERADMIN_KOORDINATOR}>
                <UnitKerjaPage />
              </RequireRole>
            }
          />
          <Route
            path="/proyek"
            element={
              <RequireRole roles={SUPERADMIN_KOORDINATOR}>
                <ProyekPage />
              </RequireRole>
            }
          />
          <Route
            path="/ro"
            element={
              <RequireRole roles={SUPERADMIN_KOORDINATOR}>
                <RoPage />
              </RequireRole>
            }
          />
          <Route
            path="/ro/:id"
            element={
              <RequireRole roles={SUPERADMIN_KOORDINATOR}>
                <RoDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/dana-operasional"
            element={
              <RequireRole roles={ALL_MANAGEMENT}>
                <DanaOperasionalPage />
              </RequireRole>
            }
          />

          {/* Transaksi */}
          <Route
            path="/sk"
            element={
              <RequireRole roles={SUPERADMIN_KOORDINATOR}>
                <SkPage />
              </RequireRole>
            }
          />
          <Route
            path="/alokasi-gaji"
            element={
              <RequireRole roles={ALL_MANAGEMENT}>
                <AlokasiGajiPage />
              </RequireRole>
            }
          />
          <Route
            path="/alokasi-gaji/rekap"
            element={
              <RequireRole roles={ALL_MANAGEMENT}>
                <RekapAlokasiPage />
              </RequireRole>
            }
          />

          {/* Sistem */}
          <Route
            path="/pengguna"
            element={
              <RequireRole roles={SUPERADMIN_ONLY}>
                <UsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/profil"
            element={
              <RequireRole roles={EVERYONE}>
                <ProfilPage />
              </RequireRole>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
