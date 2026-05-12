import { useMemo, useState } from 'react'
import { ChevronDown, Menu, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navItems } from '../../data/dashboardData'

const singlePageModules = new Set([
  'Admin Management',
  'Company Management',
  'Subscription & Billing',
  'Revenue & Analytics',
  'Feature Management',
  'Global Users',
  'Support Center',
  'Audit & Security',
  'Integrations',
  'AI Center',
  'Backup & Restore',
  'Reports',
  'System Settings'
])

function Sidebar({ isCollapsed, isMobileOpen, isMobile, onToggle, onClose }) {
  const [openMenus, setOpenMenus] = useState({ Dashboard: true })
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
    if (isCompact) {
      return navItems.map((item) => ({ ...item, matchedChildren: [] }))
    }

    if (!normalizedSearch) {
      return navItems.map((item) => ({ ...item, matchedChildren: item.children }))
    }

    return navItems
      .map((item) => {
        const moduleMatch = item.label.toLowerCase().includes(normalizedSearch)
        const matchedChildren = item.children.filter((child) => child.label.toLowerCase().includes(normalizedSearch))
        if (!moduleMatch && matchedChildren.length === 0) return null
        return { ...item, matchedChildren }
      })
      .filter(Boolean)
  }, [isCompact, normalizedSearch])

  const toggleMenu = (label) => setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Super Admin</h2>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-label={isMobile ? 'Toggle sidebar' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
          aria-controls="super-admin-sidebar-nav"
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

      <nav id="super-admin-sidebar-nav">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isOpen = openMenus[item.label]
          const hasChildren = item.children.length > 0 && !singlePageModules.has(item.label) && !isCompact
          const showSearchChildren = !isCompact && normalizedSearch && item.matchedChildren.length > 0
          const shouldShowChildren = hasChildren && isOpen && !normalizedSearch

          return (
            <div key={item.label} className="menu-group">
              <div className="menu-head-row">
                <NavLink
                  to={item.path}
                  className={`menu-link ${isCompact ? 'menu-link-icon-only' : ''}`}
                  onClick={handleLinkClick}
                  title={isCompact ? item.label : undefined}
                >
                  <Icon size={16} />
                  {!isCompact ? <span>{item.label}</span> : null}
                </NavLink>
                {hasChildren ? (
                  <button type="button" className="menu-drop-btn" onClick={() => toggleMenu(item.label)}>
                    <ChevronDown size={16} className={isOpen ? 'rotate' : ''} />
                  </button>
                ) : null}
              </div>

              {shouldShowChildren ? (
                <div className="submenu">
                  {item.children.map((child) => (
                    <NavLink key={child.path} to={child.path} className="submenu-link" onClick={handleLinkClick}>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}

              {showSearchChildren ? (
                <div className="submenu submenu-search-results">
                  {item.matchedChildren.map((child) => (
                    <NavLink key={child.path} to={child.path} className="submenu-link" onClick={handleLinkClick}>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
