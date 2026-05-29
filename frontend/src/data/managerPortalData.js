import {
  LayoutDashboard,
  MessageSquareHeart,
  CircleAlert,
  ShieldAlert,
  BookOpen,
  Users,
  CalendarClock,
  CalendarCheck2,
  TrendingUp,
  BarChart3,
  Bell,
  Wallet,
  Settings,
  LifeBuoy
} from 'lucide-react'

export const managerNavItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/manager/my-dashboard' },
  { key: 'profile-settings', label: 'Profile', icon: Settings, path: '/manager/profile' },
  { key: 'feedback', label: 'Feedback', icon: MessageSquareHeart, path: '/manager/feedback' },
  { key: 'grievance', label: 'Grievance', icon: CircleAlert, path: '/manager/grievance' },
  { key: 'complaint-box', label: 'Complaint Box', icon: ShieldAlert, path: '/manager/complaint-box' },
  { key: 'policy', label: 'Policy', icon: BookOpen, path: '/manager/policy' },
  { key: 'my-team', label: 'My Team', icon: Users, path: '/manager/my-team' },
  { key: 'leave-management', label: 'Leave Management', icon: CalendarClock, path: '/manager/leave-management' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck2, path: '/manager/attendance' },
  { key: 'performance-review', label: 'Performance Review', icon: TrendingUp, path: '/manager/performance-review' },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/manager/reports' },
  { key: 'notifications', label: 'Notifications', icon: Bell, path: '/manager/notifications' },
  { key: 'payroll-view', label: 'Salary Slip', icon: Wallet, path: '/manager/payroll' },
  { key: 'help-support', label: 'Help & Support', icon: LifeBuoy, path: '/manager/support' }
]
