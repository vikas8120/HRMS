import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import Breadcrumb from '../components/layout/Breadcrumb'
import { navItems } from '../data/dashboardData'

function SuperAdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  const toggleMobile = () => setMobileOpen((prev) => !prev)
  const closeMobile = () => setMobileOpen(false)

  const activeModule = useMemo(
    () => navItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)),
    [pathname]
  )

  const showWorkspaceNav = Boolean(activeModule && activeModule.path !== '/super-admin/dashboard' && activeModule.children.length)
  const moduleClass = activeModule?.label
    ? `module-${activeModule.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : 'module-dashboard'

  return (
    <div className={`app-shell ${moduleClass}`}>
      <Sidebar mobileOpen={mobileOpen} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
      <div className="content-shell">
        <Navbar />
        <Breadcrumb />

        {showWorkspaceNav ? (
          <div className="workspace-nav" aria-label="Workspace section navigation">
            {activeModule.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) => `workspace-nav-chip ${isActive ? 'active' : ''}`}
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        ) : null}

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLayout
