import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  CalendarClock,
  Wallet,
  Building2,
  BriefcaseBusiness,
  TrendingUp,
  FileText,
  Megaphone,
  BarChart3,
  Settings
} from 'lucide-react'

export const hrNavItems = [
  { key: 'dashboard', label: 'HR Dashboard', icon: LayoutDashboard, path: '/hr/dashboard' },
  { key: 'employee', label: 'Employee', icon: Users, path: '/hr/employee' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck2, path: '/hr/attendance' },
  { key: 'leave', label: 'Leave', icon: CalendarClock, path: '/hr/leave' },
  { key: 'payroll', label: 'Payroll', icon: Wallet, path: '/hr/payroll' },
  { key: 'department', label: 'Department', icon: Building2, path: '/hr/department' },
  { key: 'recruitment', label: 'Recruitment', icon: BriefcaseBusiness, path: '/hr/recruitment' },
  { key: 'performance', label: 'Performance', icon: TrendingUp, path: '/hr/performance' },
  { key: 'document', label: 'Document', icon: FileText, path: '/hr/document' },
  { key: 'announcement', label: 'Announcement', icon: Megaphone, path: '/hr/announcement' },
  { key: 'report', label: 'Report', icon: BarChart3, path: '/hr/report' },
  { key: 'settings', label: 'HR Settings', icon: Settings, path: '/hr/settings' }
]

export const hrModuleConfig = {
  dashboard: {
    title: 'HR Dashboard',
    description: 'Live HR KPIs, approvals, and alerts.',
    submodules: ['Executive Overview', 'Workforce Snapshot', 'Today Attendance Summary', 'Leave Summary', 'Payroll Cycle Status', 'Pending Approvals', 'Recent Activity']
  },
  employee: {
    title: 'Employee',
    description: 'Employee lifecycle and profile operations.',
    submodules: ['Employee Directory', 'Add Employee', 'Employee Profile (360)', 'Onboarding Checklist', 'Offboarding/Exit', 'Employment History', 'Bank & Tax Details', 'Bulk Import/Export']
  },
  attendance: {
    title: 'Attendance',
    description: 'Attendance logs, shifts, and regularization.',
    submodules: ['Daily Register', 'Shift Roster', 'Punch Logs', 'Late/Early Tracking', 'Overtime Requests', 'Regularization Queue', 'Missing Punch Resolver', 'Attendance Reports']
  },
  leave: {
    title: 'Leave',
    description: 'Leave policy, balances, and approvals.',
    submodules: ['Leave Dashboard', 'Leave Type Master', 'Policy Configuration', 'Leave Balance', 'Apply Leave', 'Leave Calendar', 'Approval Workflow', 'Comp-Off & Encashment']
  },
  payroll: {
    title: 'Payroll',
    description: 'Salary components, payroll run, and payslips.',
    submodules: ['Salary Components', 'Salary Structures', 'Variable Pay Inputs', 'Deductions & Statutory', 'Payroll Run', 'Payslip Generation', 'Bank Transfer File', 'Payroll Audit Trail']
  },
  department: {
    title: 'Department',
    description: 'Department structure and mapping.',
    submodules: ['Department Master', 'Hierarchy', 'Head Assignment', 'Role Mapping', 'Cost Center Mapping', 'Department Transfers', 'Department KPI View']
  },
  recruitment: {
    title: 'Recruitment',
    description: 'Hiring pipeline from requisition to joining.',
    submodules: ['Manpower Requisition', 'Job Posting', 'Candidate Pipeline', 'Interview Scheduling', 'Interview Feedback', 'Offer Generation', 'Joining Confirmation', 'Recruitment Analytics']
  },
  performance: {
    title: 'Performance',
    description: 'Goal setting, appraisal, and reviews.',
    submodules: ['Review Cycle Setup', 'Goal/KRA Assignment', 'Self & Manager Assessment', '360 Feedback', 'Calibration', 'Rating Finalization', 'PIP Management', 'Performance Reports']
  },
  document: {
    title: 'Document',
    description: 'Employee document storage and verification.',
    submodules: ['Document Categories', 'Document Vault', 'Upload & Version Control', 'Verification Queue', 'Expiry Alerts', 'Template Library', 'Access Controls', 'Document Audit Trail']
  },
  announcement: {
    title: 'Announcement',
    description: 'Internal communication and acknowledgements.',
    submodules: ['Create Announcement', 'Audience Targeting', 'Priority & Pinning', 'Schedule Publish', 'Read Receipts', 'Acknowledgements', 'Archive & History']
  },
  report: {
    title: 'Report',
    description: 'HR operational and compliance reports.',
    submodules: ['Report Builder', 'Saved Templates', 'Scheduled Reports', 'Attendance Reports', 'Leave Reports', 'Payroll Reports', 'Compliance Reports', 'Export Center']
  },
  settings: {
    title: 'HR Settings',
    description: 'HR configuration, policies, and permissions.',
    submodules: ['Organization Profile', 'Approval Matrix', 'Attendance Policy', 'Leave Policy', 'Payroll Policy', 'Notification Templates', 'Role & Permission', 'Integration Settings']
  }
}

