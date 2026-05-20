import {
  Bell,
  ClipboardCheck,
  FileSpreadsheet,
  Files,
  Headset,
  Home,
  LogOut,
  Menu,
  Megaphone,
  Settings,
  Target,
  UserRound
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const employeeItems = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
  { label: 'Attendance', path: '/employee/attendance', icon: ClipboardCheck },
  { label: 'Leaves', path: '/employee/leaves', icon: FileSpreadsheet },
  { label: 'Payroll', path: '/employee/payroll', icon: FileSpreadsheet },
  { label: 'Documents', path: '/employee/documents', icon: Files },
  { label: 'Tasks', path: '/employee/tasks', icon: ClipboardCheck },
  { label: 'Announcements', path: '/employee/announcements', icon: Megaphone },
  { label: 'Helpdesk', path: '/employee/helpdesk', icon: Headset },
  { label: 'Performance', path: '/employee/performance', icon: Target },
  { label: 'Notifications', path: '/employee/notifications', icon: Bell },
  { label: 'Settings', path: '/employee/settings', icon: Settings },
  { label: 'Profile', path: '/employee/profile', icon: UserRound }
]

function EmployeeSidebar({ onToggle }) {
  const { logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Employee Portal</h2>
        <button type="button" className="icon-button" onClick={onToggle} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
      </div>

      <nav>
        {employeeItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.path} to={item.path} end className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="menu-link danger" onClick={logout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default EmployeeSidebar
