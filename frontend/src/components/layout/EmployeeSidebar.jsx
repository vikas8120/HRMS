import {
  MessageSquareHeart,
  ShieldAlert,
  CircleAlert,
  ClipboardCheck,
  FileSpreadsheet,
  Home,
  LogOut,
  Menu,
  Megaphone,
  BookOpen,
  Settings,
  Bell,
  UserRound
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const employeeItems = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
  { label: 'Profile', path: '/employee/profile', icon: UserRound },
  { label: 'Feedback', path: '/employee/feedback', icon: MessageSquareHeart },
  { label: 'Grievance', path: '/employee/grievance', icon: CircleAlert },
  { label: 'Complaint Box', path: '/employee/complaint-box', icon: ShieldAlert },
  { label: 'Attendance', path: '/employee/attendance', icon: ClipboardCheck },
  { label: 'Leaves', path: '/employee/leaves', icon: FileSpreadsheet },
  { label: 'Salary Slip', path: '/employee/payroll', icon: FileSpreadsheet },
  { label: 'Policy', path: '/employee/policy', icon: BookOpen },
  { label: 'Announcements', path: '/employee/announcements', icon: Megaphone },
  { label: 'Notifications', path: '/employee/notifications', icon: Bell },
  { label: 'Settings', path: '/employee/settings', icon: Settings }
]

function EmployeeSidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
  const { logout } = useAuth()
  const isCompact = !isMobile && isCollapsed
  const sidebarClass = ['sidebar', 'employee-sidebar', isMobileOpen ? 'sidebar-open' : '', isCompact ? 'sidebar-collapsed' : ''].filter(Boolean).join(' ')

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Employee Portal</h2>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-label={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
          aria-controls="employee-sidebar-nav"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav id="employee-sidebar-nav">
        {employeeItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/employee/dashboard'}
              className={({ isActive }) => `menu-link ${isCompact ? 'menu-link-icon-only' : ''} ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title={isCompact ? item.label : undefined}
              data-label={item.label}
            >
              <Icon size={16} />
              {!isCompact ? <span>{item.label}</span> : null}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="menu-link menu-link-button danger" onClick={logout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default EmployeeSidebar
