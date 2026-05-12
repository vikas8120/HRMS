import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import Breadcrumb from '../components/layout/Breadcrumb'
import { navItems } from '../data/dashboardData'

const MOBILE_BREAKPOINT_QUERY = '(max-width: 980px)'

const getIsMobileViewport = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
}

function SuperAdminLayout() {
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
    () => navItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)),
    [pathname]
  )

  const showWorkspaceNav = Boolean(activeModule && activeModule.path !== '/super-admin/dashboard' && activeModule.children.length)
  const moduleClass = activeModule?.label
    ? `module-${activeModule.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : 'module-dashboard'

  return (
    <div className={`app-shell ${moduleClass} ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
      />
      {isMobile && isMobileOpen ? <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={closeSidebar} /> : null}
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
