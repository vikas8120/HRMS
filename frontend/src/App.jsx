import { Suspense, lazy } from 'react'

const safeLazy = (importer) => lazy(async () => {
  try {
    return await importer()
  } catch (_error) {
    return await importer()
  }
})
import { Navigate, Route, Routes } from 'react-router-dom'
import { navItems } from './data/dashboardData'
import AppErrorBoundary from './components/ui/AppErrorBoundary'
import ProtectedRoute from './routes/ProtectedRoute'
import EmployeeLayout from './routes/EmployeeLayout'
import SuperAdminLayout from './routes/SuperAdminLayout'
import AdminLayout from './routes/AdminLayout'
import HrLayout from './routes/HrLayout'
import ManagerLayout from './routes/ManagerLayout'
import RoleBasedRedirect from './routes/RoleBasedRedirect'

const LoginPage = safeLazy(() => import('./pages/LoginPage'))
const SectionPage = safeLazy(() => import('./pages/sections/SectionPage'))
const DashboardPage = safeLazy(() => import('./pages/DashboardPage'))
const UnauthorizedPage = safeLazy(() => import('./pages/UnauthorizedPage'))
const NotFoundPage = safeLazy(() => import('./pages/NotFoundPage'))
const CompanyAdminDashboardPage = safeLazy(() => import('./pages/CompanyAdminDashboardPage'))
const CompanyAdminHRPage = safeLazy(() => import('./pages/CompanyAdminHRPage'))
const CompanyAdminManagersPage = safeLazy(() => import('./pages/CompanyAdminManagersPage'))
const CompanyAdminEmployeesPage = safeLazy(() => import('./pages/CompanyAdminEmployeesPage'))
const CompanyAdminDepartmentsPage = safeLazy(() => import('./pages/CompanyAdminDepartmentsPage'))
const CompanyAdminAttendancePage = safeLazy(() => import('./pages/CompanyAdminAttendancePage'))
const CompanyAdminLeavesPage = safeLazy(() => import('./pages/CompanyAdminLeavesPage'))
const CompanyAdminPerformancePage = safeLazy(() => import('./pages/CompanyAdminPerformancePage'))
const CompanyAdminFeedbackPage = safeLazy(() => import('./pages/CompanyAdminFeedbackPage'))
const CompanyAdminComplaintBoxPage = safeLazy(() => import('./pages/CompanyAdminComplaintBoxPage'))
const CompanyAdminGrievancePage = safeLazy(() => import('./pages/CompanyAdminGrievancePage'))
const CompanyAdminPolicyPage = safeLazy(() => import('./pages/CompanyAdminPolicyPage'))
const CompanyAdminPayrollPage = safeLazy(() => import('./pages/CompanyAdminPayrollPage'))
const CompanyAdminReportsPage = safeLazy(() => import('./pages/CompanyAdminReportsPage'))
const CompanyAdminSettingsPage = safeLazy(() => import('./pages/CompanyAdminSettingsPage'))
const EmployeeAttendancePage = safeLazy(() => import('./pages/employee/EmployeeAttendancePage'))
const EmployeeDashboardPage = safeLazy(() => import('./pages/employee/EmployeeDashboardPage'))
const EmployeeFeedbackPage = safeLazy(() => import('./pages/employee/feedback/EmployeeFeedbackPage'))
const EmployeeGrievancePage = safeLazy(() => import('./pages/employee/grievance/EmployeeGrievancePage'))
const EmployeeComplaintBoxPage = safeLazy(() => import('./pages/employee/complaint-box/EmployeeComplaintBoxPage'))
const EmployeeLeavesPage = safeLazy(() => import('./pages/employee/EmployeeLeavesPage'))
const EmployeePayrollPage = safeLazy(() => import('./pages/employee/EmployeePayrollPage'))
const EmployeePolicyPage = safeLazy(() => import('./pages/employee/EmployeePolicyPage'))
const EmployeeHelpdeskPage = safeLazy(() => import('./pages/employee/EmployeeHelpdeskPage'))
const EmployeePerformancePage = safeLazy(() => import('./pages/employee/EmployeePerformancePage'))
const EmployeeNotificationsPage = safeLazy(() => import('./pages/employee/EmployeeNotificationsPage'))
const EmployeeSettingsPage = safeLazy(() => import('./pages/employee/EmployeeSettingsPage'))
const EmployeeProfilePage = safeLazy(() => import('./pages/employee/EmployeeProfilePage'))
const HrDashboardPage = safeLazy(() => import('./pages/HrDashboardPage'))
const HrPerformancePage = safeLazy(() => import('./pages/HrPerformancePage'))
const HrRecruitmentPage = safeLazy(() => import('./pages/HrRecruitmentPage'))
const HrGrievancePage = safeLazy(() => import('./pages/HrGrievancePage'))
const HrComplaintBoxPage = safeLazy(() => import('./pages/HrComplaintBoxPage'))
const HrFeedbackPage = safeLazy(() => import('./pages/HrFeedbackPage'))
const HrPolicyPage = safeLazy(() => import('./pages/HrPolicyPage'))
const HrNotificationsPage = safeLazy(() => import('./pages/HrNotificationsPage'))
const HrAttendancePage = safeLazy(() => import('./pages/HrAttendancePage'))
const HrLeavePage = safeLazy(() => import('./pages/HrLeavePage'))
const ManagerDashboardPage = safeLazy(() => import('./pages/manager/ManagerDashboardPage'))
const ManagerFeedbackPage = safeLazy(() => import('./pages/manager/feedback/ManagerFeedbackPage'))
const ManagerGrievancePage = safeLazy(() => import('./pages/manager/grievance/ManagerGrievancePage'))
const ManagerComplaintBoxPage = safeLazy(() => import('./pages/manager/complaint-box/ManagerComplaintBoxPage'))
const ManagerPolicyPage = safeLazy(() => import('./pages/manager/ManagerPolicyPage'))
const ManagerLeaveManagementPage = safeLazy(() => import('./pages/manager/ManagerLeaveManagementPage'))
const ManagerAttendancePage = safeLazy(() => import('./pages/manager/ManagerAttendancePage'))
const ManagerPerformanceReviewPage = safeLazy(() => import('./pages/manager/ManagerPerformanceReviewPage'))
const ManagerNotificationsPage = safeLazy(() => import('./pages/manager/ManagerNotificationsPage'))
const ManagerProfileSettingsPage = safeLazy(() => import('./pages/manager/ManagerProfileSettingsPage'))
const ManagerSettingsPage = safeLazy(() => import('./pages/manager/ManagerSettingsPage'))
const ManagerHelpSupportPage = safeLazy(() => import('./pages/manager/ManagerHelpSupportPage'))
const ManagerReportsPage = safeLazy(() => import('./pages/manager/ManagerReportsPage'))
const ManagerPayrollViewPage = safeLazy(() => import('./pages/manager/ManagerPayrollViewPage'))
const PremiumCRMPage = safeLazy(() => import('./pages/PremiumCRMPage'))

function App() {
  return (
    <AppErrorBoundary>
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
            <Route path="/admin/performance" element={<CompanyAdminPerformancePage />} />
            <Route path="/admin/feedback" element={<CompanyAdminFeedbackPage />} />
            <Route path="/admin/complaint-box" element={<CompanyAdminComplaintBoxPage />} />
            <Route path="/admin/grievance" element={<CompanyAdminGrievancePage />} />
            <Route path="/admin/policy" element={<CompanyAdminPolicyPage />} />
            <Route path="/admin/payroll" element={<CompanyAdminPayrollPage />} />
            <Route path="/admin/reports" element={<CompanyAdminReportsPage />} />
            <Route path="/admin/settings" element={<CompanyAdminSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
          <Route element={<HrLayout />}>
            <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="/hr/my-dashboard" element={<HrDashboardPage />} />
            <Route path="/hr/dashboard" element={<HrDashboardPage />} />
            <Route path="/hr/employee" element={<CompanyAdminEmployeesPage />} />
            <Route path="/hr/attendance" element={<HrAttendancePage />} />
            <Route path="/hr/leave" element={<HrLeavePage />} />
            <Route path="/hr/payroll" element={<CompanyAdminPayrollPage />} />
            <Route path="/hr/grievance" element={<HrGrievancePage />} />
            <Route path="/hr/complaint-box" element={<HrComplaintBoxPage />} />
            <Route path="/hr/feedback" element={<HrFeedbackPage />} />
            <Route path="/hr/policy" element={<HrPolicyPage />} />
            <Route path="/hr/notifications" element={<HrNotificationsPage />} />
            <Route path="/hr/performance" element={<HrPerformancePage />} />
            <Route path="/hr/recruitment" element={<HrRecruitmentPage />} />
            <Route path="/hr/department" element={<CompanyAdminDepartmentsPage />} />
            <Route path="/hr/report" element={<CompanyAdminReportsPage />} />
            <Route path="/hr/profile" element={<CompanyAdminSettingsPage />} />
            <Route path="/hr/settings" element={<CompanyAdminSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
          <Route element={<ManagerLayout />}>
            <Route path="/manager" element={<Navigate to="/manager/my-dashboard" replace />} />
            <Route path="/manager/my-dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/feedback" element={<ManagerFeedbackPage />} />
            <Route path="/manager/grievance" element={<ManagerGrievancePage />} />
            <Route path="/manager/complaint-box" element={<ManagerComplaintBoxPage />} />
            <Route path="/manager/policy" element={<ManagerPolicyPage />} />
            <Route path="/manager/leave-management" element={<ManagerLeaveManagementPage />} />
            <Route path="/manager/leaves" element={<ManagerLeaveManagementPage />} />
            <Route path="/manager/attendance" element={<ManagerAttendancePage />} />
            <Route path="/manager/task-management" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/tasks" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/performance-review" element={<ManagerPerformanceReviewPage />} />
            <Route path="/manager/performance" element={<ManagerPerformanceReviewPage />} />
            <Route path="/manager/reports" element={<ManagerReportsPage />} />
            <Route path="/manager/requests" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/notifications" element={<ManagerNotificationsPage />} />
            <Route path="/manager/meetings" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/payroll" element={<ManagerPayrollViewPage />} />
            <Route path="/manager/settings" element={<ManagerSettingsPage />} />
            <Route path="/manager/documents" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/communication" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/profile" element={<ManagerProfileSettingsPage />} />
            <Route path="/manager/support" element={<ManagerHelpSupportPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
          <Route element={<EmployeeLayout />}>
            <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee/feedback" element={<EmployeeFeedbackPage />} />
            <Route path="/employee/grievance" element={<EmployeeGrievancePage />} />
            <Route path="/employee/complaint-box" element={<EmployeeComplaintBoxPage />} />
            <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
            <Route path="/employee/leaves" element={<EmployeeLeavesPage />} />
            <Route path="/employee/payroll" element={<EmployeePayrollPage />} />
            <Route path="/employee/policy" element={<EmployeePolicyPage />} />
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
    </AppErrorBoundary>
  )
}

export default App
