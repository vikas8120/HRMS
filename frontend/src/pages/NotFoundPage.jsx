import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>404 - Page Not Found</h1>
        <p>The page you requested does not exist or the route is incorrect.</p>
        <Link to="/super-admin/dashboard">Go to Dashboard</Link>
      </div>
    </div>
  )
}

export default NotFoundPage
