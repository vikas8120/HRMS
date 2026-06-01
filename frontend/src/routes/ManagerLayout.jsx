import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ManagerSidebar from '../components/layout/ManagerSidebar'
import ManagerNavbar from '../components/layout/ManagerNavbar'
import ManagerBreadcrumb from '../components/layout/ManagerBreadcrumb'
import { managerNavItems } from '../data/managerPortalData'

const MOBILE_BREAKPOINT_QUERY = '(max-width: 980px)'

const getIsMobileViewport = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
}

function MobileSidebarDrawer({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            key="sidebar-backdrop"
            className="sidebar-backdrop"
            aria-label="Close sidebar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            key="drawer-shell"
            className="mobile-sidebar-shell"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <ManagerSidebar isCollapsed={false} isMobileOpen={isOpen} isMobile onToggle={onClose} onClose={onClose} />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function ManagerLayout() {
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
    () => managerNavItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)),
    [pathname]
  )
  const moduleClass = activeModule?.label
    ? `module-${activeModule.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : 'module-manager-dashboard'

  return (
    <div className={`app-shell super-admin-shell manager-shell ${moduleClass} ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
      {!isMobile ? (
        <ManagerSidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={false}
          isMobile={false}
          onToggle={toggleSidebar}
          onClose={closeSidebar}
        />
      ) : null}
      {isMobile ? <MobileSidebarDrawer isOpen={isMobileOpen} onClose={closeSidebar} /> : null}
      <div className="content-shell">
        <ManagerNavbar />
        <ManagerBreadcrumb />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default ManagerLayout
