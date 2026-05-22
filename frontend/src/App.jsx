import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { navItems } from './data/dashboardData'
import ProtectedRoute from './routes/ProtectedRoute'
import EmployeeLayout from './routes/EmployeeLayout'
import SuperAdminLayout from './routes/SuperAdminLayout'
import AdminLayout from './routes/AdminLayout'
import HrLayout from './routes/HrLayout'
import ManagerLayout from './routes/ManagerLayout'
import RoleBasedRedirect from './routes/RoleBasedRedirect'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const SectionPage = lazy(() => import('./pages/sections/SectionPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const CompanyAdminDashboardPage = lazy(() => import('./pages/CompanyAdminDashboardPage'))
const CompanyAdminHRPage = lazy(() => import('./pages/CompanyAdminHRPage'))
const CompanyAdminManagersPage = lazy(() => import('./pages/CompanyAdminManagersPage'))
const CompanyAdminEmployeesPage = lazy(() => import('./pages/CompanyAdminEmployeesPage'))
const CompanyAdminDepartmentsPage = lazy(() => import('./pages/CompanyAdminDepartmentsPage'))
const CompanyAdminAttendancePage = lazy(() => import('./pages/CompanyAdminAttendancePage'))
const CompanyAdminLeavesPage = lazy(() => import('./pages/CompanyAdminLeavesPage'))
const CompanyAdminPayrollPage = lazy(() => import('./pages/CompanyAdminPayrollPage'))
const CompanyAdminReportsPage = lazy(() => import('./pages/CompanyAdminReportsPage'))
const CompanyAdminSettingsPage = lazy(() => import('./pages/CompanyAdminSettingsPage'))
const EmployeeAttendancePage = lazy(() => import('./pages/employee/EmployeeAttendancePage'))
const EmployeeDashboardPage = lazy(() => import('./pages/employee/EmployeeDashboardPage'))
const EmployeeLeavesPage = lazy(() => import('./pages/employee/EmployeeLeavesPage'))
const EmployeePayrollPage = lazy(() => import('./pages/employee/EmployeePayrollPage'))
const EmployeeDocumentsPage = lazy(() => import('./pages/employee/EmployeeDocumentsPage'))
const EmployeeTasksPage = lazy(() => import('./pages/employee/EmployeeTasksPage'))
const EmployeeAnnouncementsPage = lazy(() => import('./pages/employee/EmployeeAnnouncementsPage'))
const EmployeeHelpdeskPage = lazy(() => import('./pages/employee/EmployeeHelpdeskPage'))
const EmployeePerformancePage = lazy(() => import('./pages/employee/EmployeePerformancePage'))
const EmployeeNotificationsPage = lazy(() => import('./pages/employee/EmployeeNotificationsPage'))
const EmployeeSettingsPage = lazy(() => import('./pages/employee/EmployeeSettingsPage'))
const EmployeeProfilePage = lazy(() => import('./pages/employee/EmployeeProfilePage'))
const HrDashboardPage = lazy(() => import('./pages/HrDashboardPage'))
const HrDocumentPage = lazy(() => import('./pages/HrDocumentPage'))
const HrAnnouncementPage = lazy(() => import('./pages/HrAnnouncementPage'))
const HrPerformancePage = lazy(() => import('./pages/HrPerformancePage'))
const HrRecruitmentPage = lazy(() => import('./pages/HrRecruitmentPage'))
const ManagerDashboardPage = lazy(() => import('./pages/manager/ManagerDashboardPage'))
const ManagerMyTeamPage = lazy(() => import('./pages/manager/ManagerMyTeamPage'))
const ManagerLeaveManagementPage = lazy(() => import('./pages/manager/ManagerLeaveManagementPage'))
const ManagerAttendancePage = lazy(() => import('./pages/manager/ManagerAttendancePage'))
const ManagerTaskManagementPage = lazy(() => import('./pages/manager/ManagerTaskManagementPage'))
const ManagerPerformanceReviewPage = lazy(() => import('./pages/manager/ManagerPerformanceReviewPage'))
const ManagerNotificationsPage = lazy(() => import('./pages/manager/ManagerNotificationsPage'))
const ManagerProfileSettingsPage = lazy(() => import('./pages/manager/ManagerProfileSettingsPage'))
const ManagerHelpSupportPage = lazy(() => import('./pages/manager/ManagerHelpSupportPage'))
const ManagerDocumentsPage = lazy(() => import('./pages/manager/ManagerDocumentsPage'))
const ManagerCommunicationPage = lazy(() => import('./pages/manager/ManagerCommunicationPage'))
const ManagerMeetingsPage = lazy(() => import('./pages/manager/ManagerMeetingsPage'))
const ManagerRequestsEscalationPage = lazy(() => import('./pages/manager/ManagerRequestsEscalationPage'))
const ManagerReportsPage = lazy(() => import('./pages/manager/ManagerReportsPage'))
const ManagerPayrollViewPage = lazy(() => import('./pages/manager/ManagerPayrollViewPage'))
const ManagerTeamMemberProfilePage = lazy(() => import('./pages/manager/ManagerTeamMemberProfilePage'))
const PremiumCRMPage = lazy(() => import('./pages/PremiumCRMPage'))

function App() {
  return (
    <Suspense fallback={<div className="panel">Loading...</div>}>
      <Routes>
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/premium-crm" element={<PremiumCRMPage />} />

        <Route element={<ProtectedRoute allowedRoles={['platform_admin', 'superadmin']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/superadmin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/superadmin/dashboard" element={<DashboardPage />} />
            <Route path="/superadmin/*" element={<Navigate to="/super-admin/dashboard" replace />} />
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
          <Route element={<HrLayout />}>
            <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="/hr/dashboard" element={<HrDashboardPage />} />
            <Route path="/hr/employee" element={<CompanyAdminEmployeesPage />} />
            <Route path="/hr/attendance" element={<CompanyAdminAttendancePage />} />
            <Route path="/hr/leave" element={<CompanyAdminLeavesPage />} />
            <Route path="/hr/payroll" element={<CompanyAdminPayrollPage />} />
            <Route path="/hr/document" element={<HrDocumentPage />} />
            <Route path="/hr/announcement" element={<HrAnnouncementPage />} />
            <Route path="/hr/performance" element={<HrPerformancePage />} />
            <Route path="/hr/recruitment" element={<HrRecruitmentPage />} />
            <Route path="/hr/department" element={<CompanyAdminDepartmentsPage />} />
            <Route path="/hr/report" element={<CompanyAdminReportsPage />} />
            <Route path="/hr/settings" element={<CompanyAdminSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
          <Route element={<ManagerLayout />}>
            <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/my-team" element={<ManagerMyTeamPage />} />
            <Route path="/manager/team" element={<ManagerMyTeamPage />} />
            <Route path="/manager/team/:employeeId" element={<ManagerTeamMemberProfilePage />} />
            <Route path="/manager/leave-management" element={<ManagerLeaveManagementPage />} />
            <Route path="/manager/leaves" element={<ManagerLeaveManagementPage />} />
            <Route path="/manager/attendance" element={<ManagerAttendancePage />} />
            <Route path="/manager/task-management" element={<ManagerTaskManagementPage />} />
            <Route path="/manager/tasks" element={<ManagerTaskManagementPage />} />
            <Route path="/manager/performance-review" element={<ManagerPerformanceReviewPage />} />
            <Route path="/manager/performance" element={<ManagerPerformanceReviewPage />} />
            <Route path="/manager/reports" element={<ManagerReportsPage />} />
            <Route path="/manager/requests" element={<ManagerRequestsEscalationPage />} />
            <Route path="/manager/notifications" element={<ManagerNotificationsPage />} />
            <Route path="/manager/meetings" element={<ManagerMeetingsPage />} />
            <Route path="/manager/payroll" element={<ManagerPayrollViewPage />} />
            <Route path="/manager/documents" element={<ManagerDocumentsPage />} />
            <Route path="/manager/communication" element={<ManagerCommunicationPage />} />
            <Route path="/manager/profile" element={<ManagerProfileSettingsPage />} />
            <Route path="/manager/support" element={<ManagerHelpSupportPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
          <Route element={<EmployeeLayout />}>
            <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
            <Route path="/employee/leaves" element={<EmployeeLeavesPage />} />
            <Route path="/employee/payroll" element={<EmployeePayrollPage />} />
            <Route path="/employee/documents" element={<EmployeeDocumentsPage />} />
            <Route path="/employee/tasks" element={<EmployeeTasksPage />} />
            <Route path="/employee/announcements" element={<EmployeeAnnouncementsPage />} />
            <Route path="/employee/helpdesk" element={<EmployeeHelpdeskPage />} />
            <Route path="/employee/performance" element={<EmployeePerformancePage />} />
            <Route path="/employee/notifications" element={<EmployeeNotificationsPage />} />
            <Route path="/employee/settings" element={<EmployeeSettingsPage />} />
            <Route path="/employee/profile" element={<EmployeeProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
