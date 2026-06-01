import { LogOut, Menu, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { hrNavItems } from '../../data/hrPortalData'
import { useAuth } from '../../hooks/useAuth'

function HrSidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
  const { logout } = useAuth()
  const isCompact = !isMobile && isCollapsed
  const [menuSearch, setMenuSearch] = useState('')
  const sidebarClass = ['sidebar', 'employee-sidebar', 'super-admin-sidebar', isMobileOpen ? 'sidebar-open' : '', isCompact ? 'sidebar-collapsed' : ''].filter(Boolean).join(' ')
  const filteredItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase()
    if (!query) return hrNavItems
    return hrNavItems.filter((item) => item.label.toLowerCase().includes(query))
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
            <h2 className="sidebar-title">HR Portal</h2>
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
          aria-controls="hr-sidebar-nav"
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

      <nav id="hr-sidebar-nav">
        {filteredItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.path} className="menu-group">
              <div className="menu-head-row">
                <NavLink
                  to={item.path}
                  end={item.path === '/hr/dashboard'}
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

export default HrSidebar
