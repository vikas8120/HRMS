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

function Sidebar({ mobileOpen, onToggleMobile, onCloseMobile }) {
  const [openMenus, setOpenMenus] = useState({ Dashboard: true })
  const [menuSearch, setMenuSearch] = useState('')

  const sidebarClass = useMemo(() => `sidebar ${mobileOpen ? 'sidebar-open' : ''}`, [mobileOpen])

  const normalizedSearch = menuSearch.trim().toLowerCase()

  const filteredItems = useMemo(() => {
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
  }, [normalizedSearch])

  const toggleMenu = (label) => setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))

  const handleLinkClick = () => {
    onCloseMobile?.()
  }

  return (
    <>
      <button className="mobile-menu-btn" onClick={onToggleMobile}><Menu size={20} /></button>
      <aside className={sidebarClass}>
        <h2>Super Admin</h2>

        <div className="sidebar-search-wrap">
          <Search size={15} />
          <input
            className="sidebar-search-input"
            value={menuSearch}
            onChange={(event) => setMenuSearch(event.target.value)}
            placeholder="Search modules"
          />
        </div>

        <nav>
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isOpen = openMenus[item.label]
            const hasChildren = item.children.length > 0 && !singlePageModules.has(item.label)
            const showSearchChildren = normalizedSearch && item.matchedChildren.length > 0
            const shouldShowChildren = hasChildren && isOpen && !normalizedSearch

            return (
              <div key={item.label} className="menu-group">
                <div className="menu-head-row">
                  <NavLink to={item.path} className="menu-link" onClick={handleLinkClick}><Icon size={16} /> {item.label}</NavLink>
                  {hasChildren ? (
                    <button className="menu-drop-btn" onClick={() => toggleMenu(item.label)}><ChevronDown size={16} className={isOpen ? 'rotate' : ''} /></button>
                  ) : null}
                </div>

                {shouldShowChildren ? (
                  <div className="submenu">
                    {item.children.map((child) => (
                      <NavLink key={child.path} to={child.path} className="submenu-link" onClick={handleLinkClick}>{child.label}</NavLink>
                    ))}
                  </div>
                ) : null}

                {showSearchChildren ? (
                  <div className="submenu submenu-search-results">
                    {item.matchedChildren.map((child) => (
                      <NavLink key={child.path} to={child.path} className="submenu-link" onClick={handleLinkClick}>{child.label}</NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
