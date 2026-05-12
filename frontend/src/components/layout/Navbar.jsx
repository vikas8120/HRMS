import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Moon, Search, Sun, UserCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import { globalSearch } from '../../api/dashboardApi'

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDocClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(() => {
    const value = query.trim()
    if (value.length < 2) {
      setResults([])
      setLoading(false)
      return undefined
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await globalSearch(value)
        setResults(res?.results || [])
        setOpen(true)
      } catch (_err) {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

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
          placeholder="Search company, admin, invoice..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleSearchKeyDown}
        />
        {open ? (
          <div className="global-search-dropdown">
            {loading ? <p className="global-search-item">Searching...</p> : null}
            {!loading && results.length === 0 ? <p className="global-search-item">No results found</p> : null}
            {!loading && results.length > 0 ? <p className="global-search-item global-search-hint">Press Enter to open first result</p> : null}
            {!loading && results.map((item, index) => (
              <button
                type="button"
                key={`${item.type}-${item.title}-${index}`}
                className="global-search-item global-search-btn"
                onClick={() => goToResult(item.route)}
              >
                <strong>{item.title}</strong>
                <span>{item.type} · {item.subtitle}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="navbar-actions">
        <button className="icon-btn" onClick={toggleTheme}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>
        <button className="icon-btn has-badge"><Bell size={16} /></button>
        <div className="profile-menu"><UserCircle2 size={18} /><span>{user?.name || 'Guest'}</span></div>
        <Button variant="danger" onClick={logout}><LogOut size={14} /> Logout</Button>
      </div>
    </header>
  )
}

export default Navbar
