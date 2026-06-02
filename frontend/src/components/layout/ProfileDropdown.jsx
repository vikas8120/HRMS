import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

function ProfileDropdown({ user, profilePath, onLogout, fallbackLabel = 'Profile' }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const wrapRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const onDocClick = (event) => {
      if (wrapRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined

    const updateMenuPosition = () => {
      const trigger = wrapRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuWidth = Math.max(260, rect.width + 20)
      const viewportPadding = 12
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

  const initials = useMemo(() => {
    const name = String(user?.name || fallbackLabel || 'U').trim()
    if (!name) return 'U'
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }, [fallbackLabel, user?.name])

  const goToProfile = () => {
    setOpen(false)
    if (profilePath) navigate(profilePath)
  }

  const dropdownMenu = open ? createPortal(
    <div ref={menuRef} className="profile-dropdown-menu" style={menuStyle}>
      <button type="button" className="profile-dropdown-header" onClick={goToProfile}>
        <div className="profile-avatar profile-avatar-large">
          {user?.profileImage ? <img src={user.profileImage} alt={user?.name || 'Profile'} /> : <span>{initials}</span>}
        </div>
        <div className="profile-dropdown-meta">
          <strong>{user?.name || fallbackLabel}</strong>
          <span>{user?.email || ''}</span>
          <small>{String(user?.role || fallbackLabel).replace(/_/g, ' ')}</small>
        </div>
      </button>
      <div className="profile-dropdown-divider" />
      <button type="button" className="profile-dropdown-item" onClick={goToProfile}>
        <UserRound size={16} />
        <span>My Profile</span>
      </button>
      <button type="button" className="profile-dropdown-item danger" onClick={() => { setOpen(false); onLogout?.() }}>
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>
    </div>,
    document.body
  ) : null

  return (
    <div className="profile-dropdown" ref={wrapRef}>
      <button
        type="button"
        className="profile-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="profile-avatar">
          {user?.profileImage ? <img src={user.profileImage} alt={user?.name || 'Profile'} /> : <span>{initials}</span>}
        </div>
        <div className="profile-copy">
          <strong>{user?.name || fallbackLabel}</strong>
          <span>{String(user?.role || fallbackLabel).replace(/_/g, ' ')}</span>
        </div>
        <ChevronDown size={15} className={`profile-chevron ${open ? 'open' : ''}`} />
      </button>
      {dropdownMenu}
    </div>
  )
}

export default ProfileDropdown
