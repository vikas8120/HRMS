import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SectionPage from './pages/sections/SectionPage'
import DashboardPage from './pages/DashboardPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import CompanyAdminDashboardPage from './pages/CompanyAdminDashboardPage'
import CompanyAdminModulePage from './pages/CompanyAdminModulePage'
import CompanyAdminHRPage from './pages/CompanyAdminHRPage'
import CompanyAdminManagersPage from './pages/CompanyAdminManagersPage'
import CompanyAdminEmployeesPage from './pages/CompanyAdminEmployeesPage'
import CompanyAdminDepartmentsPage from './pages/CompanyAdminDepartmentsPage'
import CompanyAdminAttendancePage from './pages/CompanyAdminAttendancePage'
import CompanyAdminLeavesPage from './pages/CompanyAdminLeavesPage'
import CompanyAdminPayrollPage from './pages/CompanyAdminPayrollPage'
import CompanyAdminReportsPage from './pages/CompanyAdminReportsPage'
import CompanyAdminSettingsPage from './pages/CompanyAdminSettingsPage'
import { navItems } from './data/dashboardData'
import ProtectedRoute from './routes/ProtectedRoute'
import SuperAdminLayout from './routes/SuperAdminLayout'
import AdminLayout from './routes/AdminLayout'
import RoleBasedRedirect from './routes/RoleBasedRedirect'

const PremiumCRMPage = lazy(() => import('./pages/PremiumCRMPage'))

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/premium-crm"
        element={(
          <Suspense fallback={<div className="panel">Loading premium CRM...</div>}>
            <PremiumCRMPage />
          </Suspense>
        )}
      />

      <Route element={<ProtectedRoute allowedRoles={['platform_admin']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/dashboard" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="/platform-admin/dashboard" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="/super-admin/dashboard" element={<DashboardPage />} />

          {navItems.filter((module) => module.path !== '/super-admin/dashboard').map((module) => (
            <Route key={module.path} path={module.path} element={<SectionPage module={module.label} />} />
          ))}

          {navItems.flatMap((module) =>
            module.children.map((page) => (
              <Route key={page.path} path={page.path} element={<SectionPage module={module.label} page={page.label} />} />
            ))
          )}

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<CompanyAdminDashboardPage />} />
          <Route path="/admin/hr" element={<CompanyAdminHRPage />} />
          <Route path="/admin/managers" element={<CompanyAdminManagersPage />} />
          <Route path="/admin/employees" element={<CompanyAdminEmployeesPage />} />
          <Route path="/admin/departments" element={<CompanyAdminDepartmentsPage />} />
          <Route path="/admin/attendance" element={<CompanyAdminAttendancePage />} />
          <Route path="/admin/leaves" element={<CompanyAdminLeavesPage />} />
          <Route path="/admin/payroll" element={<CompanyAdminPayrollPage />} />
          <Route path="/admin/reports" element={<CompanyAdminReportsPage />} />
          <Route path="/admin/settings" element={<CompanyAdminSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
        <Route path="/hr/dashboard" element={<CompanyAdminModulePage moduleName="HR Dashboard" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
        <Route path="/manager/dashboard" element={<CompanyAdminModulePage moduleName="Manager Dashboard" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route path="/employee/dashboard" element={<CompanyAdminModulePage moduleName="Employee Dashboard" />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
