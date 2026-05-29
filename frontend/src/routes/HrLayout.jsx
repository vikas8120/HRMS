import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import HrSidebar from '../components/layout/HrSidebar'
import HrNavbar from '../components/layout/HrNavbar'

const MOBILE_BREAKPOINT_QUERY = '(max-width: 980px)'

const getIsMobileViewport = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
}

function HrLayout() {
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

  return (
    <div className={`app-shell manager-shell employee-shell ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
      <HrSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
      />
      {isMobile && isMobileOpen ? <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={closeSidebar} /> : null}
      <div className="content-shell">
        <HrNavbar />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default HrLayout
