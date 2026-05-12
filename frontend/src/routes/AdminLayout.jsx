import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../components/layout/AdminSidebar'
import AdminNavbar from '../components/layout/AdminNavbar'
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb'
import { companyAdminNavItems } from '../data/companyAdminData'

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  const activeModule = useMemo(
    () => companyAdminNavItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)),
    [pathname]
  )

  const moduleClass = activeModule?.label
    ? `module-${activeModule.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : 'module-dashboard'

  return (
    <div className={`app-shell ${moduleClass}`}>
      <AdminSidebar
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="content-shell">
        <AdminNavbar />
        <AdminBreadcrumb />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
