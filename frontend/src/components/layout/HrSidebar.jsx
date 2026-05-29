import { LogOut, Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { hrNavItems } from '../../data/hrPortalData'
import { useAuth } from '../../hooks/useAuth'

function HrSidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
  const { logout } = useAuth()
  const isCompact = !isMobile && isCollapsed
  const sidebarClass = ['sidebar', 'employee-sidebar', isMobileOpen ? 'sidebar-open' : '', isCompact ? 'sidebar-collapsed' : ''].filter(Boolean).join(' ')

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">HR Portal</h2>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-label={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
          aria-controls="hr-sidebar-nav"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav id="hr-sidebar-nav">
        {hrNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/hr/dashboard'}
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

export default HrSidebar
