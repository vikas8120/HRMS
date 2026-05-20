import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CalendarCheck2,
  ListChecks,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Bell,
  CalendarDays,
  Wallet,
  FileText,
  MessageSquareText,
  Settings,
  LifeBuoy
} from 'lucide-react'

export const managerNavItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
  { key: 'my-team', label: 'My Team', icon: Users, path: '/manager/my-team' },
  { key: 'leave-management', label: 'Leave Management', icon: CalendarClock, path: '/manager/leave-management' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck2, path: '/manager/attendance' },
  { key: 'task-management', label: 'Task Management', icon: ListChecks, path: '/manager/task-management' },
  { key: 'performance-review', label: 'Performance Review', icon: TrendingUp, path: '/manager/performance-review' },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/manager/reports' },
  { key: 'requests-escalation', label: 'Requests / Escalation', icon: AlertTriangle, path: '/manager/requests' },
  { key: 'notifications', label: 'Notifications', icon: Bell, path: '/manager/notifications' },
  { key: 'meetings', label: 'Meetings', icon: CalendarDays, path: '/manager/meetings' },
  { key: 'payroll-view', label: 'Payroll View', icon: Wallet, path: '/manager/payroll' },
  { key: 'documents', label: 'Documents', icon: FileText, path: '/manager/documents' },
  { key: 'communication', label: 'Communication', icon: MessageSquareText, path: '/manager/communication' },
  { key: 'profile-settings', label: 'Profile Settings', icon: Settings, path: '/manager/profile' },
  { key: 'help-support', label: 'Help & Support', icon: LifeBuoy, path: '/manager/support' }
]
