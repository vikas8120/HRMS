import { Bell, LogOut, Search, UserCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { managerNavItems } from '../../data/managerPortalData'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

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
        <button className="icon-btn has-badge"><Bell size={16} /></button>
        <div className="profile-menu"><UserCircle2 size={18} /><span>{user?.name || 'Manager User'}</span></div>
        <Button variant="danger" onClick={logout}><LogOut size={14} /> Logout</Button>
      </div>
    </header>
  )
}

export default ManagerNavbar
