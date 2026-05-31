import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import Breadcrumb from '../components/layout/Breadcrumb'
import { navItems } from '../data/dashboardData'

const MOBILE_BREAKPOINT_QUERY = '(max-width: 980px)'
const workspaceGroupsByModule = {
  'Company Management': [
    {
      title: 'Core',
      items: ['Company Management', 'Company Configuration', 'Company Branding', 'Company Domain Setup']
    },
    {
      title: 'Operations',
      items: ['Branch Management', 'Company Storage Usage', 'Company Activity Logs']
    },
    {
      title: 'Lifecycle',
      items: ['Company Suspension', 'Company Reactivation']
    }
  ],
  'Admin Management': [
    {
      title: 'Administration',
      items: ['Admin Management', 'Role Assignment', 'Permission Control']
    },
    {
      title: 'Security',
      items: ['Reset Password', 'Account Lock/Unlock']
    },
    {
      title: 'Audit',
      items: ['Admin Access Logs', 'Admin Activity Tracking']
    }
  ],
  'Subscription & Billing': [
    {
      title: 'Plans',
      items: ['Subscription Plans', 'Feature Mapping', 'Plan Limits', 'Add-on Services']
    },
    {
      title: 'Lifecycle',
      items: ['Plan Upgrade/Downgrade', 'Auto Renewal', 'Subscription History']
    },
    {
      title: 'Billing Operations',
      items: ['Invoice Management', 'Generate Invoice', 'Payment Tracking', 'Discount Coupons']
    }
  ],
  'Revenue & Analytics': [
    {
      title: 'Revenue Views',
      items: ['Monthly Revenue', 'Annual Revenue', 'Revenue by Plan', 'Top Paying Customers']
    },
    {
      title: 'Growth Metrics',
      items: ['MRR Analytics', 'ARR Analytics', 'Revenue Forecasting', 'Renewal Rate', 'Churn Analytics']
    }
  ],
  'Feature Management': [
    {
      title: 'Controls',
      items: ['Module Enable/Disable']
    },
    {
      title: 'Access',
      items: ['Tenant-wise Features', 'Plan-wise Features', 'API Feature Access', 'AI Feature Access']
    },
    {
      title: 'Limits & Channels',
      items: ['Usage Limits']
    }
  ],
  'Support Center': [
    {
      title: 'Ticket Queue',
      items: ['Ticket Dashboard', 'Open Tickets', 'Closed Tickets', 'Escalated Tickets']
    }
  ],
  'Audit & Security': [
    {
      title: 'Logs',
      items: ['Login Logs', 'User Activity Logs', 'Company Activity Logs', 'Admin Activity Logs', 'API Logs', 'Security Logs', 'Billing Logs', 'Device Logs']
    },
    {
      title: 'Governance',
      items: ['Configuration Changes', 'Permission Changes', 'Export Logs']
    },
    {
      title: 'Security Policies',
      items: ['Password Policies', 'Two-Factor Authentication', 'SSO Settings', 'OAuth Settings', 'IP Whitelisting', 'Session Timeout', 'Captcha Settings', 'Token Expiry Settings', 'Threat Monitoring', 'IP Tracking']
    }
  ],
  Integrations: [
    {
      title: 'Identity & Collaboration',
      items: ['Google Workspace', 'Microsoft 365', 'Slack', 'Zoom', 'Teams']
    },
    {
      title: 'Finance & Messaging',
      items: ['Payment Gateway', 'Accounting Software', 'Email Integration', 'SMS Gateway', 'WhatsApp API']
    },
    {
      title: 'Devices & APIs',
      items: ['Biometric Devices', 'Maps API', 'Webhooks', 'Third-party Marketplace']
    }
  ],
  'AI Center': [
    {
      title: 'Insights',
      items: ['AI Dashboard', 'AI Attendance Insights', 'AI Attrition Prediction', 'AI Payroll Analytics', 'AI Usage Analytics']
    },
    {
      title: 'Automation',
      items: ['AI Chatbot', 'AI Auto Reports', 'AI Automation Rules']
    },
    {
      title: 'Risk',
      items: ['AI Fraud Detection']
    }
  ],
  'Backup & Restore': [
    {
      title: 'Backup',
      items: ['Database Backup', 'File Backup', 'Automatic Backup', 'Manual Backup', 'Backup Scheduling', 'Cloud Backup', 'Backup Encryption', 'Backup Logs']
    },
    {
      title: 'Restore',
      items: ['Restore Database', 'Restore Files', 'Disaster Recovery']
    }
  ],
  Reports: [
    {
      title: 'Business Reports',
      items: ['Tenant Reports', 'Revenue Reports', 'Subscription Reports', 'Billing Reports']
    },
    {
      title: 'Ops Reports',
      items: ['User Reports', 'Support Reports', 'Storage Reports', 'System Health Reports']
    },
    {
      title: 'Security & Platform',
      items: ['Security Reports', 'Login Reports', 'API Usage Reports', 'Audit Reports', 'Export Center']
    }
  ],
  'System Settings': [
    {
      title: 'Core',
      items: ['General Settings', 'Language Settings', 'Theme Management', 'Application Version', 'Maintenance Mode']
    },
    {
      title: 'Communication',
      items: ['Email Settings', 'SMS Settings', 'WhatsApp Settings', 'Notification Templates']
    },
    {
      title: 'Localization & Policy',
      items: ['Timezone Settings', 'Currency Settings', 'Date Format', 'File Upload Limits', 'Branding Settings']
    }
  ]
}

const auditLogFilterLabels = new Set([
  'Login Logs',
  'User Activity Logs',
  'Company Activity Logs',
  'Admin Activity Logs',
  'API Logs',
  'Security Logs',
  'Configuration Changes',
  'Permission Changes',
  'Billing Logs',
  'Device Logs',
  'Export Logs'
])

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
  const workspaceGroups = useMemo(() => {
    if (!activeModule) return []
    const config = workspaceGroupsByModule[activeModule.label]
    if (!config?.length) return [{ title: '', children: activeModule.children }]

    const byLabel = new Map(activeModule.children.map((child) => [child.label, child]))
    const grouped = config.map((group) => ({
      title: group.title,
      children: group.items.map((label) => byLabel.get(label)).filter(Boolean)
    })).filter((group) => group.children.length > 0)

    const groupedLabels = new Set(grouped.flatMap((group) => group.children.map((child) => child.label)))
    const ungrouped = activeModule.children.filter((child) => !groupedLabels.has(child.label))
    if (ungrouped.length) grouped.push({ title: 'Other', children: ungrouped })
    return grouped
  }, [activeModule])
  const activeChildPath = useMemo(() => {
    if (!activeModule) return ''
    const matched = activeModule.children.find((child) => pathname === child.path || pathname.startsWith(`${child.path}/`))
    return matched?.path || ''
  }, [activeModule, pathname])
  const activeGroupIndex = useMemo(() => {
    if (!workspaceGroups.length) return 0
    const index = workspaceGroups.findIndex((group) => group.children.some((child) => child.path === activeChildPath))
    return index >= 0 ? index : 0
  }, [workspaceGroups, activeChildPath])
  const showGroupedNav = workspaceGroups.some((group) => group.title)
  const activeGroup = workspaceGroups[activeGroupIndex] || null
  const hideWorkspaceNavInLayout = activeModule?.label === 'Admin Management'
  const hideSubmoduleNavInLayout =
    activeModule?.label === 'Reports' ||
    activeModule?.label === 'Backup & Restore' ||
    activeModule?.label === 'AI Center' ||
    activeModule?.label === 'Integrations'
  const collapseWorkspaceGroupsToSingleRow =
    activeModule?.label === 'Audit & Security' ||
    activeModule?.label === 'System Settings'

  return (
    <div className={`app-shell super-admin-shell ${moduleClass} ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
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

        {showWorkspaceNav && !hideWorkspaceNavInLayout && !collapseWorkspaceGroupsToSingleRow ? (
          <div className="workspace-nav" aria-label="Workspace section navigation">
            {showGroupedNav
              ? workspaceGroups.map((group, index) => {
                  const firstPath = group.children[0]?.path || activeModule.path
                  return (
                    <NavLink
                      key={group.title || `group-${index}`}
                      to={firstPath}
                      className={`workspace-nav-chip ${index === activeGroupIndex ? 'active' : ''}`}
                    >
                      {(group.title || 'Group').toUpperCase()}
                    </NavLink>
                  )
                })
              : activeModule.children.map((child) => (
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
          {showWorkspaceNav && !hideWorkspaceNavInLayout && !hideSubmoduleNavInLayout && collapseWorkspaceGroupsToSingleRow ? (
            <div className={`workspace-subnav ${activeModule?.label === 'Audit & Security' ? 'audit-security-subnav' : ''}`} aria-label="Sub-module navigation">
              {activeModule.children
                .filter((child) => (activeModule?.label === 'Audit & Security' ? !auditLogFilterLabels.has(child.label) : true))
                .map((child) => (
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
          {showWorkspaceNav && !hideWorkspaceNavInLayout && !hideSubmoduleNavInLayout && !collapseWorkspaceGroupsToSingleRow && showGroupedNav && activeGroup?.children?.length ? (
            <div className="workspace-subnav" aria-label="Sub-module navigation">
              {activeGroup.children.map((child) => (
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
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLayout

