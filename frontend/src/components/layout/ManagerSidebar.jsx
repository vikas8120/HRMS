import { Menu, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { managerNavItems } from '../../data/managerPortalData'

function SidebarItem({ item, isCompact, onClose }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.path === '/manager/dashboard'}
      className={({ isActive }) => {
        const classes = ['menu-link']
        if (isCompact) classes.push('menu-link-icon-only')
        if (isActive) classes.push('active')
        return classes.join(' ')
      }}
      onClick={onClose}
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
  )
}

function SidebarSection({ items, isCompact, onClose }) {
  return (
    <>
      {items.map((item) => (
        <div key={item.path} className="menu-group">
          <div className="menu-head-row">
            <SidebarItem item={item} isCompact={isCompact} onClose={onClose} />
          </div>
        </div>
      ))}
    </>
  )
}

function ManagerSidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
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
    if (isCompact) return managerNavItems
    if (!normalizedSearch) return managerNavItems
    return managerNavItems.filter((item) => item.label.toLowerCase().includes(normalizedSearch))
  }, [isCompact, normalizedSearch])

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <div className="sidebar-brand-wrap">
          <div className="sidebar-brand-dot" />
          <div className="sidebar-brand-copy">
            <h2 className="sidebar-title">Manager Portal</h2>
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
          aria-controls="manager-sidebar-nav"
        >
          <Menu size={18} />
        </button>
      </div>

      {!isCompact ? (
        <motion.div className="sidebar-search-wrap" whileFocus={{ scale: 1.01 }}>
          <Search size={15} />
          <input
            className="sidebar-search-input"
            value={menuSearch}
            onChange={(event) => setMenuSearch(event.target.value)}
            placeholder="Search modules"
          />
        </motion.div>
      ) : null}

      <nav id="manager-sidebar-nav">
        <SidebarSection items={filteredItems} isCompact={isCompact} onClose={onClose} />
      </nav>
    </aside>
  )
}

export default ManagerSidebar
