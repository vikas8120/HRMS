import { Link } from 'react-router-dom'

function UnauthorizedPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Unauthorized</h1>
        <p>You do not have permission to access this page.</p>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  )
}

export default UnauthorizedPage
