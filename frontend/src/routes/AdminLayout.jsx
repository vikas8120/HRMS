import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../components/layout/AdminSidebar'
import AdminNavbar from '../components/layout/AdminNavbar'
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb'
import { companyAdminNavItems } from '../data/companyAdminData'

const MOBILE_BREAKPOINT_QUERY = '(max-width: 980px)'

const getIsMobileViewport = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
}

function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(getIsMobileViewport)
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY)
    const syncViewport = (event) => {
      const nextIsMobile = event?.matches ?? mediaQuery.matches
      setIsMobile(nextIsMobile)
      if (!nextIsMobile) setIsMobileOpen(false)
    }

    syncViewport()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport)
      return () => mediaQuery.removeEventListener('change', syncViewport)
    }

    mediaQuery.addListener(syncViewport)
    return () => mediaQuery.removeListener(syncViewport)
  }, [])

  useEffect(() => {
    if (!isMobileOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobileOpen])

  useEffect(() => {
    if (isMobile) setIsMobileOpen(false)
  }, [pathname, isMobile])

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev)
      return
    }
    setIsSidebarCollapsed((prev) => !prev)
  }

  const closeSidebar = () => setIsMobileOpen(false)

  const activeModule = useMemo(
    () => companyAdminNavItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)),
    [pathname]
  )

  const moduleClass = activeModule?.label
    ? `module-${activeModule.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : 'module-dashboard'

  return (
    <div className={`app-shell admin-shell ${moduleClass} ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
      />
      {isMobile && isMobileOpen ? <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={closeSidebar} /> : null}
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
