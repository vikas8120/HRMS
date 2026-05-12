export const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase()
  const normalized = allowedRoles.map((item) => String(item || '').toLowerCase())

  if (!role || !normalized.includes(role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role permission' })
  }

  return next()
}
