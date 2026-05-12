const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== ''

export const requireCompanyScope = (req, res, next) => {
  if (!req.user?.companyId) {
    return res.status(403).json({ success: false, message: 'Forbidden: company scope missing' })
  }

  const scopedCompanyId = String(req.user.companyId)
  const paramCompanyId = req.params?.companyId
  const queryCompanyId = req.query?.companyId
  const bodyCompanyId = req.body?.companyId

  if (hasValue(paramCompanyId) && String(paramCompanyId) !== scopedCompanyId) {
    return res.status(403).json({ success: false, message: 'Forbidden: cross-company access denied (params)' })
  }

  if (hasValue(queryCompanyId) && String(queryCompanyId) !== scopedCompanyId) {
    return res.status(403).json({ success: false, message: 'Forbidden: cross-company access denied (query)' })
  }

  if (hasValue(bodyCompanyId) && String(bodyCompanyId) !== scopedCompanyId) {
    return res.status(403).json({ success: false, message: 'Forbidden: cross-company access denied (body)' })
  }

  req.companyId = scopedCompanyId
  req.companyFilter = { companyId: scopedCompanyId }
  return next()
}
