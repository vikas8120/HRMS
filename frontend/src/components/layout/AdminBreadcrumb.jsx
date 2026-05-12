import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const prettify = (value) => value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function AdminBreadcrumb() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const filteredParts = parts.filter((part) => part !== 'admin')

  const crumbItems = filteredParts.map((part, index) => {
    const to = `/admin/${filteredParts.slice(0, index + 1).join('/')}`
    return { label: prettify(part), to, isLast: index === filteredParts.length - 1 }
  })

  return (
    <div className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/admin/dashboard" className="breadcrumb-home"><Home size={14} /> Home</Link>
      {crumbItems.map((item) => (
        <span key={item.to} className="breadcrumb-item">
          <ChevronRight size={14} />
          {item.isLast ? <strong>{item.label}</strong> : <Link to={item.to}>{item.label}</Link>}
        </span>
      ))}
    </div>
  )
}

export default AdminBreadcrumb
