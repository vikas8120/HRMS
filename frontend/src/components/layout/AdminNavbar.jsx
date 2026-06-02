import { Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import NotificationDropdown from './NotificationDropdown'
import ProfileDropdown from './ProfileDropdown'

function AdminNavbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="search-box">
        <Search size={16} />
        <input className="search-input" readOnly value="" placeholder="Search employee, manager, payroll..." />
      </div>
      <div className="navbar-actions">
        <NotificationDropdown role="admin" viewAllPath="/admin/dashboard" viewAllLabel="Open dashboard" />
        <ProfileDropdown
          user={user}
          profilePath="/admin/profile"
          onLogout={logout}
          fallbackLabel="Company Admin"
        />
      </div>
    </header>
  )
}

export default AdminNavbar
