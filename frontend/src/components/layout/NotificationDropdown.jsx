import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, CheckCheck, CircleAlert, CircleDollarSign, Info, RefreshCw, UserRound, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const notificationSeeds = {
  super_admin: [
    {
      id: 'sa-1',
      title: 'Lead Auto-Reassigned',
      message: 'Parvindar Bhati was auto-reassigned to Priya S. after SLA breach.',
      time: 'Just now',
      type: 'person',
      route: '/super-admin/notifications'
    },
    {
      id: 'sa-2',
      title: 'Lead Escalated to Admin',
      message: 'Parvindar Bhati breached SLA. Unassigned needs immediate review.',
      time: 'Just now',
      type: 'warning',
      route: '/super-admin/notifications'
    },
    {
      id: 'sa-3',
      title: 'Lead Reminder (60 min)',
      message: 'Parvindar Bhati crossed 60 minutes with no action. Immediate response required.',
      time: 'Just now',
      type: 'warning',
      route: '/super-admin/notifications'
    },
    {
      id: 'sa-4',
      title: 'Subscription Renewal Pending',
      message: 'Two client workspaces need billing follow-up today.',
      time: '5 min ago',
      type: 'billing',
      route: '/super-admin/notifications'
    }
  ],
  admin: [
    {
      id: 'admin-1',
      title: 'Payroll Requires Approval',
      message: 'June payroll draft is waiting for final approval.',
      time: 'Just now',
      type: 'billing',
      route: '/admin/payroll'
    },
    {
      id: 'admin-2',
      title: 'Employee Added Successfully',
      message: 'A new employee profile is ready for onboarding review.',
      time: '10 min ago',
      type: 'success',
      route: '/admin/employees'
    },
    {
      id: 'admin-3',
      title: 'Leave Escalation',
      message: 'One urgent leave request has crossed the approval SLA.',
      time: '28 min ago',
      type: 'warning',
      route: '/admin/leaves'
    }
  ],
  hr: [
    {
      id: 'hr-1',
      title: 'Interview Reminder',
      message: 'Three candidate interviews start within the next hour.',
      time: 'Just now',
      type: 'person',
      route: '/hr/dashboard'
    },
    {
      id: 'hr-2',
      title: 'Pending Documents',
      message: 'Two employees still need to upload onboarding documents.',
      time: '12 min ago',
      type: 'warning',
      route: '/hr/profile'
    },
    {
      id: 'hr-3',
      title: 'Attendance Exception',
      message: 'Yesterday attendance sync found 4 mismatched check-ins.',
      time: '35 min ago',
      type: 'info',
      route: '/hr/notifications'
    }
  ],
  manager: [
    {
      id: 'manager-1',
      title: 'Team Task Delayed',
      message: 'A task assigned to Akash is overdue by 1 day.',
      time: 'Just now',
      type: 'warning',
      route: '/manager/notifications'
    },
    {
      id: 'manager-2',
      title: 'Performance Review Due',
      message: 'Two direct reports need this month’s review submission.',
      time: '14 min ago',
      type: 'person',
      route: '/manager/profile'
    },
    {
      id: 'manager-3',
      title: 'Approval Needed',
      message: 'A reimbursement request is waiting in your queue.',
      time: '42 min ago',
      type: 'billing',
      route: '/manager/notifications'
    }
  ],
  employee: [
    {
      id: 'employee-1',
      title: 'Task Reminder',
      message: 'Your check-in task is due before 6:00 PM today.',
      time: 'Just now',
      type: 'info',
      route: '/employee/tasks'
    },
    {
      id: 'employee-2',
      title: 'Announcement Posted',
      message: 'A new company update is available in announcements.',
      time: '18 min ago',
      type: 'success',
      route: '/employee/announcements'
    },
    {
      id: 'employee-3',
      title: 'Payslip Ready',
      message: 'Your latest payslip is now available to download.',
      time: '1 hr ago',
      type: 'billing',
      route: '/employee/payroll'
    }
  ]
}

const notificationIcons = {
  person: UserRound,
  warning: CircleAlert,
  billing: CircleDollarSign,
  success: CheckCheck,
  info: Info
}

function NotificationDropdown({ role = 'super_admin', viewAllPath = '', viewAllLabel = 'View all' }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const [notifications, setNotifications] = useState([])
  const wrapRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const storageKey = `hrms-notification-popup-${role}`

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNotifications(Array.isArray(parsed) ? parsed : notificationSeeds[role] || notificationSeeds.super_admin)
        return
      } catch (_error) {
        window.localStorage.removeItem(storageKey)
      }
    }
    setNotifications(notificationSeeds[role] || notificationSeeds.super_admin)
  }, [role, storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notifications))
  }, [notifications, storageKey])

  useEffect(() => {
    const onPushNotification = (event) => {
      const detail = event?.detail || {}
      if (detail.role && detail.role !== role) return
      const nextNotification = {
        id: detail.id || `${role}-${Date.now()}`,
        title: detail.title || 'Notification',
        message: detail.message || '',
        time: detail.time || 'Just now',
        type: detail.type || 'info',
        route: detail.route || viewAllPath || '',
        read: false
      }
      setNotifications((current) => [nextNotification, ...current])
    }
    window.addEventListener('hrms:notification-push', onPushNotification)
    return () => window.removeEventListener('hrms:notification-push', onPushNotification)
  }, [role, viewAllPath])

  useEffect(() => {
    const onDocClick = (event) => {
      if (wrapRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const updateMenuPosition = () => {
      const trigger = wrapRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuWidth = Math.min(420, Math.max(320, window.innerWidth < 520 ? window.innerWidth - 20 : 396))
      const viewportPadding = 10
      const left = Math.min(
        Math.max(viewportPadding, rect.right - menuWidth),
        window.innerWidth - menuWidth - viewportPadding
      )

      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 10,
        left,
        width: menuWidth,
        maxWidth: `calc(100vw - ${viewportPadding * 2}px)`
      })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])
  const unreadLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
  }

  const markRead = (notificationId) => {
    setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)))
  }

  const dismiss = (notificationId) => {
    setNotifications((current) => current.filter((item) => item.id !== notificationId))
  }

  const handleNotificationClick = (item) => {
    markRead(item.id)
    setOpen(false)
    if (item.route) navigate(item.route)
  }

  const handleViewAll = () => {
    setOpen(false)
    if (viewAllPath) navigate(viewAllPath)
  }

  const dropdownMenu = open ? createPortal(
    <div ref={menuRef} className="notification-dropdown-menu" style={menuStyle}>
      <div className="notification-dropdown-top">
        <div className="notification-dropdown-title">
          <Bell size={16} />
          <strong>Notifications</strong>
          <span className="notification-count-pill">{unreadCount} new</span>
        </div>
        <button type="button" className="notification-inline-action" onClick={markAllRead}>
          <CheckCheck size={15} />
          <span>Mark all read</span>
        </button>
      </div>

      <div className="notification-dropdown-list">
        {notifications.length === 0 ? (
          <div className="notification-empty-state">
            <p>All caught up.</p>
            {viewAllPath ? (
              <button type="button" className="notification-inline-action" onClick={handleViewAll}>
                <RefreshCw size={15} />
                <span>{viewAllLabel}</span>
              </button>
            ) : null}
          </div>
        ) : notifications.map((item) => {
          const Icon = notificationIcons[item.type] || Info
          return (
            <div key={item.id} className={`notification-card ${item.read ? 'read' : 'unread'}`}>
              <button type="button" className="notification-card-main" onClick={() => handleNotificationClick(item)}>
                <span className={`notification-icon type-${item.type}`}>
                  <Icon size={16} />
                </span>
                <span className="notification-copy">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <small>{item.time}</small>
                </span>
              </button>
              <div className="notification-card-actions">
                {!item.read ? <span className="notification-unread-dot" /> : null}
                <button
                  type="button"
                  className="notification-dismiss-btn"
                  onClick={() => dismiss(item.id)}
                  aria-label={`Dismiss ${item.title}`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {viewAllPath ? (
        <button type="button" className="notification-footer-link" onClick={handleViewAll}>
          {viewAllLabel}
        </button>
      ) : null}
    </div>,
    document.body
  ) : null

  return (
    <div className="notification-dropdown" ref={wrapRef}>
      <button
        type="button"
        className={`icon-btn notification-trigger ${unreadCount > 0 ? 'has-badge' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell size={16} />
        {unreadCount > 0 ? <span className="notification-trigger-badge">{unreadLabel}</span> : null}
      </button>
      {dropdownMenu}
    </div>
  )
}

export default NotificationDropdown
