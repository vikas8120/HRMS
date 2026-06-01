import {
  MessageSquareHeart,
  ShieldAlert,
  CircleAlert,
  ClipboardCheck,
  FileSpreadsheet,
  Home,
  LogOut,
  Menu,
  BookOpen,
  Settings,
  Bell,
  UserRound,
  Search
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
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
  { label: 'Notifications', path: '/employee/notifications', icon: Bell },
  { label: 'Settings', path: '/employee/settings', icon: Settings }
]

function EmployeeSidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
  const auth = useAuth()
  const logout = auth?.logout || (() => {})
  const isCompact = !isMobile && isCollapsed
  const [menuSearch, setMenuSearch] = useState('')
  const sidebarClass = ['sidebar', 'employee-sidebar', 'super-admin-sidebar', isMobileOpen ? 'sidebar-open' : '', isCompact ? 'sidebar-collapsed' : ''].filter(Boolean).join(' ')
  const filteredItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase()
    if (!query) return employeeItems
    return employeeItems.filter((item) => item.label.toLowerCase().includes(query))
  }, [menuSearch])

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <div className="sidebar-brand-wrap">
          <div className="sidebar-brand-dot" />
          <div className="sidebar-brand-copy">
            <h2 className="sidebar-title">Employee Portal</h2>
            {!isCompact ? (
              <div className="sidebar-workspace-meta">
                <span className="workspace-pill">Workspace</span>
                <span className="workspace-status"><i /> Online</span>
              </div>
            ) : null}
          </div>
        </div>
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

      {!isCompact && !isMobile ? (
        <div className="sidebar-search-wrap">
          <Search size={15} />
          <input
            className="sidebar-search-input"
            value={menuSearch}
            onChange={(event) => setMenuSearch(event.target.value)}
            placeholder="Search modules"
          />
        </div>
      ) : null}

      <nav id="employee-sidebar-nav">
        {filteredItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.path} className="menu-group">
              <div className="menu-head-row">
                <NavLink
                  to={item.path}
                  end={item.path === '/employee/dashboard'}
                  className={({ isActive }) => `menu-link ${isCompact ? 'menu-link-icon-only' : ''} ${isActive ? 'active' : ''}`}
                  onClick={handleLinkClick}
                  title={isCompact ? item.label : undefined}
                  data-label={item.label}
                >
                  {({ isActive }) => (
                    <motion.div
                      className="sidebar-item-inner"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <Icon size={17} className={`sidebar-item-icon ${isActive ? 'is-active' : ''}`} />
                      {!isCompact ? <span>{item.label}</span> : null}
                    </motion.div>
                  )}
                </NavLink>
              </div>
            </div>
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
