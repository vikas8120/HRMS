import { Menu, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { companyAdminNavItems } from '../../data/companyAdminData'

function AdminSidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
  const [menuSearch, setMenuSearch] = useState('')

  const isCompact = !isMobile && isCollapsed
  const sidebarClass = useMemo(() => {
    const classes = ['sidebar']
    if (isMobileOpen) classes.push('sidebar-open')
    if (isCompact) classes.push('sidebar-collapsed')
    return classes.join(' ')
  }, [isCompact, isMobileOpen])
  const normalizedSearch = menuSearch.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (isCompact) return companyAdminNavItems
    if (!normalizedSearch) return companyAdminNavItems
    return companyAdminNavItems.filter((item) => item.label.toLowerCase().includes(normalizedSearch))
  }, [isCompact, normalizedSearch])

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

      {!isCompact ? (
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

      <nav id="company-admin-sidebar-nav">
        {filteredItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.path} className="menu-group">
              <div className="menu-head-row">
                <NavLink
                  to={item.path}
                  end={item.path === '/admin/dashboard'}
                  className={`menu-link ${isCompact ? 'menu-link-icon-only' : ''}`}
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
