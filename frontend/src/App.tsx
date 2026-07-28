import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { SearchPage } from "./pages/public/SearchPage";
import { RecordDetailPage } from "./pages/public/RecordDetailPage";
import { ApplyPage } from "./pages/public/ApplyPage";

import { LoginPage } from "./pages/cabinet/LoginPage";
import { CabinetDashboardPage } from "./pages/cabinet/CabinetDashboardPage";
import { RecordFormPage } from "./pages/cabinet/RecordFormPage";

import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { RegistryBuilderPage } from "./pages/admin/RegistryBuilderPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { ContentPage } from "./pages/admin/ContentPage";
import { ApplicationsPage } from "./pages/admin/ApplicationsPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";

const STAFF_ROLES = ["cabinet_employee", "cabinet_approver", "org_admin", "superadmin"] as const;
const ADMIN_ROLES = ["org_admin", "superadmin"] as const;

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        {/* Ochiq Portal */}
        <Route path="/" element={<SearchPage />} />
        <Route path="/record/:recordNumber" element={<RecordDetailPage />} />
        <Route path="/apply" element={<ApplyPage />} />

        {/* Cabinet Module */}
        <Route path="/cabinet/login" element={<LoginPage />} />
        <Route
          path="/cabinet"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <CabinetDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cabinet/records/new"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <RecordFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cabinet/records/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <RecordFormPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel (SuperAdmin System) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/registry-types"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <RegistryBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ContentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}
