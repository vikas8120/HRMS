import {
  LayoutDashboard,
  Users,
  UserCog,
  UserRound,
  Building2,
  CalendarCheck2,
  CalendarClock,
  Wallet,
  FileText,
  Settings
} from 'lucide-react'

export const companyAdminNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'HR Management', icon: Users, path: '/admin/hr' },
  { label: 'Manager Management', icon: UserCog, path: '/admin/managers' },
  { label: 'Employee Management', icon: UserRound, path: '/admin/employees' },
  { label: 'Department Management', icon: Building2, path: '/admin/departments' },
  { label: 'Attendance', icon: CalendarCheck2, path: '/admin/attendance' },
  { label: 'Leave Management', icon: CalendarClock, path: '/admin/leaves' },
  { label: 'Payroll', icon: Wallet, path: '/admin/payroll' },
  { label: 'Reports', icon: FileText, path: '/admin/reports' },
  { label: 'Company Settings', icon: Settings, path: '/admin/settings' }
]

export const companyAdminStatsByModule = {
  HR: [
    { title: 'Open Positions', value: '14', trend: '3 added this week' },
    { title: 'Interviews', value: '27', trend: '8 scheduled today' },
    { title: 'Onboarding', value: '9', trend: '2 pending documents' },
    { title: 'Policy Updates', value: '4', trend: '1 awaiting publish' }
  ],
  Managers: [
    { title: 'Total Managers', value: '22', trend: '2 new this month' },
    { title: 'Active Teams', value: '18', trend: '1 team expanded' },
    { title: 'Review Cycles', value: '6', trend: '2 due this week' },
    { title: 'Escalations', value: '3', trend: 'All under review' }
  ],
  Employees: [
    { title: 'Headcount', value: '486', trend: '+12 this month' },
    { title: 'Active Profiles', value: '473', trend: '13 pending activation' },
    { title: 'Probation', value: '31', trend: '7 ending this week' },
    { title: 'Attrition Risk', value: '11', trend: 'Requires follow-up' }
  ],
  Departments: [
    { title: 'Departments', value: '12', trend: '1 created this quarter' },
    { title: 'Team Leads', value: '19', trend: '2 interim assignments' },
    { title: 'Budget Owners', value: '12', trend: 'All assigned' },
    { title: 'Cross-team Projects', value: '8', trend: '3 in planning' }
  ],
  Attendance: [
    { title: 'Present Today', value: '452', trend: '93% attendance' },
    { title: 'Late Check-ins', value: '21', trend: '-4 from yesterday' },
    { title: 'Remote Employees', value: '138', trend: 'Hybrid schedule' },
    { title: 'Missed Punches', value: '9', trend: 'Needs regularization' }
  ],
  Leaves: [
    { title: 'Leave Requests', value: '34', trend: '11 pending approvals' },
    { title: 'Approved Today', value: '16', trend: '8 casual, 6 sick, 2 PTO' },
    { title: 'Declined', value: '3', trend: 'Policy mismatch' },
    { title: 'Planned Leaves', value: '28', trend: 'Next 30 days' }
  ],
  Payroll: [
    { title: 'Payroll Cycle', value: 'May 2026', trend: 'In processing' },
    { title: 'Employees Paid', value: '478', trend: '8 on hold' },
    { title: 'Net Payroll', value: '$612,400', trend: '+3.8% MoM' },
    { title: 'Reimbursements', value: '$14,200', trend: '15 claims pending' }
  ],
  Reports: [
    { title: 'Generated Today', value: '18', trend: '6 shared with leadership' },
    { title: 'Scheduled Reports', value: '24', trend: '4 weekly, 20 monthly' },
    { title: 'Export Queue', value: '5', trend: 'Avg. 2 min turnaround' },
    { title: 'Audit Reports', value: '7', trend: 'All compliant' }
  ],
  Settings: [
    { title: 'Active Policies', value: '39', trend: '3 updated this month' },
    { title: 'Role Templates', value: '14', trend: '2 newly added' },
    { title: 'Integrations', value: '6', trend: 'All healthy' },
    { title: 'Notification Rules', value: '21', trend: '5 triggered today' }
  ]
}

export const buildCompanyAdminRows = (moduleName) =>
  Array.from({ length: 10 }).map((_, index) => ({
    id: `${moduleName.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    name: `${moduleName} Record ${index + 1}`,
    owner: ['HR Team', 'Operations', 'Finance Team'][index % 3],
    status: index % 3 === 0 ? 'Pending' : index % 2 === 0 ? 'Active' : 'Inactive',
    updated: `${index + 1}h ago`
  }))
