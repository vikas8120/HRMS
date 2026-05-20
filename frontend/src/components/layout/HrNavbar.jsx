import { Bell, LogOut, Moon, Search, Sun, UserCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { hrNavItems } from '../../data/hrPortalData'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import Button from '../ui/Button'

function HrNavbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const activeLabel = useMemo(() => {
    const active = hrNavItems.find((item) => item.path === pathname)
    return active?.label || 'HR Dashboard'
  }, [pathname])

  return (
    <header className="navbar">
      <div className="search-box">
        <Search size={16} />
        <input className="search-input" readOnly value={`${activeLabel} workspace`} />
      </div>
      <div className="navbar-actions">
        <button className="icon-btn" onClick={toggleTheme}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>
        <button className="icon-btn has-badge"><Bell size={16} /></button>
        <div className="profile-menu"><UserCircle2 size={18} /><span>{user?.name || 'HR User'}</span></div>
        <Button variant="danger" onClick={logout}><LogOut size={14} /> Logout</Button>
      </div>
    </header>
  )
}

export default HrNavbar

