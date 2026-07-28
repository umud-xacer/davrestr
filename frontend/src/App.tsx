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

import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { RegistryBuilderPage } from "./pages/admin/RegistryBuilderPage";
import { AdminRecordEditPage } from "./pages/admin/AdminRecordEditPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { ContentPage } from "./pages/admin/ContentPage";
import { ApplicationsPage } from "./pages/admin/ApplicationsPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";

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
        {/* Parolni almashtirish — barcha kirgan xodim/admin rollari uchun (faqat admin
            panelga kirish huquqi bo'lmagan cabinet_employee/cabinet_approver ham foydalanadi) */}
        <Route
          path="/cabinet/change-password"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel (SuperAdmin System) — chap tarafdagi navbar (AdminLayout) barcha
            bo'limlarni birlashtiradi, har bir sahifa shu Outlet ichida ochiladi */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="registry-types" element={<RegistryBuilderPage />} />
          <Route path="records" element={<AdminRecordEditPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit-logs" element={<AuditLogPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
      <Footer />
    </div>
  );
}
