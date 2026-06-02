import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { managerNavItems } from '../../data/managerPortalData'
import { useAuth } from '../../hooks/useAuth'
import NotificationDropdown from './NotificationDropdown'
import ProfileDropdown from './ProfileDropdown'

function ManagerNavbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const activeLabel = useMemo(() => {
    const active = managerNavItems.find((item) => item.path === pathname)
    return active?.label || 'Dashboard'
  }, [pathname])

  return (
    <header className="navbar">
      <div className="search-box">
        <Search size={16} />
        <input className="search-input" readOnly value={`${activeLabel} workspace`} />
      </div>
      <div className="navbar-actions">
        <NotificationDropdown role="manager" viewAllPath="/manager/notifications" viewAllLabel="Open notifications" />
        <ProfileDropdown
          user={user}
          profilePath="/manager/profile"
          onLogout={logout}
          fallbackLabel="Manager User"
        />
      </div>
    </header>
  )
}

export default ManagerNavbar
