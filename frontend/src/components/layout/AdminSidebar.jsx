import { Menu, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { companyAdminNavItems } from '../../data/companyAdminData'

function AdminSidebar({ mobileOpen, onToggleMobile, onCloseMobile }) {
  const [menuSearch, setMenuSearch] = useState('')

  const sidebarClass = useMemo(() => `sidebar ${mobileOpen ? 'sidebar-open' : ''}`, [mobileOpen])
  const normalizedSearch = menuSearch.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return companyAdminNavItems
    return companyAdminNavItems.filter((item) => item.label.toLowerCase().includes(normalizedSearch))
  }, [normalizedSearch])

  return (
    <>
      <button className="mobile-menu-btn" onClick={onToggleMobile}><Menu size={20} /></button>
      <aside className={sidebarClass}>
        <h2>Company Admin</h2>

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
            return (
              <div key={item.path} className="menu-group">
                <div className="menu-head-row">
                  <NavLink to={item.path} end={item.path === '/admin/dashboard'} className="menu-link" onClick={onCloseMobile}>
                    <Icon size={16} /> {item.label}
                  </NavLink>
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default AdminSidebar
