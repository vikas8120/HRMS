import {
  LayoutDashboard,
  MessageSquareHeart,
  CircleAlert,
  ShieldAlert,
  BookOpen,
  CalendarClock,
  CalendarCheck2,
  TrendingUp,
  BarChart3,
  Bell,
  Wallet,
  UserRound,
  Settings,
  LifeBuoy
} from 'lucide-react'

export const managerNavItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/manager/my-dashboard' },
  { key: 'profile-settings', label: 'Profile', icon: UserRound, path: '/manager/profile' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck2, path: '/manager/attendance' },
  { key: 'leave-management', label: 'Leave Management', icon: CalendarClock, path: '/manager/leave-management' },
  { key: 'payroll-view', label: 'Salary Slip', icon: Wallet, path: '/manager/payroll' },
  { key: 'policy', label: 'Policy', icon: BookOpen, path: '/manager/policy' },
  { key: 'notifications', label: 'Notifications', icon: Bell, path: '/manager/notifications' },
  { key: 'performance-review', label: 'Performance Review', icon: TrendingUp, path: '/manager/performance-review' },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/manager/reports' },
  { key: 'help-support', label: 'Help & Support', icon: LifeBuoy, path: '/manager/support' },
  { key: 'feedback', label: 'Feedback', icon: MessageSquareHeart, path: '/manager/feedback' },
  { key: 'grievance', label: 'Grievance', icon: CircleAlert, path: '/manager/grievance' },
  { key: 'complaint-box', label: 'Complaint Box', icon: ShieldAlert, path: '/manager/complaint-box' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/manager/settings' }
]
