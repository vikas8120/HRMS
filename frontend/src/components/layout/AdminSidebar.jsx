import { Menu } from 'lucide-react'
import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { companyAdminNavItems } from '../../data/companyAdminData'

function AdminSidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
  const isCompact = !isMobile && isCollapsed
  const sidebarClass = useMemo(() => {
    const classes = ['sidebar']
    if (isMobileOpen) classes.push('sidebar-open')
    if (isCompact) classes.push('sidebar-collapsed')
    return classes.join(' ')
  }, [isCompact, isMobileOpen])
  const filteredItems = useMemo(() => companyAdminNavItems, [])

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Company Admin</h2>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-label={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
          aria-controls="company-admin-sidebar-nav"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav id="company-admin-sidebar-nav">
        {filteredItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.path} className="menu-group">
              <div className="menu-head-row">
                <NavLink
                  to={item.path}
                  end={item.path === '/admin/dashboard'}
                  className={({ isActive }) => `menu-link ${isCompact ? 'menu-link-icon-only' : ''} ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCompact ? item.label : undefined}
                >
                  <Icon size={16} />
                  {!isCompact ? <span>{item.label}</span> : null}
                </NavLink>
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export default AdminSidebar
