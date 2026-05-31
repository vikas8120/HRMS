import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, LogOut, Search, UserCircle2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

const employeeSearchItems = [
  { type: 'module', title: 'Dashboard', subtitle: 'Employee overview', route: '/employee/dashboard' },
  { type: 'module', title: 'Profile', subtitle: 'Personal details', route: '/employee/profile' },
  { type: 'module', title: 'Feedback', subtitle: 'Submit and track feedback', route: '/employee/feedback' },
  { type: 'module', title: 'Grievance', subtitle: 'Raise and track grievances', route: '/employee/grievance' },
  { type: 'module', title: 'Complaint Box', subtitle: 'Raise confidential complaints', route: '/employee/complaint-box' },
  { type: 'module', title: 'Attendance', subtitle: 'Daily attendance log', route: '/employee/attendance' },
  { type: 'module', title: 'Leaves', subtitle: 'Leave requests and balance', route: '/employee/leaves' },
  { type: 'module', title: 'Salary Slip', subtitle: 'Salary and payslips', route: '/employee/payroll' },
  { type: 'module', title: 'Policy', subtitle: 'View and download policies', route: '/employee/policy' },
  { type: 'module', title: 'Announcements', subtitle: 'Company announcements', route: '/employee/announcements' },
  { type: 'module', title: 'Notifications', subtitle: 'Alerts and reminders', route: '/employee/notifications' },
  { type: 'module', title: 'Settings', subtitle: 'Account settings', route: '/employee/settings' }
]

function EmployeeNavbar() {
  const auth = useAuth()
  const user = auth?.user || null
  const logout = auth?.logout || (() => {})
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDocClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (value.length < 2) return []
    return employeeSearchItems
      .filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(value))
      .slice(0, 10)
  }, [query])

  const activeLabel = useMemo(() => {
    const active = employeeSearchItems.find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`))
    return active?.title || 'Employee Workspace'
  }, [pathname])

  const goToResult = (route) => {
    setOpen(false)
    setQuery('')
    navigate(route)
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'Enter' && results[0]?.route) {
      event.preventDefault()
      goToResult(results[0].route)
    }
  }

  return (
    <header className="navbar">
      <div className="search-box" ref={wrapRef}>
        <Search size={16} />
        <input
          className="search-input"
          type="search"
          name="hrms_global_search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={`Search ${activeLabel.toLowerCase()}...`}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleSearchKeyDown}
        />
        {open ? (
          <div className="global-search-dropdown">
            {query.trim().length < 2 ? <p className="global-search-item">Type at least 2 characters</p> : null}
            {query.trim().length >= 2 && results.length === 0 ? <p className="global-search-item">No results found</p> : null}
            {query.trim().length >= 2 && results.length > 0 ? <p className="global-search-item global-search-hint">Press Enter to open first result</p> : null}
            {results.map((item, index) => (
              <button
                type="button"
                key={`${item.type}-${item.title}-${index}`}
                className="global-search-item global-search-btn"
                onClick={() => goToResult(item.route)}
              >
                <strong>{item.title}</strong>
                <span>{item.type} - {item.subtitle}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="navbar-actions">
        <button
          className="icon-btn has-badge"
          aria-label="Notifications"
          onClick={() => navigate('/employee/notifications')}
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          className="profile-menu"
          onClick={() => navigate('/employee/profile')}
          aria-label="Open profile"
        >
          <UserCircle2 size={18} />
          <span>{user?.name || 'Employee'}</span>
        </button>
        <Button variant="danger" onClick={logout}><LogOut size={14} /> Logout</Button>
      </div>
    </header>
  )
}

export default EmployeeNavbar
